import "server-only";

import { ensureSchema, getSql } from "@/lib/db";

export interface AccountFeedback {
  email: string;
  rating: number;
  experience?: string;
  desiredFeatures?: string;
  featureTags: string[];
  siteId?: string;
  createdAt: number;
  updatedAt: number;
}

const memAccountFeedback = new Map<string, AccountFeedback>();

function key(email: string): string {
  return email.trim().toLowerCase();
}

function rowToFeedback(row: {
  email: string;
  rating: number;
  experience: string | null;
  desired_features: string | null;
  feature_tags: string[] | null;
  site_id: string | null;
  created_at: Date;
  updated_at: Date;
}): AccountFeedback {
  return {
    email: row.email,
    rating: row.rating,
    experience: row.experience ?? undefined,
    desiredFeatures: row.desired_features ?? undefined,
    featureTags: row.feature_tags ?? [],
    siteId: row.site_id ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function getAccountFeedback(email: string): Promise<AccountFeedback | null> {
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<
      {
        email: string;
        rating: number;
        experience: string | null;
        desired_features: string | null;
        feature_tags: string[] | null;
        site_id: string | null;
        created_at: Date;
        updated_at: Date;
      }[]
    >`
      select email, rating, experience, desired_features, feature_tags, site_id, created_at, updated_at
        from account_feedback
       where email = ${key(email)}
       limit 1`;
    const row = rows[0];
    return row ? rowToFeedback(row) : null;
  }
  return memAccountFeedback.get(key(email)) ?? null;
}

export async function saveAccountFeedback(
  email: string,
  input: {
    rating: number;
    experience?: string;
    desiredFeatures?: string;
    featureTags?: string[];
    siteId?: string;
  }
): Promise<AccountFeedback> {
  const normalizedEmail = key(email);
  const tags = (input.featureTags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 20);
  const now = Date.now();

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<
      {
        email: string;
        rating: number;
        experience: string | null;
        desired_features: string | null;
        feature_tags: string[] | null;
        site_id: string | null;
        created_at: Date;
        updated_at: Date;
      }[]
    >`
      insert into account_feedback (
        email, rating, experience, desired_features, feature_tags, site_id, created_at, updated_at
      ) values (
        ${normalizedEmail},
        ${input.rating},
        ${input.experience ?? null},
        ${input.desiredFeatures ?? null},
        ${sql.array(tags)},
        ${input.siteId ?? null},
        to_timestamp(${now} / 1000.0),
        to_timestamp(${now} / 1000.0)
      )
      on conflict (email) do update set
        rating = excluded.rating,
        experience = excluded.experience,
        desired_features = excluded.desired_features,
        feature_tags = excluded.feature_tags,
        site_id = coalesce(excluded.site_id, account_feedback.site_id),
        updated_at = excluded.updated_at
      returning email, rating, experience, desired_features, feature_tags, site_id, created_at, updated_at`;
    return rowToFeedback(rows[0]);
  }

  const existing = memAccountFeedback.get(normalizedEmail);
  const saved: AccountFeedback = {
    email: normalizedEmail,
    rating: input.rating,
    experience: input.experience,
    desiredFeatures: input.desiredFeatures,
    featureTags: tags,
    siteId: input.siteId ?? existing?.siteId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  memAccountFeedback.set(normalizedEmail, saved);
  return saved;
}

/** @deprecated Use saveAccountFeedback — kept for publish quick-rating. */
export async function saveSiteFeedback(
  siteId: string,
  email: string,
  rating: number,
  comment?: string
): Promise<void> {
  await saveAccountFeedback(email, {
    rating,
    experience: comment,
    siteId,
  });
}
