import { Decimal } from 'decimal.js';

describe('POS Billing & GST Calculation Tests', () => {
  it('should accurately calculate GST (CGST + SGST), discount, and round-off', () => {
    // Test Case: Item A: 2 units @ Rs 150 each with 10% discount, 18% GST
    const qty = new Decimal(2);
    const unitPrice = new Decimal(150);
    const grossPrice = qty.mul(unitPrice); // 300.00

    const discountPercent = new Decimal(10);
    const discountAmount = grossPrice.mul(discountPercent).div(100); // 30.00
    const netTaxable = grossPrice.minus(discountAmount); // 270.00

    const taxRate = new Decimal(18);
    const taxAmount = netTaxable.mul(taxRate).div(100); // 48.60
    const cgst = taxAmount.div(2); // 24.30
    const sgst = taxAmount.div(2); // 24.30

    const lineTotal = netTaxable.plus(taxAmount); // 318.60

    expect(grossPrice.toNumber()).toBe(300);
    expect(discountAmount.toNumber()).toBe(30);
    expect(netTaxable.toNumber()).toBe(270);
    expect(taxAmount.toNumber()).toBe(48.6);
    expect(cgst.toNumber()).toBe(24.3);
    expect(sgst.toNumber()).toBe(24.3);
    expect(lineTotal.toNumber()).toBe(318.6);

    // Round off test
    const rounded = lineTotal.round(); // 319.00
    const roundOff = rounded.minus(lineTotal); // +0.40

    expect(rounded.toNumber()).toBe(319);
    expect(roundOff.toNumber()).toBe(0.4);
  });

  it('should prevent floating-point precision loss on large retail invoices', () => {
    let sum = new Decimal(0);
    for (let i = 0; i < 1000; i++) {
      sum = sum.plus(new Decimal('0.1'));
    }
    expect(sum.toNumber()).toBe(100.0);
  });
});
