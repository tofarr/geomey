export type NumberFormatter = (n: number) => string;

export const NUMBER_FORMATTER: NumberFormatter = new Intl.NumberFormat(
  "en-IN",
  {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
).format;
