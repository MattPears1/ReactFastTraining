import { db } from '../../config/database.config';
import { invoices } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class InvoiceNumberService {
  /**
   * Generate a unique invoice number with better concurrency handling
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      const result = await tx.execute(sql`
        SELECT nextval('invoice_number_seq') as seq
      `);
      const sequence = result.rows[0].seq;
      
      // Verify uniqueness
      const invoiceNumber = `INV-${year}-${sequence.toString().padStart(5, '0')}`;
      const [existing] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber));
      
      if (existing) {
        // Rare case: sequence collision, try again
        return this.generateInvoiceNumber();
      }
      
      return invoiceNumber;
    });
  }
}