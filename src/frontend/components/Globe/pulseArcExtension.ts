/**
 * pulseArcExtension.ts
 *
 * Custom Deck.gl LayerExtension that injects GLSL to animate a bright
 * traveling light segment along each arc.
 *
 * Deck.gl 9 / luma.gl 9 dropped `model.setUniforms()`. Per-frame uniforms
 * now flow through a ShaderModule (`pulseArcModule`) whose props we update
 * each draw via `setShaderModuleProps`. The module declares one scalar,
 * `time` (seconds), used in the fragment shader to move a bell-curve
 * brightness boost along each arc's 0→1 segment position.
 */

import type { LayerExtensionProps } from '@deck.gl/core';
import { LayerExtension } from '@deck.gl/core';

// Shader module — declares the uniform block referenced by injected GLSL.
// ``pulseArc.time`` is visible in both vs and fs.
const uniformBlock = /* glsl */ `\
uniform pulseArcUniforms {
  float time;
} pulseArc;
`;

const pulseArcModule = {
  name: 'pulseArc',
  vs: uniformBlock,
  fs: uniformBlock,
  uniformTypes: {
    time: 'f32',
  },
} as const;

export interface PulseArcProps {
  /** Animation speed multiplier (arcs/second; default 0.5). */
  pulseSpeed?: number;
}

export class PulseArcExtension extends LayerExtension<PulseArcProps> {
  static defaultProps: Required<PulseArcProps> = {
    pulseSpeed: 0.5,
  };
  static extensionName = 'PulseArcExtension';

  getShaders() {
    return {
      modules: [pulseArcModule],
      inject: {
        // Pass normalized arc position (0 = source, 1 = target) to fragment.
        'vs:#decl': /* glsl */ `
          out float v_pulse_t;
        `,
        'vs:#main-end': /* glsl */ `
          v_pulse_t = geometry.uv.x;
        `,

        'fs:#decl': /* glsl */ `
          in float v_pulse_t;
        `,
        // Bell-curve brightness boost near the pulse head; wraps 0..1.
        // Wider head (sigma ~0.18) + stronger boost so the traveling segment
        // reads clearly even on a projector. Base arc stays dim so the
        // "head" is unmistakably the moving part.
        //
        // IMPORTANT: gate modifications on `picking.isActive` so the picking
        // pass (which encodes the layer index into color) isn't corrupted by
        // our brightness tweaks — otherwise arcs become un-pickable.
        'fs:DECKGL_FILTER_COLOR': /* glsl */ `
          if (picking.isActive < 0.5) {
            float pulse_pos = fract(pulseArc.time);
            float dist = abs(v_pulse_t - pulse_pos);
            dist = min(dist, 1.0 - dist);            // wrap so pulse loops smoothly
            float boost = exp(-dist * dist * 30.0);  // wider, clearer head
            color.rgb *= 0.55;
            color.rgb += color.rgb * boost * 5.0;
            color.a *= clamp(color.a, 0.2, 1.0);
          }
        `,
      },
    };
  }

  // `this` is a Layer in deck.gl extension land; cast so we can call
  // setShaderModuleProps which isn't on the public Layer type surface.
  draw(
    this: LayerExtensionProps<PulseArcProps> & {
      setShaderModuleProps: (props: Record<string, unknown>) => void;
    },
    _params: unknown,
    _extension: PulseArcExtension,
  ) {
    const pulseSpeed = this.props.pulseSpeed ?? 0.5;
    // IMPORTANT: GLSL `float` is 32-bit. Date.now()/1000 is ~1.78e9, times
    // pulseSpeed yields ~10^8 — at that magnitude, float32 precision is ~10
    // units, so fract() in the shader produces garbage and the pulse jitters
    // / appears to move at the wrong speed. Mod to [0, 1) here in JS (float64)
    // and the shader just reads the pre-wrapped value.
    const raw = (Date.now() / 1000) * pulseSpeed;
    const time = raw - Math.floor(raw);
    this.setShaderModuleProps({ pulseArc: { time } });
  }
}
