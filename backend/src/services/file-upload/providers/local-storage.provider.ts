import fs from 'fs/promises';
import path from 'path';
import { IStorageProvider, IFile, IUploadOptions, StorageProvider } from '../../../interfaces/file.interface';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';

export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;
  private publicUrl: string;

  constructor(private config: any) {
    this.uploadDir = path.resolve(config.uploadDir);
    this.publicUrl = config.publicUrl;
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directory', { error, uploadDir: this.uploadDir });
    }
  }

  async upload(file: Express.Multer.File, options?: IUploadOptions): Promise<IFile> {
    const fileId = uuidv4();
    const folder = options?.folder || 'files';
    const fileExt = path.extname(file.originalname);
    const filename = `${fileId}${fileExt}`;
    const relativePath = path.join(folder, filename);
    const absolutePath = path.join(this.uploadDir, relativePath);

    try {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, file.buffer);

      const fileRecord: IFile = {
        id: fileId,
        originalName: file.originalname,
        filename,
        mimetype: file.mimetype,
        size: file.size,
        path: absolutePath,
        url: `${this.publicUrl}/uploads/${relativePath}`,
        provider: StorageProvider.LOCAL,
        uploadedBy: '',
        isPublic: options?.isPublic ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (options?.expiresIn) {
        fileRecord.expiresAt = new Date(Date.now() + options.expiresIn * 1000);
      }

      return fileRecord;
    } catch (error) {
      logger.error('Local storage upload failed', { error, filename });
      throw error;
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const files = await this.findFileById(fileId);
      
      if (files.length === 0) {
        return false;
      }

      for (const file of files) {
        await fs.unlink(file);
      }

      return true;
    } catch (error) {
      logger.error('Local storage delete failed', { error, fileId });
      return false;
    }
  }

  async getUrl(fileId: string, expires?: number): Promise<string> {
    const files = await this.findFileById(fileId);
    
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const relativePath = path.relative(this.uploadDir, files[0]);
    return `${this.publicUrl}/uploads/${relativePath}`;
  }

  async exists(fileId: string): Promise<boolean> {
    const files = await this.findFileById(fileId);
    return files.length > 0;
  }

  async getMetadata(fileId: string): Promise<any> {
    const files = await this.findFileById(fileId);
    
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const stats = await fs.stat(files[0]);
    
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  }

  private async findFileById(fileId: string): Promise<string[]> {
    const files: string[] = [];
    
    async function searchDir(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await searchDir(fullPath);
        } else if (entry.name.includes(fileId)) {
          files.push(fullPath);
        }
      }
    }

    await searchDir(this.uploadDir);
    return files;
  }

  async getFile(fileId: string): Promise<IFile> {
    const files = await this.findFileById(fileId);
    
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const filePath = files[0];
    const stats = await fs.stat(filePath);
    const relativePath = path.relative(this.uploadDir, filePath);
    
    return {
      id: fileId,
      originalName: path.basename(filePath),
      filename: path.basename(filePath),
      mimetype: 'application/octet-stream',
      size: stats.size,
      path: filePath,
      url: `${this.publicUrl}/uploads/${relativePath}`,
      provider: StorageProvider.LOCAL,
      uploadedBy: '',
      isPublic: true,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  }

  async createPresignedUploadUrl(key: string, contentType: string, expiresIn: number): Promise<string> {
    throw new Error('Presigned URLs not supported for local storage');
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const files = await this.findFileById(fileId);
    
    if (files.length === 0) {
      throw new Error('File not found');
    }

    return fs.readFile(files[0]);
  }

  async getFileInfo(fileId: string): Promise<any> {
    return this.getFile(fileId);
  }
}