import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface InvoicePrintData {
  invoiceNumber: string;
  invoiceDate: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopGstin?: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  footerNote?: string;
  terms?: string;
  language?: string; // 'en' | 'te'
}

/**
 * Generates an 80mm thermal receipt PDF (width: 80mm = ~226pt, dynamic height).
 */
export function generateThermalReceipt(data: InvoicePrintData): NodeJS.ReadableStream {
  const doc = new PDFDocument({
    size: [226, 800], // 80mm thermal width
    margins: { top: 10, bottom: 10, left: 10, right: 10 }
  });

  const isTelugu = data.language === 'te';

  // Header
  doc.fontSize(12).font('Helvetica-Bold').text(data.shopName, { align: 'center' });
  if (data.shopAddress) {
    doc.fontSize(8).font('Helvetica').text(data.shopAddress, { align: 'center' });
  }
  if (data.shopPhone) {
    doc.fontSize(8).text(`Ph: ${data.shopPhone}`, { align: 'center' });
  }
  if (data.shopGstin) {
    doc.fontSize(8).text(`GSTIN: ${data.shopGstin}`, { align: 'center' });
  }

  doc.moveDown(0.5);
  doc.fontSize(8).text('------------------------------------------------', { align: 'center' });

  // Invoice Meta
  const title = isTelugu ? 'టాక్స్ ఇన్వాయిస్ / TAX INVOICE' : 'TAX INVOICE';
  doc.fontSize(9).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.fontSize(8).font('Helvetica');
  doc.text(`Bill No: ${data.invoiceNumber}`);
  doc.text(`Date: ${new Date(data.invoiceDate).toLocaleString('en-IN')}`);

  if (data.customerName) {
    doc.text(`Customer: ${data.customerName}`);
    if (data.customerPhone) doc.text(`Mobile: ${data.customerPhone}`);
  }

  doc.text('------------------------------------------------', { align: 'center' });

  // Items Table Header
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('Item               Qty   Price   Total');
  doc.font('Helvetica').fontSize(8);
  doc.text('------------------------------------------------', { align: 'center' });

  // Items List
  data.items.forEach((item) => {
    const itemName = item.name.length > 16 ? item.name.substring(0, 15) + '..' : item.name.padEnd(16, ' ');
    const qty = String(item.quantity).padStart(4, ' ');
    const price = Number(item.unitPrice).toFixed(1).padStart(7, ' ');
    const total = Number(item.total).toFixed(2).padStart(8, ' ');

    doc.text(`${itemName} ${qty} ${price} ${total}`);
  });

  doc.text('------------------------------------------------', { align: 'center' });

  // Financial Totals
  doc.font('Helvetica');
  doc.text(`Subtotal: ${Number(data.subtotal).toFixed(2)}`, { align: 'right' });
  if (data.discountAmount > 0) {
    doc.text(`Discount: -${Number(data.discountAmount).toFixed(2)}`, { align: 'right' });
  }
  doc.text(`GST Tax: ${Number(data.taxAmount).toFixed(2)}`, { align: 'right' });
  if (data.roundOff !== 0) {
    doc.text(`Round Off: ${Number(data.roundOff).toFixed(2)}`, { align: 'right' });
  }

  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`NET TOTAL: Rs. ${Number(data.totalAmount).toFixed(2)}`, { align: 'right' });

  doc.fontSize(8).font('Helvetica');
  doc.text(`Paid via ${data.paymentMethod}: Rs. ${Number(data.paidAmount).toFixed(2)}`, { align: 'right' });

  doc.moveDown(0.5);
  doc.text('------------------------------------------------', { align: 'center' });

  // Footer Note & Telugu greeting
  const footerGreeting = isTelugu ? 'ధన్యవాదాలు! మరల సందర్శించండి.' : (data.footerNote || 'Thank you for your visit!');
  doc.fontSize(8).font('Helvetica-Bold').text(footerGreeting, { align: 'center' });

  doc.moveDown(0.2);
  doc.fontSize(7).font('Helvetica').text('SL MultiShop - Powered by SL IT SOLUTIONS', { align: 'center' });

  doc.end();
  return doc;
}

/**
 * Generates an A4 standard GST Tax Invoice.
 */
