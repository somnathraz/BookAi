/** Features users can vote for on the feedback page. */
export const FEEDBACK_FEATURE_OPTIONS = [
  "Custom domain",
  "More sites",
  "Email & WhatsApp booking",
  "Built-in scheduling",
  "Hindi & regional languages",
  "Instagram import",
  "LinkedIn import",
  "Remove PaperChai branding",
  "Analytics & insights",
  "E-commerce / payments",
  "Blog or news section",
  "Team / multi-user access",
] as const;

export type FeedbackFeatureTag = (typeof FEEDBACK_FEATURE_OPTIONS)[number];
