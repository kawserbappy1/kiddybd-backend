import { ShipmentStatus } from '@prisma/client';

export interface CreateShipmentRequest {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  weight: number;
  codAmount: number;
}

export interface CreateShipmentResponse {
  trackingId: string;
  consignmentId: string;
  labelUrl?: string;
  shippingCost: number;
}

export interface WebhookResult {
  isValid: boolean;
  externalEventId: string;
  status: ShipmentStatus;
  externalStatus: string;
  location?: string;
  description?: string;
  trackingId: string;
  occurredAt: Date;
}

export interface CourierProvider {
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse>;
  cancelShipment(trackingId: string): Promise<boolean>;
  trackShipment(trackingId: string): Promise<any>;
  getRates(weight: number, district: string): Promise<number>;
  handleWebhook(payload: any, signature: string): Promise<WebhookResult>;
}
