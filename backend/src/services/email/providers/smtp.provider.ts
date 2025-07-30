import nodemailer from 'nodemailer';
import { IEmailProvider, IEmailOptions, IEmailResult } from '../../../interfaces/email.interface';
import { logger } from '../../../utils/logger';

export class SMTPProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter;

  constructor(private config: any) {
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  async send(options: IEmailOptions): Promise<IEmailResult> {
    try {
      const mailOptions = {
        from: options.from || this.config.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
          contentDisposition: att.contentDisposition,
          cid: att.cid,
        })),
        replyTo: options.replyTo,
        headers: options.headers,
        priority: options.priority,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      };
    } catch (error) {
      logger.error('SMTP send error', { error, options });
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
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed', { error });
      return false;
    }
  }
}