import { GoogleGenAI } from "@google/genai";

export interface TaxBracket {
  limit: number | null; // null means "and above"
  rate: number;
}

export interface TaxRates {
  ssnitRate: number;
  brackets: TaxBracket[];
  year: string;
  source?: string;
}

// Default 2024/2025 Ghana Tax Brackets (Monthly)
export const DEFAULT_GHANA_TAX_RATES: TaxRates = {
  ssnitRate: 0.055, // 5.5%
  year: "2024/2025",
  brackets: [
    { limit: 490, rate: 0 },
    { limit: 110, rate: 0.05 },
    { limit: 130, rate: 0.10 },
    { limit: 3160, rate: 0.175 },
    { limit: 16110, rate: 0.25 },
    { limit: 45000, rate: 0.30 },
    { limit: null, rate: 0.35 },
  ],
};

export async function fetchLatestTaxRates(): Promise<TaxRates> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return DEFAULT_GHANA_TAX_RATES;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "What are the current monthly income tax (PAYE) brackets and SSNIT rates for employees in Ghana for the year 2025? Provide the answer in a structured JSON format with 'ssnitRate' (as a decimal), 'year', and 'brackets' (an array of objects with 'limit' and 'rate'). If a bracket is 'above X', set limit to null.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    if (data.brackets && Array.isArray(data.brackets)) {
      return {
        ssnitRate: data.ssnitRate || 0.055,
        year: data.year || "2025",
        brackets: data.brackets,
        source: "Gemini Live Search",
      };
    }
  } catch (error) {
    console.error("Error fetching live tax rates:", error);
  }

  return DEFAULT_GHANA_TAX_RATES;
}

export function calculateTax(grossIncome: number, rates: TaxRates) {
  const ssnit = grossIncome * rates.ssnitRate;
  const taxableIncome = grossIncome - ssnit;
  
  let remainingTaxable = taxableIncome;
  let totalTax = 0;
  const breakdown: { bracket: string; amount: number; tax: number }[] = [];

  for (let i = 0; i < rates.brackets.length; i++) {
    const bracket = rates.brackets[i];
    const rate = bracket.rate;
    const limit = bracket.limit;

    if (remainingTaxable <= 0) break;

    let amountInThisBracket = 0;
    if (limit === null) {
      amountInThisBracket = remainingTaxable;
    } else {
      amountInThisBracket = Math.min(remainingTaxable, limit);
    }

    const taxForThisBracket = amountInThisBracket * rate;
    totalTax += taxForThisBracket;
    
    breakdown.push({
      bracket: limit === null ? `Above previous` : `Next ${limit}`,
      amount: amountInThisBracket,
      tax: taxForThisBracket,
    });

    remainingTaxable -= amountInThisBracket;
  }

  const netIncome = taxableIncome - totalTax;

  return {
    grossIncome,
    ssnit,
    taxableIncome,
    totalTax,
    netIncome,
    breakdown,
    ratesUsed: rates,
  };
}
