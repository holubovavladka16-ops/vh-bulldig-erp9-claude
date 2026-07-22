export interface ProfitCalculation {
  invoicedAmount: number;
  laborCost: number;
  otherCosts: number;
  totalCosts: number;
  result: number; // kladné = zisk, záporné = ztráta, 0 = nula
}

export function calculateProfit(invoicedAmount: number, laborCost: number, otherCosts: number): ProfitCalculation {
  const totalCosts = laborCost + otherCosts;
  return {
    invoicedAmount,
    laborCost,
    otherCosts,
    totalCosts,
    result: invoicedAmount - totalCosts,
  };
}
