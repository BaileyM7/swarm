/**
 * Ambient module declarations for third-party packages that ship without
 * their own TypeScript types in the versions we use.
 */

// world-atlas ships JSON files with no .d.ts. We treat the imported shape as
// `unknown` and cast at the boundary inside useWorldLayers.
declare module 'world-atlas/countries-110m.json' {
  const value: unknown;
  export default value;
}

// topojson-client has @types but they're optional; declare the one helper we
// actually use so tsc can resolve it without the @types package.
declare module 'topojson-client' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function feature(topology: any, object: any): unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function mesh(topology: any, object?: any, filter?: (a: any, b: any) => boolean): unknown;
}
