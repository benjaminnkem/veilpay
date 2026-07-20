export function centsToNumber(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

export function numberToCentsString(value: number): string {
  return Math.round(value).toString();
}

export function sumCents(values: Array<string | number>): number {
  return values.reduce<number>((acc, v) => acc + centsToNumber(v), 0);
}
