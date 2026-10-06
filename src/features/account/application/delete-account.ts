import "server-only";

import {
  deleteAccountByEmail,
  getAccountBilling,
  type DeletedAccountSummary,
} from "@/lib/accounts";
import { deleteAccountFeedback } from "@/lib/feedback";
import { deleteOtpsForEmail, normalizeEmail } from "@/lib/otp";
import { cancelSubscriptionNow } from "@/lib/razorpay";
import { deleteNotificationRequestsForEmail } from "@/features/notifications/infrastructure/notification-request.repository";
import { logger } from "@/platform/logging/logger.server";
import { apiErrors } from "@/platform/http/api-error";

export async function deleteAccount(
  sessionEmail: string,
  confirmEmail: unknown
): Promise<DeletedAccountSummary> {
  if (typeof confirmEmail !== "string" || !confirmEmail.trim()) {
    throw apiErrors.badRequest("Type your email address to confirm account deletion.");
  }

  const session = normalizeEmail(sessionEmail);
  const confirmed = normalizeEmail(confirmEmail);
  if (session !== confirmed) {
    throw apiErrors.badRequest("Confirmation email does not match your signed-in account.");
  }

  const billing = await getAccountBilling(session);
  if (billing.subscriptionId) {
    try {
      await cancelSubscriptionNow(billing.subscriptionId);
    } catch (error) {
      // Tolerate already-cancelled or provider edge cases; local wipe still proceeds.
      logger.warn("account.delete.subscription_cancel_failed", {
        operation: "account.delete",
        errorCode: error instanceof Error ? error.name : "unknown",
      });
    }
  }

  const summary = await deleteAccountByEmail(session);
  await Promise.all([
    deleteAccountFeedback(session),
    deleteOtpsForEmail(session),
    deleteNotificationRequestsForEmail(session),
  ]);

  return summary;
}
