import "server-only";

import {
  businessSearchAvailable,
  searchBusinesses,
} from "@/lib/business-search";
import { ApiError, apiErrors } from "@/platform/http/api-error";

export async function searchBusinessDirectory(query: string) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) {
    throw apiErrors.badRequest("Enter a business name and city.");
  }
  if (normalizedQuery.length > 140) {
    throw apiErrors.badRequest("That search is too long.");
  }
  if (!businessSearchAvailable()) {
    throw new ApiError(503, "search_unavailable", "Business search is not configured.");
  }

  try {
    return await searchBusinesses(normalizedQuery);
  } catch {
    throw new ApiError(502, "upstream_unavailable", "Business search is temporarily unavailable.");
  }
}
