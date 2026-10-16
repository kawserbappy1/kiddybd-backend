export interface PaymentProvider {
  createPayment(paymentId: string, orderId: string, amount: number, customerInfo: any): Promise<{ redirectUrl: string; transactionId: string }>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refundPayment(transactionId: string, amount: number): Promise<boolean>;
  handleWebhook(payload: any, signature: string): Promise<{
    isValid: boolean;
    transactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    externalEventId: string;
  }>;
}
