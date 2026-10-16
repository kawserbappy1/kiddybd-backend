"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEngine = void 0;
const client_1 = require("@prisma/client");
class RiskEngine {
    static evaluate(signals) {
        let score = 0;
        const reasons = [];
        const triggeredSignals = [];
        // Signal 1: High RTO Rate
        if (signals.rtoRate > 30) {
            score += 30;
            reasons.push('High RTO rate (>30%)');
            triggeredSignals.push('HIGH_RTO_RATE');
        }
        // Signal 2: New account + high order value
        // Assuming > 5000 is high order value for this context, can be adjusted
        if (signals.accountAgeDays < 7 && signals.orderValue > 5000) {
            score += 20;
            reasons.push('New account (<7 days) with high order value');
            triggeredSignals.push('NEW_ACCOUNT_HIGH_VALUE');
        }
        // Signal 3: Multiple failed orders
        if (signals.failedOrdersCount > 3) {
            score += 15;
            reasons.push('Multiple failed orders (>3)');
            triggeredSignals.push('MULTIPLE_FAILED_ORDERS');
        }
        // Signal 4: Good history
        if (signals.completedOrdersCount > 3 && signals.rtoRate < 10) {
            score -= 20;
            reasons.push('Good history (multiple completed, low RTO)');
            triggeredSignals.push('GOOD_HISTORY');
        }
        // Ensure score stays within bounds
        score = Math.max(0, Math.min(100, score));
        // Rule: Single signal alone CANNOT classify customer as fraudulent
        if (triggeredSignals.length === 1 && triggeredSignals[0] !== 'GOOD_HISTORY') {
            // Cap score to ensure it doesn't trigger HIGH risk if there's only one negative signal
            if (score >= 70) {
                score = 69;
            }
        }
        let level = client_1.RiskLevel.LOW;
        let action = 'Normal Processing';
        if (score >= 70) {
            level = client_1.RiskLevel.HIGH;
            action = 'Advance Payment or Manual Review Required';
        }
        else if (score >= 30) {
            level = client_1.RiskLevel.MEDIUM;
            action = 'Verification Required (OTP/SMS)';
        }
        return {
            score,
            level,
            signals: triggeredSignals,
            reasons,
            action
        };
    }
}
exports.RiskEngine = RiskEngine;
