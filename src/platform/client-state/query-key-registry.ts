/**
 * Browser query identities. Feature code imports these keys instead of
 * retyping cache prefixes, so mutation invalidation stays intentional.
 */
export const clientQueryKeys = {
  authentication: {
    prefix: "auth:",
    session: "auth:session",
  },
  billing: {
    prefix: "billing:",
    summary: "billing:summary",
  },
  dashboard: {
    prefix: "dashboard:",
    sites: "dashboard:sites",
  },
  sites: {
    prefix: "site:",
  },
  system: {
    capabilities: "system:capabilities",
  },
} as const;
