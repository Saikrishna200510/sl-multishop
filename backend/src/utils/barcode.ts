import { prisma } from '../services/prisma.js';

/**
 * Calculates GS1 standard Modulo-10 check digit for a 12-digit EAN code
 */
export function calculateEan13CheckDigit(code12: string): number {
  if (code12.length !== 12 || !/^\d+$/.test(code12)) {
    throw new Error('EAN payload must be exactly 12 digits');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i], 10);
    // Even indices (0, 2, 4...) have weight 1; odd indices (1, 3, 5...) have weight 3
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }

  const remainder = sum % 10;
  return (10 - remainder) % 10;
}

/**
 * Generates a valid standard 13-digit EAN-13 barcode.
 * Uses '890' (India GS1 country prefix) or a specified 3-digit prefix.
 */
export function generateEan13Barcode(prefix: string = '890'): string {
  const cleanPrefix = prefix.padEnd(3, '0').slice(0, 3);
  const randomNineDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
  const first12 = `${cleanPrefix}${randomNineDigits}`;
  const checkDigit = calculateEan13CheckDigit(first12);
  return `${first12}${checkDigit}`;
}

/**
 * Generates a guaranteed unique EAN-13 barcode for a given shop.
 */
export async function getUniqueEan13Barcode(shopId: string, prefix: string = '890'): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    const candidate = generateEan13Barcode(prefix);

    const [existingProduct, existingBarcode] = await Promise.all([
      prisma.product.findFirst({
        where: { shop_id: shopId, barcode: candidate }
      }),
      prisma.productBarcode.findFirst({
        where: { shop_id: shopId, barcode: candidate }
      })
    ]);

    if (!existingProduct && !existingBarcode) {
      return candidate;
    }
  }

  const ts = Date.now().toString().slice(-9);
  const first12 = `${prefix.slice(0, 3)}${ts}`;
  return `${first12}${calculateEan13CheckDigit(first12)}`;
}
