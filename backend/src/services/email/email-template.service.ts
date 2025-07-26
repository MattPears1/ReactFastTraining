import { Service } from 'typedi';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import fs from 'fs/promises';
import path from 'path';
import { IEmailTemplate, EmailCategory } from '../../interfaces/email.interface';
import { logger } from '../../utils/logger';

@Service()
export class EmailTemplateService {
  private templates: Map<string, IEmailTemplate> = new Map();
  private compiledTemplates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.registerHelpers();
    this.loadTemplates();
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString();
    });

    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    Handlebars.registerHelper('if_eq', function(a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toUpperCase() || '';
    });

    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + '...';
    });
  }

  private async loadTemplates(): Promise<void> {
    const templatesDir = path.join(__dirname, '../../../templates/email');
    
    try {
      const files = await fs.readdir(templatesDir);
      
      for (const file of files) {
        if (file.endsWith('.mjml') || file.endsWith('.hbs')) {
          await this.loadTemplate(path.join(templatesDir, file));
        }
      }
    } catch (error) {
      logger.warn('Failed to load email templates from directory', { error });
      this.loadDefaultTemplates();
    }
  }

  private async loadTemplate(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const name = path.basename(filePath, path.extname(filePath));
      
      const template: IEmailTemplate = {
        id: name,
        name,
        subject: this.extractSubject(content) || name,
        htmlContent: content,
        variables: this.extractVariables(content),
        category: this.determineCategory(name),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.templates.set(name, template);
    } catch (error) {
      logger.error('Failed to load template', { filePath, error });
    }
  }

  private loadDefaultTemplates(): void {
    const defaultTemplates: IEmailTemplate[] = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{companyName}}!',
        htmlContent: this.getWelcomeTemplate(),
        variables: ['firstName', 'companyName', 'loginUrl'],
        category: EmailCategory.TRANSACTIONAL,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        subject: 'Reset Your Password',
        htmlContent: this.getPasswordResetTemplate(),
        variables: ['firstName', 'resetUrl', 'expiryTime'],
        category: EmailCategory.TRANSACTIONAL,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'order-confirmation',
        name: 'Order Confirmation',
        subject: 'Order Confirmation #{{orderNumber}}',
        htmlContent: this.getOrderConfirmationTemplate(),
        variables: ['firstName', 'orderNumber', 'orderDate', 'items', 'total', 'trackingUrl'],
        category: EmailCategory.TRANSACTIONAL,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'newsletter',
        name: 'Newsletter',
        subject: '{{subject}}',
        htmlContent: this.getNewsletterTemplate(),
        variables: ['subject', 'content', 'unsubscribeUrl'],
        category: EmailCategory.MARKETING,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async getTemplate(name: string): Promise<IEmailTemplate> {
    const template = this.templates.get(name);
    
    if (!template) {
      throw new Error(`Template '${name}' not found`);
    }

    if (!template.isActive) {
      throw new Error(`Template '${name}' is not active`);
    }

    return template;
  }

  async render(template: IEmailTemplate, variables: Record<string, any>): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    try {
      let compiledTemplate = this.compiledTemplates.get(template.id);
      
      if (!compiledTemplate) {
        compiledTemplate = Handlebars.compile(template.htmlContent);
        this.compiledTemplates.set(template.id, compiledTemplate);
      }

      const htmlWithVariables = compiledTemplate(variables);
      
      let html: string;
      let text: string = '';

      if (template.htmlContent.includes('<mjml>')) {
        const mjmlResult = mjml2html(htmlWithVariables);
        if (mjmlResult.errors.length > 0) {
          logger.warn('MJML compilation warnings', { errors: mjmlResult.errors });
        }
        html = mjmlResult.html;
      } else {
        html = htmlWithVariables;
      }

      if (template.textContent) {
        const textTemplate = Handlebars.compile(template.textContent);
        text = textTemplate(variables);
      } else {
        text = this.htmlToText(html);
      }

      const subjectTemplate = Handlebars.compile(template.subject);
      const subject = subjectTemplate(variables);

      return { html, text, subject };
    } catch (error) {
      logger.error('Failed to render template', { templateId: template.id, error });
      throw error;
    }
  }

  private extractSubject(content: string): string | null {
    const match = content.match(/<!--\s*subject:\s*(.+?)\s*-->/i);
    return match ? match[1] : null;
  }

  private extractVariables(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim().split(/[\s.#]/)[0];
      if (variable && !['if', 'unless', 'each', 'with'].includes(variable)) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  private determineCategory(name: string): EmailCategory {
    if (name.includes('marketing') || name.includes('newsletter') || name.includes('promotion')) {
      return EmailCategory.MARKETING;
    }
    if (name.includes('notification') || name.includes('alert')) {
      return EmailCategory.NOTIFICATION;
    }
    if (name.includes('system') || name.includes('admin')) {
      return EmailCategory.SYSTEM;
    }
    return EmailCategory.TRANSACTIONAL;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getWelcomeTemplate(): string {
    return `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" font-weight="bold">Welcome to {{companyName}}!</mj-text>
        <mj-text>Hi {{firstName}},</mj-text>
        <mj-text>Thank you for joining us. We're excited to have you on board!</mj-text>
        <mj-button href="{{loginUrl}}">Get Started</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
  }

  private getPasswordResetTemplate(): string {
    return `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" font-weight="bold">Reset Your Password</mj-text>
        <mj-text>Hi {{firstName}},</mj-text>
        <mj-text>You requested to reset your password. Click the button below to create a new password.</mj-text>
        <mj-button href="{{resetUrl}}">Reset Password</mj-button>
        <mj-text font-size="12px">This link will expire in {{expiryTime}}.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
  }

  private getOrderConfirmationTemplate(): string {
    return `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" font-weight="bold">Order Confirmation</mj-text>
        <mj-text>Hi {{firstName}},</mj-text>
        <mj-text>Thank you for your order #{{orderNumber}} placed on {{formatDate orderDate}}.</mj-text>
        <mj-table>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
          {{#each items}}
          <tr>
            <td>{{name}}</td>
            <td>{{quantity}}</td>
            <td>{{formatCurrency price}}</td>
          </tr>
          {{/each}}
        </mj-table>
        <mj-text font-size="18px" font-weight="bold">Total: {{formatCurrency total}}</mj-text>
        <mj-button href="{{trackingUrl}}">Track Order</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
  }

  private getNewsletterTemplate(): string {
    return `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" font-weight="bold">{{subject}}</mj-text>
        <mj-raw>{{{content}}}</mj-raw>
        <mj-divider />
        <mj-text font-size="12px" align="center">
          <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
  }
}