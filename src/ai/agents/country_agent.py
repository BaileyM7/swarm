"""Country-agent LangGraph node.

A ``CountryAgent`` represents a single national decision-maker.  It is invoked
once per turn with a ``Perception`` (redacted world view + retrieved memories)
and returns a ``ProposedAction`` via Anthropic tool use.

Design notes:
  * The LLM is driven with **tool use**, not JSON mode.  Tool schemas are the
    enum of legal action types; forcing the model through a tool guarantees
    structured output and provides built-in validation.
  * Each tool returns a ``ProposedAction`` — we do not accept free-form text.
  * The system prompt template is loaded from ``prompts/country_agent.md`` and
    rendered with ``str.format`` (simple, readable, auditable).
  * Tests inject a fake Anthropic client (any object with ``.ainvoke(messages)``
    → returning a message whose ``tool_calls`` attribute is set).  The real
    implementation uses ``langchain_anthropic.ChatAnthropic``.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol

import structlog
from pydantic import BaseModel, ConfigDict, Field

from shared.schemas.sim_event import Domain

from ai.sim.world import ProposedAction

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Tool schemas (Anthropic tool-use JSON format)
# ---------------------------------------------------------------------------


_COMMON_SCHEMA_BASE: dict[str, Any] = {
    "rationale": {
        "type": "string",
        "description": "2–4 sentence reasoning chain; audit-quality prose.",
    },
    "estimated_escalation_rung": {
        "type": "integer",
        "minimum": 0,
        "maximum": 5,
        "description": "0=peacetime, 1=gray_zone, 2=coercive, 3=limited, 4=regional, 5=general.",
    },
}


COUNTRY_AGENT_TOOLS: list[dict[str, Any]] = [
    {
        "name": "diplomatic_action",
        "description": "Issue a diplomatic statement, recall an envoy, call a summit.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target": {"type": "string", "description": "ISO-3 code of target country."},
                "action_type": {
                    "type": "string",
                    "description": "Slug, e.g. 'formal_protest', 'envoy_recall', 'summit_call'.",
                },
                "severity": {
                    "type": "string",
                    "enum": ["mild", "moderate", "severe"],
                },
                "message": {"type": "string", "description": "Public text of the statement."},
                **_COMMON_SCHEMA_BASE,
            },
            "required": ["target", "action_type", "severity", "message", "rationale"],
        },
    },
    {
        "name": "economic_action",
        "description": "Impose sanctions, tariffs, export controls, or asset freezes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target": {"type": "string"},
                "instrument": {
                    "type": "string",
                    "enum": ["sanction", "tariff", "export_control", "asset_freeze", "embargo"],
                },
                "magnitude": {
                    "type": "string",
                    "enum": ["symbolic", "targeted", "broad", "severe", "total_embargo"],
                },
                **_COMMON_SCHEMA_BASE,
            },
            "required": ["target", "instrument", "magnitude", "rationale"],
        },
    },
    {
        "name": "information_action",
        "description": "Run a propaganda operation, leak intelligence, or issue a public statement.",
        "input_schema": {
            "type": "object",
            "properties": {
                "channel": {
                    "type": "string",
                    "enum": ["state_media", "social_media", "covert_leak", "press_conference"],
                },
                "target": {
                    "type": "string",
                    "description": "ISO-3 of targeted country; empty string for domestic/global.",
                },
                "content_type": {
                    "type": "string",
                    "enum": ["propaganda", "leak", "public_statement", "denial"],
                },
                **_COMMON_SCHEMA_BASE,
            },
            "required": ["channel", "target", "content_type", "rationale"],
        },
    },
    {
        "name": "cyber_action",
        "description": "Execute a cyber operation against a target.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target": {"type": "string"},
                "vector": {
                    "type": "string",
                    "enum": ["phishing", "supply_chain", "network_intrusion", "wiper", "ddos"],
                },
                "intent": {
                    "type": "string",
                    "enum": ["espionage", "disruption", "destructive"],
                },
                **_COMMON_SCHEMA_BASE,
            },
            "required": ["target", "vector", "intent", "rationale"],
        },
    },
    {
        "name": "kinetic_action",
        "description": "Deploy military force: show-of-force, limited strike, or major strike.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target": {"type": "string"},
                "asset": {"type": "string", "description": "Asset deployed (e.g. 'carrier_group')."},
                "posture": {
                    "type": "string",
                    "enum": ["show_of_force", "limited_strike", "major_strike"],
                },
                **_COMMON_SCHEMA_BASE,
            },
            "required": ["target", "asset", "posture", "rationale"],
        },
    },
    {
        "name": "no_action",
        "description": "Explicit inaction. A legitimate strategic choice.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {"type": "string"},
                **_COMMON_SCHEMA_BASE,
            },
            "required": ["reason", "rationale"],
        },
    },
]


# Map tool name → Domain
_TOOL_DOMAIN: dict[str, Domain] = {
    "diplomatic_action": Domain.diplomatic,
    "economic_action": Domain.economic,
    "information_action": Domain.info,
    "cyber_action": Domain.cyber,
    "kinetic_action": Domain.kinetic_limited,  # kinetic_general only for major_strike
    "no_action": Domain.diplomatic,  # sentinel; no_action never emits a SimEvent
}


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


class MemoryRecord(BaseModel):
    """Single retrieved memory fragment (subset of the stored row)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    content: str
    memory_type: str = "observation"
    turn: int = 0
    score: float = 0.0


