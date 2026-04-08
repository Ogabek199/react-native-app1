export function makeId(prefix: string = 'id') {
  // Small, deterministic-enough ID for local-only usage (no crypto dependency).
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

