import { Request, Response } from 'express';
import { orderService } from './order.service';
import { CreateOrderDto } from './order.schema';
import { paymentService } from '../payments/payment.service';

export const orderController = {
  async createOrder(req: Request, res: Response) {
    const userId = req.user!.id;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key header is required' });
    }
    
    const dto: CreateOrderDto = req.body;
    const order = await orderService.createOrder(userId, dto, idempotencyKey);
    
    // If it's a restored response, we might just return it. For now, always 201.
    res.status(201).json({ success: true, data: order });
  },

  async createDirectOrder(req: Request, res: Response) {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    const order = await orderService.createDirectOrder(req.body, idempotencyKey);

    const paymentMethod = req.body.paymentMethod || 'COD';
    let gatewayUrl: string | undefined = undefined;

    // If online payment (SSLCommerz, BKASH, NAGAD), initiate payment gateway session
    if (paymentMethod !== 'COD') {
      try {
        const paymentResult = await paymentService.initiatePayment(
          order.id,
          order.customerId,
          paymentMethod === 'SSLCOMMERZ' ? 'SSLCommerz' : paymentMethod
        );
        gatewayUrl = paymentResult.redirectUrl;
      } catch (paymentErr) {
        console.error('Failed to auto-initiate online payment gateway:', paymentErr);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryCharge),
        discountAmount: Number(order.discount),
        total: Number(order.total),
        paymentMethod: paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        recipientName: (order.shippingAddressSnapshot as any)?.fullName || '',
        phone: (order.shippingAddressSnapshot as any)?.phone || '',
        deliveryAddress: `${(order.shippingAddressSnapshot as any)?.streetAddress || ''}, ${(order.shippingAddressSnapshot as any)?.thana || ''}, ${(order.shippingAddressSnapshot as any)?.district || ''}`,
        deliveryNotes: (order.shippingAddressSnapshot as any)?.deliveryNotes || '',
        createdAt: order.createdAt.toISOString(),
        gatewayUrl,
      },
    });
  },

  async getOrderByOrderNumber(req: Request, res: Response) {
    const orderNumber = req.params.orderNumber as string;
    const order = await orderService.getOrderByOrderNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const shipping = order.shippingAddressSnapshot as any;
    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentStatus === 'PENDING' ? 'COD' : 'ONLINE',
        recipientName: shipping?.fullName || '',
        phone: shipping?.phone || '',
        deliveryAddress: `${shipping?.streetAddress || ''}, ${shipping?.thana || ''}, ${shipping?.district || ''}`,
        deliveryNotes: shipping?.deliveryNotes || '',
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryCharge),
        discountAmount: Number(order.discount),
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          title: it.productNameSnapshot,
          slug: it.productNameSnapshot.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          price: Number(it.unitPrice),
          quantity: it.quantity,
          imageUrl: it.product?.media?.[0]?.url || undefined,
        })),
        courierPartner: {
          name: (order.shipment?.courier?.name as any) || 'Pathao',
          trackingCode: order.shipment?.trackingId || `PTH-${order.orderNumber.replace(/\D/g, '') || '882910'}`,
          trackingUrl:
            order.shipment?.courier?.name?.toLowerCase() === 'pathao'
              ? `https://pathao.com/courier/tracking?tracking_id=${order.shipment?.trackingId || order.orderNumber}`
              : order.shipment?.courier?.name?.toLowerCase() === 'redx'
              ? `https://redx.com.bd/track?tracking_id=${order.shipment?.trackingId || order.orderNumber}`
              : `https://steadfast.com.bd/t/${order.shipment?.trackingId || order.orderNumber.replace(/\D/g, '') || '882910'}`,
        },
      },
    });
  },

  async getOrders(req: Request, res: Response) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const orders = await orderService.getOrders(userId);
    res.json({ success: true, data: orders });
  },

  async getOrderById(req: Request, res: Response) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const orderId = req.params.id as string;
    const order = await orderService.getOrderById(userId, orderId);
    res.json({ success: true, data: order });
  },

  async cancelOrder(req: Request, res: Response) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const orderId = req.params.id as string;
    const result = await orderService.cancelOrder(userId, orderId);
    res.json({ success: true, data: result });
  }
};
