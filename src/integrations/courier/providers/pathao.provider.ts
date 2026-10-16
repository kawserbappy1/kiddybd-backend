import { CourierProvider, CreateShipmentRequest, CreateShipmentResponse, WebhookResult } from '../courier-provider.interface';
import { ShipmentStatus } from '@prisma/client';

export class PathaoProvider implements CourierProvider {
  private baseUrl = process.env.PATHAO_BASE_URL || 'https://api-hermes.pathao.com';
  private clientId = process.env.PATHAO_CLIENT_ID || '';
  private clientSecret = process.env.PATHAO_CLIENT_SECRET || '';
  private username = process.env.PATHAO_USERNAME || '';
  private password = process.env.PATHAO_PASSWORD || '';
  private storeId = process.env.PATHAO_STORE_ID ? Number(process.env.PATHAO_STORE_ID) : 484067;

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  private async getAccessToken(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret || !this.username || !this.password) {
      return null;
    }

    // Return cached token if valid (with 5 min buffer)
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.cachedToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          username: this.username,
          password: this.password,
          grant_type: 'password',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.cachedToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in || 7776000) * 1000;
        return this.cachedToken;
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('Pathao issue-token failed:', errData);
      }
    } catch (err) {
      console.warn('Pathao token request error:', err);
    }

    return null;
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    const token = await this.getAccessToken();

    if (token) {
      try {
        const payload = {
          store_id: this.storeId,
          merchant_order_id: request.orderId,
          recipient_name: request.customerName,
          recipient_phone: request.customerPhone,
          recipient_address: request.customerAddress,
          delivery_type: 48, // Standard delivery
          item_type: 2, // Parcel
          special_instruction: 'Handle with care - KiddyBD order',
          item_quantity: 1,
          item_weight: String(request.weight || 1),
          item_description: 'Kids Product from KiddyBD',
          amount_to_collect: request.codAmount || 0,
        };

        const response = await fetch(`${this.baseUrl}/aladdin/api/v1/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.ok && data?.data) {
          return {
            trackingId: data.data.consignment_id || `PT-${Date.now()}`,
            consignmentId: String(data.data.consignment_id || data.data.order_id || Date.now()),
            shippingCost: data.data.delivery_fee || 60,
          };
        } else {
          console.warn('Pathao order create failed response:', data);
        }
      } catch (err) {
        console.warn('Pathao live order creation error, falling back to mock:', err);
      }
    }

    // Fallback simulation
    const mockTracking = `PT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      trackingId: mockTracking,
      consignmentId: mockTracking,
      shippingCost: 60,
    };
  }

  async cancelShipment(trackingId: string): Promise<boolean> {
    return true;
  }

  async trackShipment(trackingId: string): Promise<any> {
    const token = await this.getAccessToken();
    if (token) {
      try {
        const response = await fetch(`${this.baseUrl}/aladdin/api/v1/orders/${trackingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.warn('Pathao track error:', err);
      }
    }
    return { status: 'In Transit', trackingId };
  }

  async getRates(weight: number, district: string): Promise<number> {
    return 60;
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookResult> {
    let mappedStatus: ShipmentStatus = ShipmentStatus.IN_TRANSIT;
    const statusStr = (payload.order_status || payload.status || '').toLowerCase();

    if (statusStr.includes('delivered')) {
      mappedStatus = ShipmentStatus.DELIVERED;
    } else if (statusStr.includes('return') || statusStr.includes('cancel')) {
      mappedStatus = ShipmentStatus.RETURNED;
    } else if (statusStr.includes('picked')) {
      mappedStatus = ShipmentStatus.PICKED_UP;
    } else if (statusStr.includes('delivery')) {
      mappedStatus = ShipmentStatus.OUT_FOR_DELIVERY;
    }

    return {
      isValid: true,
      externalEventId: payload.updated_at || Date.now().toString(),
      status: mappedStatus,
      externalStatus: statusStr,
      trackingId: payload.consignment_id || payload.tracking_id || '',
      occurredAt: new Date(),
    };
  }
}
