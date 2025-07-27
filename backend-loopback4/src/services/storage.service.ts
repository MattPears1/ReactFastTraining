import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const unlink = promisify(fs.unlink);

export class StorageService {
  private static storagePath = process.env.INVOICE_STORAGE_PATH || './storage/invoices';

  /**
   * Ensure storage directory exists
   */
  private static async ensureStorageDirectory(): Promise<void> {
    const fullPath = path.resolve(this.storagePath);
    
    try {
      await mkdir(fullPath, { recursive: true });
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Save invoice PDF to storage
   */
  static async saveInvoicePDF(invoiceNumber: string, pdfBuffer: Buffer): Promise<string> {
    await this.ensureStorageDirectory();

    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Create year/month subdirectory
    const subDir = path.join(this.storagePath, year.toString(), month);
    await mkdir(path.resolve(subDir), { recursive: true });

    const filename = `${invoiceNumber}.pdf`;
    const filePath = path.join(subDir, filename);
    const fullPath = path.resolve(filePath);

    await writeFile(fullPath, pdfBuffer);

    // Return relative path for database storage
    return filePath;
  }

  /**
   * Get invoice PDF from storage
   */
  static async getInvoicePDF(invoiceNumber: string): Promise<Buffer> {
    // Try to find the file in different year/month combinations
    const possiblePaths = this.getPossibleInvoicePaths(invoiceNumber);

    for (const possiblePath of possiblePaths) {
      const fullPath = path.resolve(possiblePath);
      
      try {
        if (fs.existsSync(fullPath)) {
          return await readFile(fullPath);
        }
      } catch (error) {
        // Continue to next path
      }
    }

    throw new Error(`Invoice PDF not found: ${invoiceNumber}`);
  }

  /**
   * Delete invoice PDF
   */
  static async deleteInvoicePDF(invoiceNumber: string): Promise<void> {
    const possiblePaths = this.getPossibleInvoicePaths(invoiceNumber);

    for (const possiblePath of possiblePaths) {
      const fullPath = path.resolve(possiblePath);
      
      try {
        if (fs.existsSync(fullPath)) {
          await unlink(fullPath);
          return;
        }
      } catch (error) {
        // Continue to next path
      }
    }
  }

  /**
   * Check if invoice PDF exists
   */
  static async invoicePDFExists(invoiceNumber: string): Promise<boolean> {
    const possiblePaths = this.getPossibleInvoicePaths(invoiceNumber);

    for (const possiblePath of possiblePaths) {
      const fullPath = path.resolve(possiblePath);
      
      if (fs.existsSync(fullPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get possible paths for an invoice
   */
  private static getPossibleInvoicePaths(invoiceNumber: string): string[] {
    const paths: string[] = [];
    const filename = `${invoiceNumber}.pdf`;

    // Extract year from invoice number if it follows INV-YYYY-##### format
    const match = invoiceNumber.match(/INV-(\d{4})-/);
    if (match) {
      const year = match[1];
      
      // Check all months of that year
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        paths.push(path.join(this.storagePath, year, monthStr, filename));
      }
    }

    // Also check current year/month as fallback
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    paths.push(path.join(this.storagePath, currentYear, currentMonth, filename));

    // Check root directory as last resort
    paths.push(path.join(this.storagePath, filename));

    return paths;
  }

  /**
   * Clean up old invoices (optional maintenance task)
   */
  static async cleanupOldInvoices(daysToKeep = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    const cleanDirectory = async (dirPath: string) => {
      try {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            await cleanDirectory(filePath);
          } else if (stat.isFile() && file.endsWith('.pdf')) {
            if (stat.mtime < cutoffDate) {
              await unlink(filePath);
              deletedCount++;
            }
          }
        }
      } catch (error) {
        console.error('Error cleaning directory:', dirPath, error);
      }
    };

    await cleanDirectory(path.resolve(this.storagePath));
    return deletedCount;
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      oldestFile: null as Date | null,
      newestFile: null as Date | null,
    };

    const processDirectory = (dirPath: string) => {
      try {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            processDirectory(filePath);
          } else if (stat.isFile() && file.endsWith('.pdf')) {
            stats.totalFiles++;
            stats.totalSize += stat.size;

            if (!stats.oldestFile || stat.mtime < stats.oldestFile) {
              stats.oldestFile = stat.mtime;
            }
            if (!stats.newestFile || stat.mtime > stats.newestFile) {
              stats.newestFile = stat.mtime;
            }
          }
        }
      } catch (error) {
        console.error('Error processing directory:', dirPath, error);
      }
    };

    const fullPath = path.resolve(this.storagePath);
    if (fs.existsSync(fullPath)) {
      processDirectory(fullPath);
    }

    return stats;
  }
}