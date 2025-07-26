import { Service } from 'typedi';
import { IEmailOptions, IEmailResult, IEmailProvider, EmailStatus, IEmailTemplate } from '../../interfaces/email.interface';
import { SendGridProvider } from './providers/sendgrid.provider';
import { SESProvider } from './providers/ses.provider';
import { SMTPProvider } from './providers/smtp.provider';
import { EmailQueue } from './email.queue';
import { EmailTemplateService } from './email-template.service';
import { servicesConfig } from '../../config/services.config';
import { logger } from '../../utils/logger';

@Service()
export class EmailService {
  private provider: IEmailProvider;
  private queue: EmailQueue;
  private templateService: EmailTemplateService;

  constructor() {
    this.provider = this.initializeProvider();
    this.queue = new EmailQueue();
    this.templateService = new EmailTemplateService();
  }

  private initializeProvider(): IEmailProvider {
    const { defaultProvider, providers } = servicesConfig.email;
    
    switch (defaultProvider) {
      case 'sendgrid':
        return new SendGridProvider(providers.sendgrid);
      case 'ses':
        return new SESProvider(providers.ses);
      case 'smtp':
        return new SMTPProvider(providers.smtp);
      default:
        throw new Error(`Unknown email provider: ${defaultProvider}`);
    }
  }

  async send(options: IEmailOptions): Promise<IEmailResult> {
    try {
      if (options.template) {
        const template = await this.templateService.getTemplate(options.template);
        options = await this.applyTemplate(options, template);
      }

      const result = await this.provider.send(options);
      
      await this.trackEmail({
        messageId: result.messageId,
        recipient: Array.isArray(options.to) ? options.to[0] : options.to,
        status: EmailStatus.SENT,
        opens: 0,
        clicks: 0,
      });

      logger.info('Email sent successfully', { messageId: result.messageId, to: options.to });
      return result;
    } catch (error) {
      logger.error('Failed to send email', { error, options });
      throw error;
    }
  }

  async sendQueued(options: IEmailOptions, delay?: number): Promise<string> {
    return this.queue.add(options, delay);
  }

  async sendBulk(recipients: string[], options: Omit<IEmailOptions, 'to'>): Promise<IEmailResult[]> {
    const results: IEmailResult[] = [];
    const batchSize = servicesConfig.email.queue.batchSize;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchOptions = batch.map(to => ({ ...options, to }));
      
      try {
        const batchResults = await this.provider.sendBulk(batchOptions);
        results.push(...batchResults);
      } catch (error) {
        logger.error('Failed to send batch', { error, batch });
        results.push(...batch.map(to => ({
          messageId: '',
          accepted: [],
          rejected: [to],
          error: error.message,
        })));
      }
    }

    return results;
  }

  async sendTemplate(
    to: string | string[],
    templateName: string,
    variables: Record<string, any> = {},
    options: Partial<IEmailOptions> = {}
  ): Promise<IEmailResult> {
    const template = await this.templateService.getTemplate(templateName);
    
    const emailOptions: IEmailOptions = {
      ...options,
      to,
      template: templateName,
      variables,
      subject: template.subject,
    };

    return this.send(emailOptions);
  }

  private async applyTemplate(options: IEmailOptions, template: IEmailTemplate): Promise<IEmailOptions> {
    const { html, text, subject } = await this.templateService.render(
      template,
      options.variables || {}
    );

    return {
      ...options,
      html,
      text,
      subject: options.subject || subject,
    };
  }

  private async trackEmail(tracking: any): Promise<void> {
    try {
      await this.queue.addTracking(tracking);
    } catch (error) {
      logger.error('Failed to track email', { error, tracking });
    }
  }

  async getEmailStatus(messageId: string): Promise<any> {
    return this.queue.getStatus(messageId);
  }

  async retryFailed(): Promise<number> {
    return this.queue.retryFailed();
  }

  async cleanupOldEmails(days: number = 30): Promise<number> {
    return this.queue.cleanup(days);
  }

  async verifyConnection(): Promise<boolean> {
    return this.provider.verifyConnection();
  }
}