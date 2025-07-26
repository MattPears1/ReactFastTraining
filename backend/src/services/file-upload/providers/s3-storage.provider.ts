import AWS from 'aws-sdk';
import { IStorageProvider, IFile, IUploadOptions, StorageProvider } from '../../../interfaces/file.interface';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';

export class S3StorageProvider implements IStorageProvider {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private config: any) {
    this.s3 = new AWS.S3({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });
    this.bucket = config.bucket;
  }

  async upload(file: Express.Multer.File, options?: IUploadOptions): Promise<IFile> {
    const fileId = uuidv4();
    const folder = options?.folder || 'files';
    const key = `${folder}/${fileId}/${file.originalname}`;

    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: options?.isPublic ? 'public-read' : 'private',
        Metadata: {
          originalName: file.originalname,
          uploadedBy: options?.metadata?.uploadedBy || '',
          ...options?.metadata,
        },
      };

      if (options?.expiresIn) {
        params.Expires = new Date(Date.now() + options.expiresIn * 1000);
      }

      const result = await this.s3.upload(params).promise();

      const fileRecord: IFile = {
        id: fileId,
        originalName: file.originalname,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: result.Location,
        url: result.Location,
        provider: StorageProvider.S3,
        bucket: this.bucket,
        key,
        uploadedBy: '',
        isPublic: options?.isPublic ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (options?.expiresIn) {
        fileRecord.expiresAt = new Date(Date.now() + options.expiresIn * 1000);
      }

      return fileRecord;
    } catch (error) {
      logger.error('S3 upload failed', { error, key });
      throw error;
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const keys = await this.findKeysByFileId(fileId);
      
      if (keys.length === 0) {
        return false;
      }

      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
        },
      };

      await this.s3.deleteObjects(deleteParams).promise();
      return true;
    } catch (error) {
      logger.error('S3 delete failed', { error, fileId });
      return false;
    }
  }

  async getUrl(fileId: string, expires?: number): Promise<string> {
    const keys = await this.findKeysByFileId(fileId);
    
    if (keys.length === 0) {
      throw new Error('File not found');
    }

    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucket,
      Key: keys[0],
    };

    if (expires) {
      return this.s3.getSignedUrlPromise('getObject', {
        ...params,
        Expires: expires,
      });
    }

    return `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${keys[0]}`;
  }

  async exists(fileId: string): Promise<boolean> {
    const keys = await this.findKeysByFileId(fileId);
    return keys.length > 0;
  }

  async getMetadata(fileId: string): Promise<any> {
    const keys = await this.findKeysByFileId(fileId);
    
    if (keys.length === 0) {
      throw new Error('File not found');
    }

    const params: AWS.S3.HeadObjectRequest = {
      Bucket: this.bucket,
      Key: keys[0],
    };

    const result = await this.s3.headObject(params).promise();
    
    return {
      size: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      metadata: result.Metadata,
    };
  }

  private async findKeysByFileId(fileId: string): Promise<string[]> {
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: this.bucket,
      Prefix: '',
    };

    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }

      const result = await this.s3.listObjectsV2(params).promise();
      
      if (result.Contents) {
        const matchingKeys = result.Contents
          .filter(obj => obj.Key?.includes(fileId))
          .map(obj => obj.Key!);
        
        keys.push(...matchingKeys);
      }

      continuationToken = result.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  async getFile(fileId: string): Promise<IFile> {
    const keys = await this.findKeysByFileId(fileId);
    
    if (keys.length === 0) {
      throw new Error('File not found');
    }

    const key = keys[0];
    const metadata = await this.getMetadata(fileId);
    
    return {
      id: fileId,
      originalName: metadata.metadata?.originalName || key.split('/').pop() || '',
      filename: key.split('/').pop() || '',
      mimetype: metadata.contentType || 'application/octet-stream',
      size: metadata.size,
      path: `s3://${this.bucket}/${key}`,
      url: await this.getUrl(fileId),
      provider: StorageProvider.S3,
      bucket: this.bucket,
      key,
      uploadedBy: metadata.metadata?.uploadedBy || '',
      isPublic: false,
      createdAt: metadata.lastModified,
      updatedAt: metadata.lastModified,
    };
  }

  async createPresignedUploadUrl(key: string, contentType: string, expiresIn: number): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrlPromise('putObject', params);
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const keys = await this.findKeysByFileId(fileId);
    
    if (keys.length === 0) {
      throw new Error('File not found');
    }

    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucket,
      Key: keys[0],
    };

    const result = await this.s3.getObject(params).promise();
    return result.Body as Buffer;
  }

  async getFileInfo(fileId: string): Promise<any> {
    return this.getFile(fileId);
  }
}