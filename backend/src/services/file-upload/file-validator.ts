import { IFileValidation, IUploadOptions } from '../../interfaces/file.interface';
import { servicesConfig } from '../../config/services.config';

export class FileValidator {
  async validate(file: Express.Multer.File, options: IUploadOptions = {}): Promise<IFileValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const maxSize = options.maxFileSize || servicesConfig.storage.upload.maxFileSize;
    const minSize = options.minFileSize || 0;
    const allowedTypes = options.allowedMimeTypes || servicesConfig.storage.upload.allowedMimeTypes;

    if (file.size > maxSize) {
      errors.push(`File size ${this.formatBytes(file.size)} exceeds maximum allowed size of ${this.formatBytes(maxSize)}`);
    }

    if (file.size < minSize) {
      errors.push(`File size ${this.formatBytes(file.size)} is below minimum required size of ${this.formatBytes(minSize)}`);
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push(`File type '${file.mimetype}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (this.hasInvalidCharacters(file.originalname)) {
      errors.push('Filename contains invalid characters');
    }

    if (this.isSuspiciousFile(file)) {
      warnings.push('File may contain suspicious content');
    }

    const extension = this.getFileExtension(file.originalname);
    const expectedMimeType = this.getMimeTypeFromExtension(extension);
    
    if (expectedMimeType && expectedMimeType !== file.mimetype) {
      warnings.push(`File extension '${extension}' does not match MIME type '${file.mimetype}'`);
    }

    if (this.isExecutable(file.originalname) || this.isExecutable(file.mimetype)) {
      errors.push('Executable files are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private hasInvalidCharacters(filename: string): boolean {
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    return invalidChars.test(filename);
  }

  private isSuspiciousFile(file: Express.Multer.File): boolean {
    const suspiciousPatterns = [
      /^\./, 
      /\.(php|asp|aspx|jsp|cgi|pl|py|rb|sh|bat|cmd|exe|com|scr|vbs|js)$/i,
      /\.(zip|rar|7z|tar|gz).*\.(jpg|jpeg|png|gif|pdf)$/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(file.originalname));
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private getMimeTypeFromExtension(extension: string): string | null {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'zip': 'application/zip',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
    };

    return mimeTypes[extension] || null;
  }

  private isExecutable(value: string): boolean {
    const executableExtensions = [
      'exe', 'com', 'bat', 'cmd', 'scr', 'vbs', 'vbe', 'js', 'jse',
      'ws', 'wsf', 'wsc', 'wsh', 'ps1', 'ps1xml', 'ps2', 'ps2xml',
      'psc1', 'psc2', 'msh', 'msh1', 'msh2', 'mshxml', 'msh1xml',
      'msh2xml', 'scf', 'lnk', 'inf', 'reg', 'dll', 'app', 'application',
    ];

    const executableMimeTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-bat',
      'application/x-sh',
    ];

    const extension = this.getFileExtension(value);
    return executableExtensions.includes(extension) || executableMimeTypes.includes(value);
  }

  validateBatch(files: Express.Multer.File[], options: IUploadOptions = {}): IFileValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (options.maxFiles && files.length > options.maxFiles) {
      errors.push(`Number of files (${files.length}) exceeds maximum allowed (${options.maxFiles})`);
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = (options.maxFileSize || servicesConfig.storage.upload.maxFileSize) * files.length;

    if (totalSize > maxTotalSize) {
      errors.push(`Total file size ${this.formatBytes(totalSize)} exceeds maximum allowed ${this.formatBytes(maxTotalSize)}`);
    }

    files.forEach((file, index) => {
      const validation = this.validate(file, options);
      validation.errors.forEach(error => errors.push(`File ${index + 1} (${file.originalname}): ${error}`));
      validation.warnings?.forEach(warning => warnings.push(`File ${index + 1} (${file.originalname}): ${warning}`));
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}