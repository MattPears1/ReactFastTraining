import AWS from 'aws-sdk';
import { IEmailProvider, IEmailOptions, IEmailResult } from '../../../interfaces/email.interface';
import { logger } from '../../../utils/logger';

export class SESProvider implements IEmailProvider {
  private ses: AWS.SES;

  constructor(private config: any) {
    this.ses = new AWS.SES({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });
  }

  async send(options: IEmailOptions): Promise<IEmailResult> {
    try {
      const params: AWS.SES.SendEmailRequest = {
        Source: options.from || this.config.from,
        Destination: {
          ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
          CcAddresses: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [],
          BccAddresses: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [],
        },
        Message: {
          Subject: { Data: options.subject },
          Body: {
            Text: options.text ? { Data: options.text } : undefined,
            Html: options.html ? { Data: options.html } : undefined,
          },
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : [],
        Tags: options.tags?.map(tag => ({ Name: tag, Value: 'true' })),
      };

      const result = await this.ses.sendEmail(params).promise();
      
      return {
        messageId: result.MessageId,
        accepted: Array.isArray(options.to) ? options.to : [options.to],
        rejected: [],
        response: result.$response.httpResponse.statusMessage,
      };
    } catch (error) {
      logger.error('SES send error', { error, options });
      throw error;
    }
  }

  async sendBulk(options: IEmailOptions[]): Promise<IEmailResult[]> {
    const results: IEmailResult[] = [];
    
    for (const opt of options) {
      try {
        const result = await this.send(opt);
        results.push(result);
      } catch (error) {
        results.push({
          messageId: '',
          accepted: [],
          rejected: Array.isArray(opt.to) ? opt.to : [opt.to],
          error: error.message,
        });
      }
    }
    
    return results;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.ses.getSendQuota().promise();
      return true;
    } catch (error) {
      logger.error('SES connection verification failed', { error });
      return false;
    }
  }
}