import { CourierProvider, CreateShipmentRequest, CreateShipmentResponse, WebhookResult } from '../courier-provider.interface';
import { ShipmentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

export class MockCourierProvider implements CourierProvider {
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    return {
      trackingId: `MOCK-${randomUUID().substring(0, 8).toUpperCase()}`,
      consignmentId: randomUUID(),
      shippingCost: 60,
    };
  }

  async cancelShipment(trackingId: string): Promise<boolean> {
    return true;
  }

  async trackShipment(trackingId: string): Promise<any> {
    return {
      trackingId,
      status: 'pending',
    };
  }

  async getRates(weight: number, district: string): Promise<number> {
    return district.toLowerCase() === 'dhaka' ? 60 : 120;
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookResult> {
    // In mock, signature = "valid" is valid
    const isValid = signature === 'valid';
    
    let mappedStatus: ShipmentStatus = ShipmentStatus.IN_TRANSIT;
    if (payload.status === 'delivered') mappedStatus = ShipmentStatus.DELIVERED;
    if (payload.status === 'returned') mappedStatus = ShipmentStatus.RETURNED;

    return {
      isValid,
      externalEventId: payload.eventId || randomUUID(),
      status: mappedStatus,
      externalStatus: payload.status || 'unknown',
      trackingId: payload.trackingId,
      occurredAt: new Date(),
    };
  }
}
