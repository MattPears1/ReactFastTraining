export interface IFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  url?: string;
  thumbnailUrl?: string;
  provider: StorageProvider;
  bucket?: string;
  key?: string;
  metadata?: IFileMetadata;
  uploadedBy: string;
  isPublic: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  orientation?: number;
  dpi?: number;
  [key: string]: any;
}

export enum StorageProvider {
  LOCAL = 'local',
  S3 = 's3',
  CLOUDINARY = 'cloudinary',
  GCS = 'gcs',
  AZURE = 'azure'
}

export interface IUploadOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  minFileSize?: number;
  maxFiles?: number;
  resize?: IResizeOptions;
  optimize?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: IResizeOptions;
  isPublic?: boolean;
  expiresIn?: number;
  metadata?: Record<string, any>;
  folder?: string;
  prefix?: string;
  virusScan?: boolean;
}

export interface IResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
  background?: string;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

export interface IFileValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface IStorageProvider {
  upload(file: Express.Multer.File, options?: IUploadOptions): Promise<IFile>;
  delete(fileId: string): Promise<boolean>;
  getUrl(fileId: string, expires?: number): Promise<string>;
  exists(fileId: string): Promise<boolean>;
  getMetadata(fileId: string): Promise<IFileMetadata>;
}

export interface IImageProcessor {
  resize(input: Buffer, options: IResizeOptions): Promise<Buffer>;
  optimize(input: Buffer, format?: string): Promise<Buffer>;
  getMetadata(input: Buffer): Promise<IFileMetadata>;
  generateThumbnail(input: Buffer, size: IResizeOptions): Promise<Buffer>;
  watermark(input: Buffer, watermark: Buffer, position?: string): Promise<Buffer>;
}

export interface IVirusScanner {
  scan(file: Buffer | string): Promise<IVirusScanResult>;
  isClean(result: IVirusScanResult): boolean;
}

export interface IVirusScanResult {
  clean: boolean;
  infected: boolean;
  viruses: string[];
  scannedAt: Date;
  engine: string;
}