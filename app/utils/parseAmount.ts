export function parseAmount(value: string): number {
  // Replace comma with period to handle locale decimal separators
  // (e.g. German/French keyboards use "," instead of ".")
  return parseFloat(value.replace(',', '.'));
}
