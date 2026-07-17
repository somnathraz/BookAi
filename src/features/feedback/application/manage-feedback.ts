import "server-only";

import { getSiteById } from "@/lib/accounts";
import { getAccountFeedback, saveAccountFeedback } from "@/lib/feedback";
import { apiErrors } from "@/platform/http/api-error";

const MAX_TEXT = 1200;
const MAX_TAGS = 20;

export async function listFeedbackForAccount(email: string) {
  return getAccountFeedback(email);
}

export async function createAccountFeedback(
  email: string,
  input: {
    siteId?: string;
    rating?: number;
    experience?: string;
    desiredFeatures?: string;
    featureTags?: string[];
  }
) {
  const rating = typeof input.rating === "number" ? input.rating : NaN;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw apiErrors.badRequest("Pick a rating from 1 to 5.");
  }

  const siteId = input.siteId?.trim();
  if (siteId && !(await getSiteById(email, siteId))) {
    throw apiErrors.notFound("Site not found.");
  }

  return saveAccountFeedback(email, {
    rating,
    experience: input.experience?.trim().slice(0, MAX_TEXT),
    desiredFeatures: input.desiredFeatures?.trim().slice(0, MAX_TEXT),
    featureTags: Array.isArray(input.featureTags)
      ? input.featureTags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, MAX_TAGS)
      : [],
    siteId,
  });
}
