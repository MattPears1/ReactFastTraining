export interface StripeMetrics {
  paymentIntentsCreated: number;
  paymentIntentsSucceeded: number;
  paymentIntentsFailed: number;
  webhooksProcessed: number;
  webhooksFailed: number;
  averageProcessingTime: number;
}

export class StripeMetricsService {
  private static metrics: StripeMetrics = {
    paymentIntentsCreated: 0,
    paymentIntentsSucceeded: 0,
    paymentIntentsFailed: 0,
    webhooksProcessed: 0,
    webhooksFailed: 0,
    averageProcessingTime: 0,
  };

  static incrementPaymentIntentsCreated(): void {
    this.metrics.paymentIntentsCreated++;
  }

  static incrementPaymentIntentsSucceeded(): void {
    this.metrics.paymentIntentsSucceeded++;
  }

  static incrementPaymentIntentsFailed(): void {
    this.metrics.paymentIntentsFailed++;
  }

  static incrementWebhooksProcessed(): void {
    this.metrics.webhooksProcessed++;
  }

  static incrementWebhooksFailed(): void {
    this.metrics.webhooksFailed++;
  }

  static updateAverageProcessingTime(newTime: number): void {
    const totalProcessed = this.metrics.paymentIntentsSucceeded + this.metrics.paymentIntentsFailed;
    if (totalProcessed === 0) {
      this.metrics.averageProcessingTime = newTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (totalProcessed - 1) + newTime) / totalProcessed;
    }
  }

  static getMetrics(): StripeMetrics {
    return { ...this.metrics };
  }

  static resetMetrics(): void {
    this.metrics = {
      paymentIntentsCreated: 0,
      paymentIntentsSucceeded: 0,
      paymentIntentsFailed: 0,
      webhooksProcessed: 0,
      webhooksFailed: 0,
      averageProcessingTime: 0,
    };
  }
}