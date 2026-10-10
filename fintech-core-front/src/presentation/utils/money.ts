const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

/** Formato monetario solo para presentación (mismo formato que usaba la app). */
export const formatCurrency = (value: number): string => currencyFormatter.format(value);
