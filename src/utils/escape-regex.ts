/** Escapa string para uso seguro dentro de RegExp (evita [FI] virar classe de caracteres). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
