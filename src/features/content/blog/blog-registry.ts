export interface BlogArticle {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly publishedAt: string;
  readonly readingMinutes: number;
  readonly image: string;
  readonly imageAlt: string;
  readonly keywords: readonly string[];
  readonly sections: readonly {
    readonly heading: string;
    readonly paragraphs: readonly string[];
  }[];
}

/** Editorial source of truth. Scheduled publishing adds a reviewed article here. */
export const blogRegistry: readonly BlogArticle[] = [
  {
    slug: "create-local-business-website-from-google-maps-listing",
    title: "How to create a local business website from a Google Maps listing",
    description:
      "Turn the details customers already find on Google into a focused, booking-ready website without starting from a blank page.",
    category: "Local growth",
    publishedAt: "2026-07-24",
    readingMinutes: 6,
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "A calm, light-filled independent business workspace",
    keywords: [
      "create website from Google Maps listing",
      "local business website India",
      "Google Business Profile website",
    ],
    sections: [
      {
        heading: "Start with the information customers already trust",
        paragraphs: [
          "For a local service business, the first website does not need a grand reinvention. It needs to make the next customer action obvious: call, message, get directions, or book.",
          "A complete Google Maps listing already contains useful raw material: your business name, category, location, hours, phone number, reviews, photos, and often the language customers use to describe you. Reusing those facts avoids the most common small-business website problem: a beautiful page that says almost nothing useful.",
        ],
      },
      {
        heading: "Use a short page structure that answers real questions",
        paragraphs: [
          "A good local-business site usually needs five things: what you do, where you serve, why people choose you, how to contact you, and how to take the next step. Keep the page in that order.",
          "Add only services you actually offer. Include your locality in the opening copy. If appointments matter, put booking or WhatsApp before a long brand story. Visitors should not need to hunt for a phone number after deciding they want help.",
        ],
      },
      {
        heading: "Review before publishing",
        paragraphs: [
          "Imported details give you a strong first draft, not automatic truth. Check opening hours, pricing language, contact numbers, photos, and every claim that could change. Remove old reviews or outdated services rather than filling space.",
          "Then open the page on a phone. Most local visitors arrive from a map result, a WhatsApp message, or a social profile; the mobile experience is the real product.",
        ],
      },
      {
        heading: "Publish, measure, and improve one useful thing at a time",
        paragraphs: [
          "Share the link where customers already find you: Google Business Profile, Instagram bio, WhatsApp Business, and printed QR codes. Notice the questions people still ask before booking, then make those answers easier to find on the page.",
          "The goal is not a larger website. It is fewer missed enquiries and more confident customers.",
        ],
      },
    ],
  },
  {
    slug: "small-business-website-cost-india",
    title: "What should a small business website cost in India?",
    description:
      "A practical way to compare a DIY builder, a freelancer, and a custom agency site without paying for features you will not use.",
    category: "Practical guide",
    publishedAt: "2026-07-17",
    readingMinutes: 5,
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85",
    imageAlt: "Two people planning a business website at a shared table",
    keywords: ["small business website cost India", "website builder for local business"],
    sections: [
      {
        heading: "Pay for the outcome, not a long feature list",
        paragraphs: [
          "The right budget depends on what the site must do. A local studio that needs calls and booking has a different job from an online shop with inventory and payment flows.",
          "Before comparing prices, write down one customer action the site must improve. That makes it easier to reject expensive extras that do not help your business grow.",
        ],
      },
      {
        heading: "Choose a setup that you can maintain",
        paragraphs: [
          "A simple builder is usually a good start when your details are ready and you want to update text yourself. A freelancer is useful when the story, photography, or integrations need deliberate craft. Custom development makes sense when the business model itself needs custom software.",
          "Whichever route you choose, make sure you own the domain, can edit core details, and know the ongoing hosting and support cost.",
        ],
      },
    ],
  },
  {
    slug: "turn-freelance-resume-into-portfolio-website",
    title: "How to turn a freelance resume into a portfolio website",
    description:
      "A simple structure for showing proof, services, and availability before a prospective client asks for a PDF.",
    category: "Independent work",
    publishedAt: "2026-07-10",
    readingMinutes: 4,
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=85",
    imageAlt: "A laptop and notebook on a creative professional's desk",
    keywords: ["turn resume into portfolio website", "freelance portfolio website India"],
    sections: [
      {
        heading: "Lead with the work a client can understand",
        paragraphs: [
          "A resume is chronological. A portfolio should be persuasive. Start with the service you want to be hired for, then show a few projects that make that promise believable.",
          "For each project, describe the client problem, what you contributed, and the result you can support. Clear context is more useful than a gallery of anonymous screenshots.",
        ],
      },
      {
        heading: "Make the next conversation easy",
        paragraphs: [
          "Your availability, location or time zone, preferred contact method, and the kind of projects you accept should be simple to find. A great portfolio gets wasted when a potential client cannot tell how to start.",
        ],
      },
    ],
  },
] as const;

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return blogRegistry.find((article) => article.slug === slug);
}