@dataclass
class Perception:
    """Bundle of everything the agent sees in the `perceive` step."""

    country_iso3: str
    country_name: str
    doctrine: str
    red_lines: list[str]
    current_posture: dict[str, str]
    resource_budget: dict[str, int]
    world_view: dict[str, Any]  # from WorldState.summarize_for()
    memories: list[MemoryRecord] = field(default_factory=list)


# ---------------------------------------------------------------------------
# LLM client protocol (for testability)
# ---------------------------------------------------------------------------


class ToolCall(BaseModel):
    """Shape of a tool-use response chunk — matches LangChain's structure."""

    model_config = ConfigDict(extra="allow")

    name: str
    args: dict[str, Any]
    id: str = ""


class LLMResponse(BaseModel):
    """Minimal subset of ``AIMessage`` that the agent needs."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    tool_calls: list[ToolCall] = Field(default_factory=list)
    content: str = ""


class LLMClient(Protocol):
    """Anything that can accept (system, human) messages and return tool calls."""

    async def ainvoke_tools(
        self,
        system_prompt: str,
        human_prompt: str,
        tools: list[dict[str, Any]],
    ) -> LLMResponse:  # pragma: no cover — protocol only
        ...


# ---------------------------------------------------------------------------
# Prompt rendering
# ---------------------------------------------------------------------------


_PROMPT_PATH = Path(__file__).parent / "prompts" / "country_agent.md"


def _load_prompt_template() -> str:
    """Read the country-agent system-prompt template from disk."""
    return _PROMPT_PATH.read_text(encoding="utf-8")


def render_country_prompt(perception: Perception, memories: list[MemoryRecord]) -> str:
    """Render the system prompt for a specific country's turn.

    The template uses ``{placeholder}`` tokens that we substitute via
    ``str.format_map`` so unknown placeholders raise instead of silently
    rendering empty.
    """
    template = _load_prompt_template()

    memory_block = (
        "\n".join(f"- [{m.memory_type} t={m.turn}] {m.content}" for m in memories)
        if memories
        else "(no prior memories)"
    )

    # We cannot use str.format_map naively because the prompt body contains
    # braces in HTML-comment examples.  Use a simple ``.replace()`` loop on
    # the handful of tokens we actually care about.
    subs = {
        "{country_name}": perception.country_name,
        "{country_iso3}": perception.country_iso3,
        "{turn}": str(perception.world_view.get("turn", 0)),
        "{doctrine}": perception.doctrine or "(no explicit doctrine set)",
        "{red_lines}": (
            "\n".join(f"- {r}" for r in perception.red_lines)
            if perception.red_lines
            else "(none declared)"
        ),
        "{current_posture}": json.dumps(perception.current_posture, indent=2),
        "{resource_budget}": json.dumps(perception.resource_budget, indent=2),
        "{memory_snippets}": memory_block,
        "{recent_perception}": json.dumps(perception.world_view, indent=2, default=str),
    }
    rendered = template
    for token, value in subs.items():
        rendered = rendered.replace(token, value)
    return rendered


# ---------------------------------------------------------------------------
# Tool-call → ProposedAction mapping
# ---------------------------------------------------------------------------


def tool_call_to_action(actor: str, call: ToolCall) -> ProposedAction:
    """Convert an Anthropic tool-use call into a ``ProposedAction``.

    The ``actor`` field is injected (not part of the tool schema — the agent
    cannot spoof being a different country).

    Raises:
        ValueError: If the tool name is unknown.
    """
    name = call.name
    args = call.args
    rationale = str(args.get("rationale", ""))
    estimated = int(args.get("estimated_escalation_rung", 0))

    if name == "diplomatic_action":
        return ProposedAction(
            actor=actor,
            target=_normalise_target(args.get("target")),
            domain=Domain.diplomatic,
            action_type=str(args.get("action_type", "statement")),
            payload={
                "severity": args.get("severity"),
                "message": args.get("message", ""),
            },
            rationale=rationale,
            estimated_escalation_rung=estimated,
        )
    if name == "economic_action":
        return ProposedAction(
            actor=actor,
            target=_normalise_target(args.get("target")),
            domain=Domain.economic,
            action_type=str(args.get("instrument", "sanction")),
            payload={
                "instrument": args.get("instrument"),
                "magnitude": args.get("magnitude"),
            },
            rationale=rationale,
            estimated_escalation_rung=estimated,
        )
    if name == "information_action":
        return ProposedAction(
            actor=actor,
            target=_normalise_target(args.get("target")),
            domain=Domain.info,
            action_type=str(args.get("content_type", "public_statement")),
            payload={
                "channel": args.get("channel"),
                "content_type": args.get("content_type"),
            },
            rationale=rationale,
            estimated_escalation_rung=estimated,
        )
    if name == "cyber_action":
        return ProposedAction(
            actor=actor,
            target=_normalise_target(args.get("target")),
            domain=Domain.cyber,
            action_type=str(args.get("vector", "intrusion")),
            payload={
                "vector": args.get("vector"),
                "intent": args.get("intent"),
            },
            rationale=rationale,
            estimated_escalation_rung=estimated,
        )
    if name == "kinetic_action":
        posture = str(args.get("posture", "show_of_force"))
        # Map major_strike → kinetic_general
        domain = Domain.kinetic_general if posture == "major_strike" else Domain.kinetic_limited
        return ProposedAction(
            actor=actor,
            target=_normalise_target(args.get("target")),
            domain=domain,
            action_type=posture,
            payload={
                "asset": args.get("asset"),
                "posture": posture,
            },
            rationale=rationale,
            estimated_escalation_rung=estimated,
        )
    if name == "no_action":
        return ProposedAction(
            actor=actor,
            target=None,
            domain=Domain.diplomatic,
            action_type="no_action",
            payload={"reason": args.get("reason", "")},
            rationale=rationale,
            estimated_escalation_rung=0,
        )
    raise ValueError(f"Unknown tool call: {name}")


def _normalise_target(value: Any) -> str | None:
    """Accept str/None; strip whitespace; uppercase; return None for blanks."""
    if value is None:
        return None
    s = str(value).strip().upper()
    if not s or len(s) != 3:
        return None
    return s


# ---------------------------------------------------------------------------
# CountryAgent
# ---------------------------------------------------------------------------


class CountryAgent:
    """One LLM-backed agent representing a single country's decision process."""

    def __init__(
        self,
        code: str,
        name: str,
        doctrine: str,
        red_lines: list[str],
        llm: LLMClient,
    ) -> None:
        """
        Args:
            code: ISO-3 code (uppercased).
            name: Display name.
            doctrine: Free-form doctrine text.
            red_lines: List of red-line description strings.
            llm: A client implementing :class:`LLMClient`.
        """
        if len(code) != 3:
            raise ValueError(f"code must be ISO-3 (got {code!r})")
        self.code = code.upper()
        self.name = name
        self.doctrine = doctrine
        self.red_lines = red_lines
        self.llm = llm

    async def act(
        self,
        perception: Perception,
        memory: list[MemoryRecord] | None = None,
    ) -> ProposedAction:
        """Run a single decision cycle and return the proposed action.

        Args:
            perception: What the agent sees this turn.
            memory: Retrieved memory records (top-k from the memory store).

        Returns:
            A validated :class:`ProposedAction`.
        """
        memories = memory or perception.memories or []
        system_prompt = render_country_prompt(perception, memories)
        human_prompt = (
            f"Turn {perception.world_view.get('turn', 0)}: propose your action. "
            f"Call exactly one tool."
        )

        # Filter out disabled tools (per-demo slim via DISABLED_AGENT_TOOLS env).
        # Each tool schema costs ~300-500 input tokens, so dropping unused tools
        # materially reduces per-call token burn. Default drops cyber + info
        # ops since they're rare in a Taiwan quarantine slice.
        _disabled = {
            name.strip()
            for name in os.environ.get(
                "DISABLED_AGENT_TOOLS", "information_action,cyber_action"
            ).split(",")
            if name.strip()
        }
        tools = [t for t in COUNTRY_AGENT_TOOLS if t["name"] not in _disabled]

        response = await self.llm.ainvoke_tools(
            system_prompt=system_prompt,
            human_prompt=human_prompt,
            tools=tools,
        )

        if not response.tool_calls:
            log.warning(
                "country_agent_no_tool_call",
                actor=self.code,
                content_preview=response.content[:120],
            )
            return ProposedAction(
                actor=self.code,
                target=None,
                domain=Domain.diplomatic,
                action_type="no_action",
                payload={"reason": "LLM did not call a tool"},
                rationale=response.content[:500],
                estimated_escalation_rung=0,
            )

        call = response.tool_calls[0]
        try:
            action = tool_call_to_action(self.code, call)
        except ValueError as e:
            log.error("country_agent_bad_tool_call", actor=self.code, error=str(e))
            action = ProposedAction(
                actor=self.code,
                target=None,
                domain=Domain.diplomatic,
                action_type="no_action",
                payload={"reason": str(e)},
                rationale="Fell back to no_action due to invalid tool call.",
                estimated_escalation_rung=0,
            )

        # Defensive: never let an agent target itself
        if action.target == self.code:
            action = action.model_copy(update={"target": None})

        return action


