import { OrderStatus } from '@prisma/client';
import { ValidationError } from '../../../common/errors';

export class OrderStateMachine {
  private static readonly transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.RISK_REVIEW, OrderStatus.CANCELLED],
    [OrderStatus.RISK_REVIEW]: [OrderStatus.CONFIRMED, OrderStatus.VERIFICATION_REQUIRED, OrderStatus.CANCELLED],
    [OrderStatus.VERIFICATION_REQUIRED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.RTO],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.RTO],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.RTO]: [],
  };

  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = this.transitions[from];
    return allowed?.includes(to) ?? false;
  }

  static validateTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ValidationError(`Invalid state transition from ${from} to ${to}`);
    }
  }
}
