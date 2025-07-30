import sharp from 'sharp';
import { IImageProcessor, IResizeOptions, IFileMetadata } from '../../interfaces/file.interface';
import { logger } from '../../utils/logger';

export class ImageProcessor implements IImageProcessor {
  async resize(input: Buffer, options: IResizeOptions): Promise<Buffer> {
    try {
      let sharpInstance = sharp(input);

      if (options.width || options.height) {
        sharpInstance = sharpInstance.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          position: options.position || 'center',
          background: options.background || { r: 255, g: 255, b: 255, alpha: 0 },
        });
      }

      if (options.format) {
        const formatOptions: any = {};
        
        if (options.quality) {
          formatOptions.quality = options.quality;
        }

        switch (options.format) {
          case 'jpeg':
            sharpInstance = sharpInstance.jpeg(formatOptions);
            break;
          case 'png':
            sharpInstance = sharpInstance.png(formatOptions);
            break;
          case 'webp':
            sharpInstance = sharpInstance.webp(formatOptions);
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif(formatOptions);
            break;
        }
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      logger.error('Image resize failed', { error, options });
      throw error;
    }
  }

  async optimize(input: Buffer, format?: string): Promise<Buffer> {
    try {
      let sharpInstance = sharp(input);
      const metadata = await sharpInstance.metadata();

      if (!format && metadata.format) {
        format = metadata.format;
      }

      switch (format) {
        case 'jpeg':
        case 'jpg':
          sharpInstance = sharpInstance.jpeg({
            quality: 80,
            progressive: true,
            mozjpeg: true,
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: 90,
            compressionLevel: 9,
            palette: true,
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: 80,
            lossless: false,
            effort: 6,
          });
          break;
        default:
          sharpInstance = sharpInstance.jpeg({
            quality: 80,
            progressive: true,
          });
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      logger.error('Image optimization failed', { error });
      throw error;
    }
  }

  async getMetadata(input: Buffer): Promise<IFileMetadata> {
    try {
      const metadata = await sharp(input).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        dpi: metadata.density,
        size: metadata.size,
      };
    } catch (error) {
      logger.error('Failed to get image metadata', { error });
      throw error;
    }
  }

  async generateThumbnail(input: Buffer, size: IResizeOptions): Promise<Buffer> {
    try {
      const thumbnail = await sharp(input)
        .resize({
          width: size.width || 150,
          height: size.height || 150,
          fit: size.fit || 'cover',
          position: size.position || 'center',
        })
        .jpeg({
          quality: size.quality || 70,
          progressive: true,
        })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      logger.error('Thumbnail generation failed', { error });
      throw error;
    }
  }

  async watermark(input: Buffer, watermark: Buffer, position?: string): Promise<Buffer> {
    try {
      const gravity = this.mapPositionToGravity(position);
      
      const watermarked = await sharp(input)
        .composite([
          {
            input: watermark,
            gravity,
          },
        ])
        .toBuffer();

      return watermarked;
    } catch (error) {
      logger.error('Watermark application failed', { error });
      throw error;
    }
  }

  private mapPositionToGravity(position?: string): string {
    const positionMap: Record<string, string> = {
      'top-left': 'northwest',
      'top': 'north',
      'top-right': 'northeast',
      'left': 'west',
      'center': 'center',
      'right': 'east',
      'bottom-left': 'southwest',
      'bottom': 'south',
      'bottom-right': 'southeast',
    };

    return positionMap[position || 'bottom-right'] || 'southeast';
  }

  async convertFormat(input: Buffer, targetFormat: string): Promise<Buffer> {
    try {
      let sharpInstance = sharp(input);

      switch (targetFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          sharpInstance = sharpInstance.jpeg({ quality: 90 });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ compressionLevel: 9 });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: 90 });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality: 80 });
          break;
        case 'tiff':
          sharpInstance = sharpInstance.tiff({ compression: 'lzw' });
          break;
        default:
          throw new Error(`Unsupported format: ${targetFormat}`);
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      logger.error('Format conversion failed', { error, targetFormat });
      throw error;
    }
  }

  async autoRotate(input: Buffer): Promise<Buffer> {
    try {
      return await sharp(input).rotate().toBuffer();
    } catch (error) {
      logger.error('Auto-rotation failed', { error });
      throw error;
    }
  }

  async blur(input: Buffer, sigma: number = 5): Promise<Buffer> {
    try {
      return await sharp(input).blur(sigma).toBuffer();
    } catch (error) {
      logger.error('Blur effect failed', { error });
      throw error;
    }
  }

  async sharpen(input: Buffer, sigma: number = 1): Promise<Buffer> {
    try {
      return await sharp(input).sharpen(sigma).toBuffer();
    } catch (error) {
      logger.error('Sharpen effect failed', { error });
      throw error;
    }
  }

  async grayscale(input: Buffer): Promise<Buffer> {
    try {
      return await sharp(input).grayscale().toBuffer();
    } catch (error) {
      logger.error('Grayscale conversion failed', { error });
      throw error;
    }
  }

  async crop(input: Buffer, x: number, y: number, width: number, height: number): Promise<Buffer> {
    try {
      return await sharp(input)
        .extract({ left: x, top: y, width, height })
        .toBuffer();
    } catch (error) {
      logger.error('Crop operation failed', { error });
      throw error;
    }
  }
}