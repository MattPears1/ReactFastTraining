import { Service } from 'typedi';
import { IFile, IUploadOptions, IFileValidation, StorageProvider } from '../../interfaces/file.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { ImageProcessor } from './image-processor';
import { FileValidator } from './file-validator';
import { servicesConfig } from '../../config/services.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class FileUploadService {
  private storageProvider: any;
  private imageProcessor: ImageProcessor;
  private fileValidator: FileValidator;

  constructor() {
    this.storageProvider = this.initializeStorageProvider();
    this.imageProcessor = new ImageProcessor();
    this.fileValidator = new FileValidator();
  }

  private initializeStorageProvider(): any {
    const { defaultProvider, providers } = servicesConfig.storage;
    
    switch (defaultProvider) {
      case 'local':
        return new LocalStorageProvider(providers.local);
      case 's3':
        return new S3StorageProvider(providers.s3);
      case 'cloudinary':
        return new CloudinaryStorageProvider(providers.cloudinary);
      default:
        throw new Error(`Unknown storage provider: ${defaultProvider}`);
    }
  }

  async upload(
    file: Express.Multer.File,
    userId: string,
    options: IUploadOptions = {}
  ): Promise<IFile> {
    try {
      const validation = await this.fileValidator.validate(file, options);
      
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      if (options.virusScan) {
        const scanResult = await this.scanForViruses(file.buffer);
        if (!scanResult.clean) {
          throw new Error('File contains malware');
        }
      }

      let processedFile = file;
      
      if (this.isImage(file.mimetype)) {
        if (options.resize || options.optimize) {
          processedFile = await this.processImage(file, options);
        }
      }

      const uploadedFile = await this.storageProvider.upload(processedFile, options);
      
      const fileRecord: IFile = {
        ...uploadedFile,
        uploadedBy: userId,
        metadata: await this.extractMetadata(processedFile),
      };

      if (options.generateThumbnail && this.isImage(file.mimetype)) {
        const thumbnail = await this.generateThumbnail(file, options.thumbnailSize);
        fileRecord.thumbnailUrl = await this.storageProvider.upload(thumbnail, {
          ...options,
          folder: `${options.folder || 'files'}/thumbnails`,
        }).then(f => f.url);
      }

      logger.info('File uploaded successfully', { fileId: fileRecord.id, userId });
      return fileRecord;
    } catch (error) {
      logger.error('File upload failed', { error, fileName: file.originalname });
      throw error;
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    userId: string,
    options: IUploadOptions = {}
  ): Promise<IFile[]> {
    const uploadPromises = files.map(file => this.upload(file, userId, options));
    return Promise.all(uploadPromises);
  }

  async delete(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await this.getFile(fileId);
      
      if (file.uploadedBy !== userId) {
        throw new Error('Unauthorized to delete this file');
      }

      const result = await this.storageProvider.delete(fileId);
      
      if (file.thumbnailUrl) {
        const thumbnailId = this.extractFileIdFromUrl(file.thumbnailUrl);
        await this.storageProvider.delete(thumbnailId).catch(err => 
          logger.warn('Failed to delete thumbnail', { thumbnailId, error: err })
        );
      }

      logger.info('File deleted successfully', { fileId, userId });
      return result;
    } catch (error) {
      logger.error('File deletion failed', { error, fileId });
      throw error;
    }
  }

  async getFile(fileId: string): Promise<IFile> {
    return this.storageProvider.getFile(fileId);
  }

  async getUrl(fileId: string, expiresIn?: number): Promise<string> {
    return this.storageProvider.getUrl(fileId, expiresIn);
  }

  async exists(fileId: string): Promise<boolean> {
    return this.storageProvider.exists(fileId);
  }

  private async processImage(
    file: Express.Multer.File,
    options: IUploadOptions
  ): Promise<Express.Multer.File> {
    let buffer = file.buffer;

    if (options.resize) {
      buffer = await this.imageProcessor.resize(buffer, options.resize);
    }

    if (options.optimize) {
      buffer = await this.imageProcessor.optimize(buffer, options.resize?.format);
    }

    return {
      ...file,
      buffer,
      size: buffer.length,
    };
  }

  private async generateThumbnail(
    file: Express.Multer.File,
    size = { width: 150, height: 150 }
  ): Promise<Express.Multer.File> {
    const thumbnail = await this.imageProcessor.generateThumbnail(file.buffer, size);
    
    return {
      ...file,
      fieldname: `${file.fieldname}_thumbnail`,
      originalname: `thumb_${file.originalname}`,
      buffer: thumbnail,
      size: thumbnail.length,
    };
  }

  private async extractMetadata(file: Express.Multer.File): Promise<any> {
    if (this.isImage(file.mimetype)) {
      return this.imageProcessor.getMetadata(file.buffer);
    }
    
    return {
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname,
    };
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  private extractFileIdFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1].split('?')[0];
  }

  private async scanForViruses(buffer: Buffer): Promise<any> {
    return { clean: true };
  }

  async createPresignedUploadUrl(
    fileName: string,
    contentType: string,
    userId: string,
    options: IUploadOptions = {}
  ): Promise<{ uploadUrl: string; fileId: string }> {
    const fileId = uuidv4();
    const key = `${options.folder || 'uploads'}/${userId}/${fileId}/${fileName}`;
    
    const uploadUrl = await this.storageProvider.createPresignedUploadUrl(
      key,
      contentType,
      options.expiresIn || 3600
    );

    return { uploadUrl, fileId };
  }

  async processUploadedFile(
    fileId: string,
    userId: string,
    options: IUploadOptions = {}
  ): Promise<IFile> {
    const fileInfo = await this.storageProvider.getFileInfo(fileId);
    
    if (options.virusScan) {
      const fileBuffer = await this.storageProvider.downloadFile(fileId);
      const scanResult = await this.scanForViruses(fileBuffer);
      
      if (!scanResult.clean) {
        await this.storageProvider.delete(fileId);
        throw new Error('File contains malware');
      }
    }

    const fileRecord: IFile = {
      id: fileId,
      ...fileInfo,
      uploadedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return fileRecord;
  }
}