"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStateMachine = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../../../common/errors");
class OrderStateMachine {
    static transitions = {
        [client_1.OrderStatus.PENDING]: [client_1.OrderStatus.RISK_REVIEW, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.RISK_REVIEW]: [client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.VERIFICATION_REQUIRED, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.VERIFICATION_REQUIRED]: [client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.CONFIRMED]: [client_1.OrderStatus.PROCESSING, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.PROCESSING]: [client_1.OrderStatus.SHIPPED, client_1.OrderStatus.CANCELLED],
        [client_1.OrderStatus.SHIPPED]: [client_1.OrderStatus.OUT_FOR_DELIVERY, client_1.OrderStatus.RTO],
        [client_1.OrderStatus.OUT_FOR_DELIVERY]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.RTO],
        [client_1.OrderStatus.DELIVERED]: [],
        [client_1.OrderStatus.CANCELLED]: [],
        [client_1.OrderStatus.RTO]: [],
    };
    static canTransition(from, to) {
        const allowed = this.transitions[from];
        return allowed?.includes(to) ?? false;
    }
    static validateTransition(from, to) {
        if (!this.canTransition(from, to)) {
            throw new errors_1.ValidationError(`Invalid state transition from ${from} to ${to}`);
        }
    }
}
exports.OrderStateMachine = OrderStateMachine;
