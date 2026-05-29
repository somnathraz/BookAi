import type { BusinessDomain, CertificationItem } from "@/lib/types";

const DOMAIN_HINT: Record<BusinessDomain, string> = {
  developer: "software engineering and technical delivery",
  designer: "design craft and user-centred product work",
  doctor: "clinical practice and patient care",
  consultant: "strategy, analysis, and client advisory",
  photographer: "visual storytelling and professional photography",
  restaurant: "hospitality operations and food service",
  fitness: "fitness coaching and wellness programming",
  other: "professional practice",
};

/** One-line context when only a cert name came from the resume (no AI). */
export function certDetailFallback(name: string, domain?: BusinessDomain): string {
  const n = name.toLowerCase();

  if (n.includes("aws") && (n.includes("architect") || n.includes("saa")))
    return "Validates designing secure, scalable systems on Amazon Web Services.";
  if (n.includes("aws")) return "Professional certification in Amazon Web Services cloud platforms.";
  if (n.includes("azure")) return "Microsoft Azure cloud skills and solution design.";
  if (n.includes("google cloud") || n.includes("gcp"))
    return "Google Cloud Platform architecture and operations.";
  if (n.includes("kubernetes") || n.includes("cka") || n.includes("ckad"))
    return "Production-grade container orchestration with Kubernetes.";
  if (n.includes("terraform")) return "Infrastructure as code and cloud provisioning best practices.";
  if (n.includes("pmp")) return "Project Management Professional — industry-standard project leadership.";
  if (n.includes("scrum") || n.includes("psm") || n.includes("csm"))
    return "Agile delivery and Scrum team leadership certification.";
  if (n.includes("cpa")) return "Certified Public Accountant — licensed accounting and financial reporting.";
  if (n.includes("cfa")) return "Chartered Financial Analyst — advanced investment analysis.";
  if (n.includes("mba")) return "Master of Business Administration — advanced business leadership.";
  if (n.includes("phd") || n.includes("doctorate"))
    return "Doctoral qualification demonstrating deep research expertise.";
  if (n.includes("b.tech") || n.includes("btech") || n.includes("b.e"))
    return "Undergraduate engineering degree.";
  if (n.includes("m.tech") || n.includes("mtech"))
    return "Postgraduate engineering specialization.";
  if (/\b(b\.?a|b\.?sc|m\.?a|m\.?sc|degree)\b/.test(n))
    return "Academic qualification supporting professional expertise.";
  if (n.includes("license") || n.includes("licensed"))
    return "Professional license authorizing regulated practice.";
  if (n.includes("award") || n.includes("honou") || n.includes("honor"))
    return "Recognition for outstanding professional contribution.";

  const hint = DOMAIN_HINT[domain ?? "other"];
  return `Credential validating expertise in ${hint}.`;
}

export function enrichCertifications(
  names: string[],
  domain?: BusinessDomain
): CertificationItem[] {
  return names
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((name) => ({ name, detail: certDetailFallback(name, domain) }));
}

/** Merge AI-written detail lines onto resume-extracted cert names. */
export function mergeCertifications(
  ai: unknown,
  base: CertificationItem[]
): CertificationItem[] {
  if (!base.length) return [];
  if (!Array.isArray(ai) || !ai.length) return base;

  const aiItems: CertificationItem[] = ai
    .slice(0, 12)
    .map((c, i) => {
      if (typeof c === "string") {
        const name = c.trim();
        return name ? { name, detail: "" } : null;
      }
      if (c && typeof c === "object") {
        const row = c as { name?: unknown; detail?: unknown };
        const name =
          typeof row.name === "string" ? row.name.trim() : base[i]?.name ?? "";
        const detail = typeof row.detail === "string" ? row.detail.trim() : "";
        return name ? { name, detail } : null;
      }
      return null;
    })
    .filter((c): c is CertificationItem => Boolean(c));

  return base.map((b, i) => {
    const byIndex =
      aiItems[i]?.name.toLowerCase() === b.name.toLowerCase() ? aiItems[i] : undefined;
    const byName = aiItems.find((a) => a.name.toLowerCase() === b.name.toLowerCase());
    const match = byIndex ?? byName;
    if (!match?.detail) return b;
    return { name: b.name, detail: match.detail.slice(0, 160) };
  });
}

/** Accept legacy string[] stored in older site JSON. */
export function normalizeCertifications(
  items: CertificationItem[] | string[] | undefined,
  domain?: BusinessDomain
): CertificationItem[] {
  if (!items?.length) return [];
  if (typeof items[0] === "string") {
    return enrichCertifications(items as string[], domain);
  }
  return (items as CertificationItem[]).map((c) => ({
    name: c.name,
    detail: c.detail || certDetailFallback(c.name, domain),
  }));
}
