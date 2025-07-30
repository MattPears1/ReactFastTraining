import { v2 as cloudinary, UploadApiResponse, ResourceApiResponse } from 'cloudinary';
import { IStorageProvider, IFile, IUploadOptions, StorageProvider } from '../../../interfaces/file.interface';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';

export class CloudinaryStorageProvider implements IStorageProvider {
  constructor(private config: any) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  }

  async upload(file: Express.Multer.File, options?: IUploadOptions): Promise<IFile> {
    const fileId = uuidv4();
    const folder = options?.folder || 'files';

    try {
      const uploadOptions: any = {
        public_id: fileId,
        folder,
        resource_type: 'auto',
        metadata: {
          original_name: file.originalname,
          uploaded_by: options?.metadata?.uploadedBy || '',
          ...options?.metadata,
        },
      };

      if (options?.isPublic === false) {
        uploadOptions.type = 'private';
      }

      if (options?.resize) {
        uploadOptions.transformation = {
          width: options.resize.width,
          height: options.resize.height,
          crop: options.resize.fit || 'fill',
          quality: options.resize.quality || 'auto',
        };
      }

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        );
        uploadStream.end(file.buffer);
      });

      const fileRecord: IFile = {
        id: fileId,
        originalName: file.originalname,
        filename: result.public_id,
        mimetype: file.mimetype,
        size: result.bytes,
        path: result.secure_url,
        url: result.secure_url,
        provider: StorageProvider.CLOUDINARY,
        key: result.public_id,
        metadata: {
          width: result.width,
          height: result.height,
          format: result.format,
          cloudinaryId: result.public_id,
          version: result.version,
        },
        uploadedBy: '',
        isPublic: options?.isPublic ?? true,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.created_at),
      };

      if (options?.expiresIn) {
        fileRecord.expiresAt = new Date(Date.now() + options.expiresIn * 1000);
      }

      return fileRecord;
    } catch (error) {
      logger.error('Cloudinary upload failed', { error, fileId });
      throw error;
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(fileId);
      return result.result === 'ok';
    } catch (error) {
      logger.error('Cloudinary delete failed', { error, fileId });
      return false;
    }
  }

  async getUrl(fileId: string, expires?: number): Promise<string> {
    try {
      const options: any = {
        secure: true,
      };

      if (expires) {
        options.expires_at = Math.floor(Date.now() / 1000) + expires;
      }

      return cloudinary.url(fileId, options);
    } catch (error) {
      logger.error('Failed to generate Cloudinary URL', { error, fileId });
      throw error;
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(fileId);
      return true;
    } catch (error) {
      if (error.http_code === 404) {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(fileId: string): Promise<any> {
    try {
      const result: ResourceApiResponse = await cloudinary.api.resource(fileId, {
        metadata: true,
      });

      return {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at,
        metadata: result.metadata,
      };
    } catch (error) {
      logger.error('Failed to get Cloudinary metadata', { error, fileId });
      throw error;
    }
  }

  async getFile(fileId: string): Promise<IFile> {
    try {
      const resource: ResourceApiResponse = await cloudinary.api.resource(fileId, {
        metadata: true,
      });

      return {
        id: fileId,
        originalName: resource.metadata?.original_name || resource.public_id,
        filename: resource.public_id,
        mimetype: `${resource.resource_type}/${resource.format}`,
        size: resource.bytes,
        path: resource.secure_url,
        url: resource.secure_url,
        provider: StorageProvider.CLOUDINARY,
        key: resource.public_id,
        metadata: {
          width: resource.width,
          height: resource.height,
          format: resource.format,
          cloudinaryId: resource.public_id,
          version: resource.version,
        },
        uploadedBy: resource.metadata?.uploaded_by || '',
        isPublic: resource.type === 'upload',
        createdAt: new Date(resource.created_at),
        updatedAt: new Date(resource.created_at),
      };
    } catch (error) {
      logger.error('Failed to get Cloudinary file', { error, fileId });
      throw error;
    }
  }

  async createPresignedUploadUrl(key: string, contentType: string, expiresIn: number): Promise<string> {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      upload_preset: 'unsigned',
    };

    const signature = cloudinary.utils.api_sign_request(params, this.config.apiSecret);

    return `https://api.cloudinary.com/v1_1/${this.config.cloudName}/auto/upload?api_key=${this.config.apiKey}&timestamp=${timestamp}&signature=${signature}`;
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const url = await this.getUrl(fileId);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('Failed to download from Cloudinary', { error, fileId });
      throw error;
    }
  }

  async getFileInfo(fileId: string): Promise<any> {
    return this.getFile(fileId);
  }
}