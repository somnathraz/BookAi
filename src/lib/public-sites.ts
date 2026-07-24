/** Public-safe projection of a live site for homepage / gallery listings. */
export interface PublicSiteCard {
  slug: string;
  name: string;
  domain: string;
  domainLabel: string;
  tagline?: string;
  /** Same-origin or absolute image URL safe for <img>. */
  photoUrl?: string;
  href: string;
  /** ISO 8601 */
  publishedAt: string;
}