# ---------------------------------------------------------------------------
# Real LangChain LLM adapter (optional — used in production)
# ---------------------------------------------------------------------------


class ChatAnthropicClient:
    """Thin adapter around ``langchain_anthropic.ChatAnthropic`` for tool-use.

    Kept in a separate class so the core agent logic can be tested without
    pulling in langchain/anthropic at import time.
    """

    def __init__(self, model: str, api_key: str, temperature: float = 0.3) -> None:
        # Lazy import so tests don't need the heavy deps.
        from langchain_anthropic import ChatAnthropic  # type: ignore[import-not-found]

        # max_tokens trimmed for demo — country agents emit one tool-call per
        # turn (a small JSON object plus 2-4 sentences of rationale). 2048 was
        # massive overkill and cost meaningful ITPM budget. Override via
        # AGENT_MAX_TOKENS env if reasoning feels truncated.
        self._chat = ChatAnthropic(
            model=model,
            anthropic_api_key=api_key,
            temperature=temperature,
            max_tokens=int(os.environ.get("AGENT_MAX_TOKENS", "512")),
        )

    async def ainvoke_tools(
        self,
        system_prompt: str,
        human_prompt: str,
        tools: list[dict[str, Any]],
    ) -> LLMResponse:
        """Invoke the chat model with the given tool schemas bound."""
        from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore[import-not-found]

        bound = self._chat.bind_tools(tools)
        result = await bound.ainvoke(
            [SystemMessage(content=system_prompt), HumanMessage(content=human_prompt)]
        )

        tool_calls: list[ToolCall] = []
        # LangChain normalises Anthropic tool calls into ``.tool_calls`` as a
        # list of ``{name, args, id}`` dicts.
        for tc in getattr(result, "tool_calls", []) or []:
            tool_calls.append(
                ToolCall(
                    name=tc.get("name", ""),
                    args=tc.get("args", {}) or {},
                    id=tc.get("id", ""),
                )
            )
        content = ""
        if isinstance(result.content, str):
            content = result.content
        elif isinstance(result.content, list):
            content = " ".join(
                str(block.get("text", "")) for block in result.content if isinstance(block, dict)
            )
        return LLMResponse(tool_calls=tool_calls, content=content)