export function generateA4Invoice(data: InvoicePrintData): NodeJS.ReadableStream {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const isTelugu = data.language === 'te';

  // Shop Header
  doc.fontSize(18).font('Helvetica-Bold').text(data.shopName, 40, 40);
  doc.fontSize(9).font('Helvetica');
  if (data.shopAddress) doc.text(data.shopAddress);
  if (data.shopPhone) doc.text(`Phone: ${data.shopPhone}`);
  if (data.shopGstin) doc.text(`GSTIN: ${data.shopGstin}`);

  // Right-aligned Invoice Meta
  doc.fontSize(16).font('Helvetica-Bold').text(
    isTelugu ? 'TAX INVOICE / పన్ను రసీదు' : 'TAX INVOICE',
    350,
    40,
    { align: 'right' }
  );
  doc.fontSize(10).font('Helvetica');
  doc.text(`Invoice No: ${data.invoiceNumber}`, 350, 65, { align: 'right' });
  doc.text(`Invoice Date: ${new Date(data.invoiceDate).toLocaleDateString('en-IN')}`, 350, 80, { align: 'right' });

  doc.moveTo(40, 120).lineTo(550, 120).strokeColor('#cccccc').stroke();

  // Customer Section
  doc.fontSize(10).font('Helvetica-Bold').text('Billed To:', 40, 130);
  doc.font('Helvetica');
  doc.text(data.customerName || 'Walk-in Customer', 40, 145);
  if (data.customerPhone) doc.text(`Mobile: ${data.customerPhone}`, 40, 160);

  // Items Table
  const tableTop = 190;
  doc.rect(40, tableTop, 510, 22).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
  doc.text('#', 45, tableTop + 6);
  doc.text('Item Description', 70, tableTop + 6);
  doc.text('Qty', 300, tableTop + 6, { width: 40, align: 'right' });
  doc.text('Rate', 350, tableTop + 6, { width: 50, align: 'right' });
  doc.text('Tax %', 410, tableTop + 6, { width: 40, align: 'right' });
  doc.text('Amount (Rs)', 460, tableTop + 6, { width: 80, align: 'right' });

  let y = tableTop + 25;
  doc.font('Helvetica').fontSize(9).fillColor('#000000');

  data.items.forEach((item, index) => {
    doc.text(String(index + 1), 45, y);
    doc.text(item.name, 70, y, { width: 220 });
    doc.text(String(item.quantity), 300, y, { width: 40, align: 'right' });
    doc.text(Number(item.unitPrice).toFixed(2), 350, y, { width: 50, align: 'right' });
    doc.text(`${item.taxRate}%`, 410, y, { width: 40, align: 'right' });
    doc.text(Number(item.total).toFixed(2), 460, y, { width: 80, align: 'right' });

    y += 20;
    doc.moveTo(40, y - 4).lineTo(550, y - 4).strokeColor('#f1f5f9').stroke();
  });

  // Totals Section
  const totalsY = y + 10;
  doc.font('Helvetica').fontSize(9);
  doc.text('Subtotal:', 380, totalsY, { width: 80, align: 'right' });
  doc.text(`Rs. ${Number(data.subtotal).toFixed(2)}`, 460, totalsY, { width: 80, align: 'right' });

  if (data.discountAmount > 0) {
    doc.text('Discount:', 380, totalsY + 16, { width: 80, align: 'right' });
    doc.text(`-Rs. ${Number(data.discountAmount).toFixed(2)}`, 460, totalsY + 16, { width: 80, align: 'right' });
  }

  doc.text('GST Tax Amount:', 380, totalsY + 32, { width: 80, align: 'right' });
  doc.text(`Rs. ${Number(data.taxAmount).toFixed(2)}`, 460, totalsY + 32, { width: 80, align: 'right' });

  if (data.roundOff !== 0) {
    doc.text('Round Off:', 380, totalsY + 48, { width: 80, align: 'right' });
    doc.text(`Rs. ${Number(data.roundOff).toFixed(2)}`, 460, totalsY + 48, { width: 80, align: 'right' });
  }

  doc.rect(370, totalsY + 66, 180, 26).fill('#2563eb');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
  doc.text('Total:', 380, totalsY + 74);
  doc.text(`Rs. ${Number(data.totalAmount).toFixed(2)}`, 450, totalsY + 74, { width: 90, align: 'right' });

  // Footer notes & terms
  doc.fillColor('#475569').fontSize(8).font('Helvetica');
  doc.text(data.terms || 'Terms: Goods once sold will not be accepted back.', 40, totalsY + 120);
  doc.text('SL MultiShop SaaS – Developed by SL IT SOLUTIONS', 40, totalsY + 135);

  doc.end();
  return doc;
}
