import sgMail from '@sendgrid/mail';
import { IEmailProvider, IEmailOptions, IEmailResult } from '../../../interfaces/email.interface';
import { logger } from '../../../utils/logger';

export class SendGridProvider implements IEmailProvider {
  constructor(private config: any) {
    if (!config.apiKey) {
      throw new Error('SendGrid API key is required');
    }
    sgMail.setApiKey(config.apiKey);
  }

  async send(options: IEmailOptions): Promise<IEmailResult> {
    try {
      const msg = {
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        from: options.from || this.config.from,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType,
          disposition: att.contentDisposition || 'attachment',
          contentId: att.cid,
        })),
        replyTo: options.replyTo || this.config.replyTo,
        headers: options.headers,
        categories: options.tags,
        trackingSettings: {
          clickTracking: { enable: options.trackClicks ?? true },
          openTracking: { enable: options.trackOpens ?? true },
        },
      };

      const [response] = await sgMail.send(msg);
      
      return {
        messageId: response.headers['x-message-id'] || '',
        accepted: Array.isArray(options.to) ? options.to : [options.to],
        rejected: [],
        response: `${response.statusCode} ${response.headers}`,
      };
    } catch (error) {
      logger.error('SendGrid send error', { error, options });
      throw error;
    }
  }

  async sendBulk(options: IEmailOptions[]): Promise<IEmailResult[]> {
    try {
      const messages = options.map(opt => ({
        to: opt.to,
        cc: opt.cc,
        bcc: opt.bcc,
        from: opt.from || this.config.from,
        subject: opt.subject,
        text: opt.text,
        html: opt.html,
        replyTo: opt.replyTo || this.config.replyTo,
        headers: opt.headers,
        categories: opt.tags,
      }));

      const responses = await sgMail.send(messages);
      
      return responses.map((response, index) => ({
        messageId: response[0].headers['x-message-id'] || '',
        accepted: Array.isArray(options[index].to) ? options[index].to : [options[index].to],
        rejected: [],
        response: `${response[0].statusCode}`,
      }));
    } catch (error) {
      logger.error('SendGrid bulk send error', { error });
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const testMsg = {
        to: 'test@example.com',
        from: this.config.from,
        subject: 'Connection Test',
        text: 'Test',
        mailSettings: {
          sandboxMode: { enable: true },
        },
      };
      
      await sgMail.send(testMsg);
      return true;
    } catch (error) {
      logger.error('SendGrid connection verification failed', { error });
      return false;
    }
  }
}