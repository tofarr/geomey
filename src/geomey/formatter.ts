export type NumberFormatter = (n: number) => string;

export const NUMBER_FORMATTER: NumberFormatter = new Intl.NumberFormat(
  "en-IN",
  { maximumSignificantDigits: 2 },
).format;
