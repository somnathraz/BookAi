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
    slug: "google-search-console-setup-local-business-website-india",
    title:
      "How to set up Google Search Console for a local business website in India",
    description:
      "Set up Google Search Console correctly, check whether key pages are indexed, and use simple monthly signals to improve a local business website.",
    category: "Local growth",
    publishedAt: "2026-09-04",
    readingMinutes: 7,
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1800&q=85",
    imageAlt:
      "A business owner reviewing website performance charts on a laptop screen",
    keywords: [
      "Google Search Console setup for local business website India",
      "how to verify a small business website in Google Search Console",
      "Google Search Console for freelancer portfolio website India",
      "check local service website pages indexed by Google",
    ],
    sections: [
      {
        heading: "Use Search Console to see the questions your website is answering",
        paragraphs: [
          "A local service website can look polished and still be invisible to the people it is meant to help. A tutor, accountant, photographer, or independent designer needs a way to tell whether Google has found the site and which searches bring visitors there. Google Search Console is the practical starting point. It reports how Google crawls and indexes a site, along with search queries, clicks, impressions, and the pages that appeared in results.",
          "Treat it as a customer-language tool, not a scoreboard. A new website does not need to chase a large national keyword. It needs to learn whether people can find its service page, locality details, and enquiry route. If searchers see your page for “maths tutor near Baner” but the page only describes general coaching, that is a useful prompt to clarify what you offer. If nobody sees a key page at all, check indexing before rewriting the copy or buying ads.",
        ],
      },
      {
        heading: "Choose the property type before you verify it",
        paragraphs: [
          "In Search Console, a property is the website scope whose data you will view. For most businesses that control their domain, a Domain property is the cleanest long-term choice because it includes subdomains and both protocol versions. It requires a DNS verification record, so use it when the person setting up Search Console can safely edit the domain’s DNS. Keep the DNS record in place: Google periodically checks verification, and removing it can remove access later.",
          "Choose a URL-prefix property when you need a narrower view or cannot edit DNS. It covers only the exact protocol and prefix entered, so https://example.in and https://www.example.in are different scopes. That detail catches many small businesses: they verify one version, but customers and canonical URLs use another. Enter the live public homepage exactly as it resolves, including https and any www. A URL-prefix property can be verified with an HTML tag, HTML file, Google Analytics, or another method offered in the verification flow.",
        ],
      },
      {
        heading: "Verify access without giving away control of the website",
        paragraphs: [
          "Ask the domain owner, not an agency’s shared inbox, to be a verified owner. If a developer or marketer needs access, the owner can add them later under Settings and Users and permissions. This keeps a business from losing its search data when a freelancer leaves. Use individual Google accounts rather than passing a password around, and remove access when a working relationship ends. Search Console ownership is powerful because it exposes search data and can affect how a site appears in Google.",
          "For DNS verification, copy the TXT record from Google exactly and add it to the domain’s DNS zone. For an HTML-tag method, place the unique meta tag inside the public homepage head; the homepage must load without a login. Do not put the tag in a private dashboard or a page-builder preview. After verification succeeds, add a second method where practical. A backup token can prevent an accidental template change from locking the business out.",
        ],
      },
      {
        heading: "Check the pages that have a job to do",
        paragraphs: [
          "Start with a short checklist: homepage, main service pages, locality or service-area page, contact page, and any booking or enquiry page that should be discoverable. Use URL Inspection to ask whether Google knows the live URL and whether it can be indexed. A page does not need to rank immediately to be useful; first confirm that it is reachable, returns the intended content, and is not blocked by a noindex tag, robots rule, or an accidental redirect.",
          "Submit the sitemap if the site has one, then use it as a discovery aid rather than a guarantee. A sitemap tells Google about important URLs, but it does not force indexing or replace useful internal links. Link each service page from a clear navigation path. Avoid near-duplicate locality pages with only the city name swapped. A smaller collection of accurate, useful pages is easier to maintain.",
        ],
      },
      {
        heading: "Read the first reports with a local-business filter",
        paragraphs: [
          "Once data has had time to arrive, open the Performance report and look at Queries and Pages together. Filter by a service page and ask three plain questions: which words cause it to appear, do those words describe a customer I can help, and does the page make the next step obvious? An AC technician might see impressions for a repair type that is not explained on the page; a freelancer might see project-type searches that deserve a short case-study section. Improve the page for that real need, not by repeating the phrase in every paragraph.",
          "Do not panic over a few impressions, position changes, or a short reporting delay. Google recommends checking Search Console roughly monthly and after meaningful site changes, rather than treating it as a daily task. Record a simple monthly note: the pages receiving impressions, useful queries, enquiry quality, and anything broken or excluded. Compare like-for-like periods only after enough data exists. The point is to find practical work, such as clarifying a service, repairing a bad link, or updating a stale phone number.",
        ],
      },
      {
        heading: "Turn a monthly review into one small website improvement",
        paragraphs: [
          "Give the review a 20-minute routine. First, confirm that the homepage and one priority service page are indexed. Next, scan any email alerts from Search Console. Then read the top queries for the priority page and compare them with the page’s heading, service area, pricing guidance, and call to action. Finally, choose one fix that genuinely reduces customer uncertainty. For example, add the areas a home-visit service covers, explain what a consultation includes, or make the enquiry button visible on mobile.",
          "Keep claims grounded. Search Console can show search visibility, but it cannot prove that a wording change caused revenue or that a page will rank first. Pair it with calls, form enquiries, appointment requests, and customer questions. Over time, this modest habit keeps a local business website aligned with what people actually seek on Google.",
        ],
      },
    ],
  },
  {
    slug: "add-services-google-business-profile-local-business-india",
    title:
      "How to add services to your Google Business Profile for a local business in India",
    description:
      "Create a clear, accurate Google Business Profile services list that helps customers choose the right local service before they call or enquire.",
    category: "Local growth",
    publishedAt: "2026-08-01",
    readingMinutes: 7,
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85",
    imageAlt:
      "A small business team discussing a list of customer services at a table",
    keywords: [
      "add services to Google Business Profile India",
      "Google Business Profile service list for local business",
      "custom services Google Maps service business India",
      "local business website and Google services list",
    ],
    sections: [
      {
        heading: "Use the services list to answer a customer's first question",
        paragraphs: [
          "A person searching Google for a plumber, tutor, makeup artist, accountant, or website designer is often trying to answer one small question before they call: do you do the exact thing I need? A clear services list on a Google Business Profile gives them that answer. It can make a local business easier to understand without asking a visitor to decode a broad category, scan old Instagram posts, or send a vague WhatsApp message.",
          "Start with the work you can genuinely deliver now. A home tutor might list board-exam maths tuition, a trial class, and online tuition; a photographer might list birthday photography, product photography, and a pre-wedding consultation. A freelance web professional might list a one-page business website, website refresh, and maintenance consultation. The goal is a useful menu of customer choices, not a complete internal catalogue of every task your team has ever done.",
        ],
      },
      {
        heading: "Set the right category before writing the individual services",
        paragraphs: [
          "Google tailors the services editor to the business category on the profile. That makes the category a practical operating decision, not a keyword field. Choose the category that best describes the main business, then add only genuinely useful additional categories. A salon does not need a category for every treatment, and a designer does not need one for every software tool. Too many loosely related categories can make the profile and the services list harder to maintain.",
          "Open your verified Business Profile in Google Search or Maps, select Edit services, and inspect the suggested services before adding custom ones. If the suggested wording matches what a customer would recognise, use it. It saves explanation and keeps the list easy to scan. Add a custom service only when a meaningful customer-facing offering is absent. Google says custom service names must not contain prices, phone numbers, personal information, gibberish, or policy-violating text, so put detail in the appropriate description or price field rather than turning the name into an advertisement.",
        ],
      },
      {
        heading: "Name services like a customer would ask for them",
        paragraphs: [
          "Use plain names that describe the outcome, not a clever campaign. “AC repair visit”, “bridal makeup consultation”, “GST registration consultation”, or “five-page business website” is clearer than “Best quality service in Delhi” or “Limited offer website package”. The name should help someone decide whether to open the service, while the business description and website can carry the wider story about your experience and approach.",
          "Keep related services at the same level of detail. If a yoga studio lists “beginner yoga class” and “prenatal yoga class”, do not add “wellness” as a third item unless it is a separately bookable service with a clear meaning. If a local repair business offers inspection, repair, and installation, explain the difference so a customer does not choose an inspection believing it includes a replacement part. Consistent naming also makes it easier for whoever answers the phone or WhatsApp to follow the same language that the customer saw on Google.",
        ],
      },
      {
        heading: "Add descriptions and prices only when they reduce uncertainty",
        paragraphs: [
          "A service description should answer the next decision question: what is included, who is it for, and what must happen before it is confirmed? For example, a photographer can say that a birthday package includes a planning call and a defined coverage window, while a website consultant can explain that the first call reviews goals, existing pages, and a realistic next step. Keep it factual. Do not promise a result you cannot control or repeat every locality and keyword in each description.",
          "Show a price when it is stable and useful, such as a fixed consultation fee, a class fee, or a starting inspection charge. For variable work, give a truthful starting point or explain that the estimate follows a site visit or brief. Do not present a low starting price as if it includes travel, materials, revisions, or taxes when it does not. Customers value a clear range and an honest qualification step more than a price that creates an awkward correction later.",
        ],
      },
      {
        heading: "Make the Google list and website reinforce each other",
        paragraphs: [
          "Every important service on the profile should have a matching path on your website. The page does not need to be long: state who it helps, the broad scope, the service area or remote boundary, and one direct action to request availability or a quote. A service such as “home painting estimate” should lead to a page that collects locality and job size; “website consultation” can lead to a short enquiry form or booking page. Never make a profile service point to an unrelated homepage where the visitor must begin their search again.",
          "Keep the wording aligned, but do not copy the profile text word for word across many thin pages. The Google list helps people select an offering; the website should provide the practical detail that helps them decide to enquire. Check that names, pricing guidance, response times, and availability claims agree across both places. If you stop offering a service or change its scope, update the profile and the website together so an old listing does not create avoidable disappointment.",
        ],
      },
      {
        heading: "Review the list after real customer conversations",
        paragraphs: [
          "After publishing, view the profile on a phone as a customer would. Confirm that every service name is understandable without internal knowledge, every description is accurate, and no price or link is stale. Google may surface services differently depending on category and context, so treat the list as helpful business information rather than a guaranteed search-result feature. Save a simple dated note of the list so that a colleague can recognise what changed and why.",
          "Then use enquiries as feedback. If several customers ask whether an offered service includes a home visit, add that condition to the description or service page. If people repeatedly request something you do not offer, make the boundary clearer rather than adding it just to attract a search. Review the list quarterly and after any change to hours, staff capability, area, or pricing. A maintained service list earns its place by helping the right customer take a confident next step—not by making the profile look fuller.",
        ],
      },
    ],
  },
  {
    slug: "choose-preferred-google-business-profile-booking-link-india",
    title:
      "How to choose the preferred Google Business Profile booking link for your business website",
    description:
      "Choose one clear booking destination for Google visitors when your local business has a website, scheduler, WhatsApp, or marketplace profile.",
    category: "Local growth",
    publishedAt: "2026-07-29",
    readingMinutes: 7,
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1800&q=85",
    imageAlt:
      "A business owner comparing appointment options in a calendar on a laptop",
    keywords: [
      "choose preferred Google Business Profile booking link India",
      "Google Business Profile preferred booking link for local business",
      "website versus scheduler booking link for service business",
      "local business Google Maps appointment link strategy",
    ],
    sections: [
      {
        heading: "Give a ready customer one obvious next step",
        paragraphs: [
          "A customer who finds a salon, tutor, photographer, clinic, repair service, or consultant on Google Search or Maps may see more than one way to book. Perhaps there is a website request form, a scheduling tool, a marketplace listing, and a WhatsApp number. Choice can be useful, but it can also send the customer to a page that does not match the service they just searched for. The preferred booking link is your chance to put the most dependable path first.",
          "Do not choose it because the destination looks newest or because a provider has offered a promotion. Choose the link that lets a customer understand the service, take the right action, and receive a truthful next-step message with the least uncertainty. For a yoga class with fixed places, that may be a live schedule. For a home painter who must inspect the job, it is more likely a website page for requesting an estimate. The best link follows the real workflow rather than pretending every enquiry is an instant reservation.",
        ],
      },
      {
        heading: "List every booking route before picking a favourite",
        paragraphs: [
          "Make a small list of the places where a Google visitor can currently land: your own booking page, a provider-hosted calendar, an aggregator profile, a social-media link, and any old campaign page. Open each one on a phone and write down what happens after the customer taps its main action. Check the service name, price or estimate guidance, availability message, contact fallback, confirmation, and the information you receive as the business. An abandoned link is still a customer-facing promise if Google can show it.",
          "Then test the routes with realistic scenarios. A salon can try a haircut appointment and a bridal enquiry; a tutor can try a trial class and a request from outside the normal area; a freelance designer can try a small landing-page project and a larger website brief. Notice whether the route collects enough context, whether it asks for too much too soon, and whether you can reply without copying information between tools. The preferred link should handle the most common high-intent request well. It does not need to handle every unusual case alone.",
        ],
      },
      {
        heading: "Choose a website page when the work needs a human check",
        paragraphs: [
          "Your website is usually the stronger preferred destination when a booking needs qualification before it can be confirmed. A photographer may need event date, city, coverage hours, and style; a tax professional may need the type of consultation; a home-service business may need locality and the nature of the repair. A focused page can explain these conditions in plain language, give a short request form, and say when the customer will hear back. It also gives you room to show relevant work, policies, and a phone or WhatsApp fallback without making an external scheduler do work it was not designed for.",
          "Keep that page tightly matched to the Google link. A button labelled “Book” should not land on a general homepage where the visitor must search for a contact form. Lead with the service, the area or remote-service boundary, and an honest call to action such as “Request a consultation” or “Check appointment availability”. Ask only for the details needed to decide the next step. If confirmation takes a business day, say so beside the form. Clear language protects trust better than a calendar that appears available but still requires manual approval.",
        ],
      },
      {
        heading: "Choose a scheduling page only when it can keep its promise",
        paragraphs: [
          "A provider-hosted scheduling page can be the better choice when the visitor can truly choose a slot and receive a reliable confirmation. This suits repeatable services with current availability: a studio class, a paid coaching call, a salon service with a managed calendar, or a portfolio review with fixed call windows. Before making it preferred, confirm that opening hours, staff calendars, service duration, buffer time, payment rules, and cancellation terms are maintained. A convenient link becomes costly if people book times that the business later has to cancel.",
          "Avoid splitting the same appointment across several booking tools unless staff can see and update all calendars immediately. If a marketplace or external provider already appears on the profile, check whether it offers a different service or merely duplicates your own route. Google lets businesses manage multiple local business links and set a business-preferred link, but the platform’s display can vary. Treat the preferred setting as guidance, not a reason to neglect the other visible destinations. Every live link needs a working, consistent customer experience.",
        ],
      },
      {
        heading: "Review the link like an operating tool, not a one-time setting",
        paragraphs: [
          "After choosing the destination, complete a real test from the public Business Profile on a phone. Check that the final page loads securely, has the right business identity, does not require an unexpected sign-in, and supplies a useful success message. Submit a test request only if you can safely identify and remove it from your workflow. If you use tracking, keep it simple and privacy-respecting: a distinct source label or campaign parameter is enough to tell a Google booking enquiry from another lead. Do not let measurement break the page or obscure the URL.",
          "Review the first ten or twenty enquiries from that route. Are customers asking questions the page should answer? Are they trying to book services you do not offer, or selecting slots you cannot honour? Is one external link producing lower-quality leads because its description is stale? Update the destination, staff process, or service wording before adding more automation. A well-chosen preferred booking link is not an SEO trick. It is a small piece of customer service: it gives a person arriving from Google the fastest honest route from interest to a workable next step.",
        ],
      },
    ],
  },
  {
    slug: "add-google-business-profile-booking-link-to-website-india",
    title:
      "How to add a Google Business Profile booking link to your website in India",
    description:
      "Send high-intent Google visitors to a clear booking page that collects the right details without promising an appointment too early.",
    category: "Local growth",
    publishedAt: "2026-07-28",
    readingMinutes: 7,
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85",
    imageAlt:
      "A local business owner planning customer appointments on a laptop",
    keywords: [
      "add Google Business Profile booking link to website India",
      "Google Maps booking link for local service business",
      "salon appointment page from Google Business Profile",
      "freelancer consultation booking link website India",
    ],
    sections: [
      {
        heading: "Treat the link as a handoff, not a promise of an open slot",
        paragraphs: [
          "A customer who finds a salon, tutor, accountant, photographer, or consultant on Google Search or Maps is often close to acting. A booking link can send that person to your own website instead of making them hunt through a bio or call without context. The useful version is not simply a button labelled “Book”. It is a short handoff from a Google profile to a page that explains the service, asks for the few details you need, and tells the visitor what happens next.",
          "Start by deciding whether the visitor can genuinely reserve a time immediately. A yoga studio with a live class schedule may let people choose and confirm a place. A home-repair business, wedding photographer, or tax consultant usually needs to check location, scope, travel time, or availability first. In that case, call the action “Request an appointment”, “Check availability”, or “Book a consultation”. Honest wording prevents the common disappointment of a customer believing a slot is confirmed when it is only an enquiry.",
        ],
      },
      {
        heading: "Build one page that matches the searcher’s intent",
        paragraphs: [
          "Send the Google booking link to a focused page, not a crowded homepage. The first screen should name the service or appointment type, say who it is for, and make the next action obvious. For example, a physiotherapist might lead with “Request a home visit in Bengaluru”, while a freelance designer might use “Book a 20-minute website consultation”. Include a plain-language summary, typical duration or response window, locality or remote-service details, and a contact fallback for people who prefer to call or message.",
          "Keep the page specific to the action you advertised. If your profile is for a makeup artist and the visitor taps a booking link, do not send them to a portfolio page that has no route to enquire. If you offer several services, a simple choice at the start is enough: bridal enquiry, party makeup, or studio consultation. Do not ask every possible question before the visitor can submit. The first booking request needs only the information that determines whether you can help.",
        ],
      },
      {
        heading: "Ask for the details that make a reply possible",
        paragraphs: [
          "For most local services, use a small form or booking request with name, mobile number or email, requested service, preferred date or time, and area. Add one optional notes field when a visitor may need to explain a requirement. A remote professional can replace area with project type, preferred call time, and a short goal. Mark only essential fields as required. A long questionnaire is better after you have accepted the enquiry, when the customer knows why you need more information.",
          "Set an expectation directly beside the submit button. “We confirm appointment requests within one business day” is more credible than a vague success message. The confirmation screen should repeat the next step and offer a direct way to correct an error. If you use WhatsApp or a phone call to finish bookings, say so. A customer who has just come from Google should not have to guess whether their request disappeared into a form or whether they should wait for a reply.",
        ],
      },
      {
        heading: "Add the link only after the destination works on a phone",
        paragraphs: [
          "Google lets eligible Business Profiles add links for actions such as bookings, and availability can vary by business type and region. Before adding one, open the page on a modest mobile connection and complete a real test request yourself. Check that the page uses HTTPS, loads without a sign-in wall, has no broken buttons, and makes the business name and contact details easy to recognise. A link that leads to a generic error, a different business name, or a page requiring an account weakens the trust your profile earned.",
          "In your Business Profile, manage the relevant transaction link from the Booking area in Search or from the profile editing flow in Maps. Use the exact final URL, then check the public profile after Google has processed the edit. Google’s policies require functional, crawlable links and can limit duplicate or excessive links. Keep one primary link per booking journey. If you work with an external scheduling provider as well as your website, decide which destination gives the customer the clearest service information and confirmation path before adding both.",
        ],
      },
      {
        heading: "Make the website, profile, and follow-up say the same thing",
        paragraphs: [
          "Use the same service name, area, business phone number, and opening or response hours on the booking page and your Google profile. A customer should not see “free consultation” on Google and find a paid appointment page after tapping. If a home visit has a travel charge outside a core area, explain that before the request is sent. If a freelancer works remotely across India but meets in person only in Hyderabad, write that distinction clearly. Consistency is more valuable than clever promotional language.",
          "Create a lightweight process for incoming requests before traffic grows. Record the request, check the details, reply with availability, and send one written confirmation only after the time is actually reserved. Review the first ten submissions: are people selecting the wrong service, asking about areas you do not cover, or abandoning at a particular field? Improve the page with that evidence. A good Google booking link does not just produce more taps; it helps the right customer reach a clear next step and makes every follow-up easier to manage.",
        ],
      },
    ],
  },
  {
    slug: "describe-service-area-local-business-website-india",
    title:
      "How to describe a local service area on your business website in India",
    description:
      "Show customers exactly where you work, set realistic expectations, and avoid thin city pages that create confusion instead of enquiries.",
    category: "Local growth",
    publishedAt: "2026-07-27",
    readingMinutes: 7,
    image:
      "https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&w=1800&q=85",
    imageAlt:
      "A business owner planning routes across a city map beside a laptop",
    keywords: [
      "how to show service area on local business website India",
      "service area page for home service business",
      "local business website city coverage page",
      "service area website copy for Indian freelancers",
    ],
    sections: [
      {
        heading: "Make the coverage promise before a customer asks for it",
        paragraphs: [
          "A home tutor in Pune, a photographer in Kochi, or an AC repair team in Noida can lose a good enquiry for a simple reason: the visitor cannot tell whether the business reaches their area. A service-area section solves that uncertainty. It says where you normally work, what kind of appointment or project you take there, and how a customer should ask about an edge case. This is more helpful than a decorative map or a long, unverified list of neighbourhood names.",
          "Start with the real operating boundary, not the largest geography you would like to reach. Write a direct sentence near the main contact action: “We provide at-home piano lessons across South Bengaluru” or “I work with website clients remotely across India and in person in Ahmedabad.” Then add a short list of the cities, zones, or localities you serve regularly. A visitor should know in seconds whether to enquire, without interpreting vague phrases such as “all areas” or “nearby locations.”",
        ],
      },
      {
        heading: "Match your website to the way the service is actually delivered",
        paragraphs: [
          "The right wording depends on whether clients come to you, you go to them, or both. A salon with a staffed storefront can give its address, opening hours, and the nearby areas where it also offers home visits. A plumber who works from a residential base but never receives customers there should describe the service area and contact route without publishing that home address. A remote freelancer should be equally clear about when location matters: a Delhi-based videographer may work nationally for editing but limit on-site shoots to selected cities.",
          "Add the practical conditions that change the customer’s decision. State whether travel charges apply outside a core zone, whether an on-site visit needs a minimum order, and whether appointments are available on particular days. You do not need a complicated pricing calculator. A simple line such as “Appointments beyond Thane are confirmed after checking travel time” prevents a promise your team cannot keep. If coverage changes by service, put that detail on the relevant service page rather than hiding it in a general footer.",
        ],
      },
      {
        heading: "Use a short, useful list instead of creating a page for every city",
        paragraphs: [
          "One well-written service-area page is usually a better first step than dozens of pages that swap only a city name. Search engines and customers both need a page to have a real purpose. A list of identical pages for “cleaner in [city]” can send every visitor to the same generic contact form and make it harder for people to find genuinely useful information. Keep a single coverage page in the website navigation, link to it from relevant service pages, and update it when your working area changes.",
          "Create a separate local page only when you can give the visitor distinct, decision-making information. For example, an interior designer with a regular studio day in Mysuru could explain appointment availability there, show completed local work with permission, describe delivery or site-visit arrangements, and name a relevant contact path. That is a real page. If the only difference is the heading, the locality has no reliable service detail, or the business does not actually serve it, leave it out. Accuracy builds more trust than a longer keyword list.",
        ],
      },
      {
        heading: "Keep Google and your website consistent without copying everything",
        paragraphs: [
          "Customers often meet a local business first through Google Search or Maps and then open its website to decide whether to call. Check that your business name, phone number, core service, and coverage description agree across both places. Google Business Profile guidance treats service areas as specific cities, postal codes, or regions rather than a radius, and recommends a realistic overall area. Use that as a prompt to audit old claims on your site, visiting cards, and social bios before publishing a new coverage section.",
          "Do not invent an extra location, virtual office, or separate profile merely to look local. If you have a real storefront where customers are served, show the address and current hours. If you travel to customers and do not receive them at your base, explain the service area instead. On the website, a map can be useful when it clarifies a meeting point or actual service boundary, but it should never replace plain text. A screen reader user and a hurried mobile visitor both need the answer written out.",
        ],
      },
      {
        heading: "Turn the service-area section into a clearer enquiry workflow",
        paragraphs: [
          "Finish the section with one action that asks for the detail you need next. A home-service business can use “Check availability in your area” and ask for locality, preferred date, and service required. A freelancer can use “Discuss your project” and ask whether the work is remote or on site. Keep the first form or WhatsApp message short; asking for a full address before a customer even knows you cover their locality can feel intrusive. Confirm the exact address only after the service and slot are viable.",
          "Review the section after the first month. Note which places generate enquiries you cannot take, which areas customers ask about repeatedly, and whether travel conditions cause confusion. Add a locality only when you can consistently serve it; remove one when the promise is no longer true. The best service-area page is not an SEO trick. It is a small operating agreement between your website and the customer: here is where we work, here is what to expect, and here is the easiest way to find out whether we can help.",
        ],
      },
    ],
  },
  {
    slug: "accept-upi-advance-payments-freelancer-website-india",
    title: "How to accept UPI advance payments from a freelancer website in India",
    description:
      "Set up a clear, trustworthy advance-payment step for project work or local services without turning your website into a complicated checkout.",
    category: "Independent work",
    publishedAt: "2026-07-26",
    readingMinutes: 7,
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "A customer paying at a small business counter with a mobile phone",
    keywords: [
      "accept UPI advance payments freelancer website India",
      "UPI payment link for service business website",
      "collect booking deposit online India",
      "freelancer advance payment workflow India",
    ],
    sections: [
      {
        heading: "Use an advance to confirm a real commitment, not to add friction",
        paragraphs: [
          "A tutor reserving an evening slot, a photographer blocking a wedding date, or a designer starting a project all face the same problem: an enquiry is not yet a confirmed booking. A modest advance can make the next step clear for both sides. It helps a customer commit and gives the business a defined point at which to begin preparation, travel, or calendar planning. The website does not need to become a full online store for this to work.",
          "Begin with a policy you can explain in one or two sentences. State what the advance confirms, whether it is adjusted against the final amount, and the conditions for rescheduling or a refund. Put this beside the payment action rather than hiding it in a long terms page. If the final price depends on a site visit, scope discussion, or materials, collect an agreed fixed booking amount instead of asking a visitor to guess a project total.",
        ],
      },
      {
        heading: "Choose the lightest payment path that matches the job",
        paragraphs: [
          "For a one-off service or freelance project, a payment link from your chosen payment provider is usually simpler than building a checkout into the site. It opens a hosted payment page, lets the customer complete the payment with an available method such as UPI, and gives you a transaction record in the provider dashboard. Add the link after you have confirmed the service, date, scope, and advance amount; it can be sent by WhatsApp or email as well as shown on a confirmation page.",
          "A static UPI QR can work at an in-person counter, but it is a weak substitute for a specific online booking. The customer may enter the wrong amount, and you must reconcile an unlabelled transfer by hand. Do not publish a personal UPI ID as a catch-all payment button for client work. Use a business-appropriate, verified collection method and complete its onboarding and KYC requirements. NPCI supports merchant payments through QR and intent-based UPI flows; the provider's current terms, settlement timing, and supported methods should decide the exact setup.",
        ],
      },
      {
        heading: "Make the payment request unmistakably specific",
        paragraphs: [
          "A good request answers five questions before a customer pays: who is collecting the money, what it is for, how much is due now, what happens after payment, and where to ask for help. Name the service and date or project reference in the page or message: “₹1,000 advance for 14 August home consultation” is safer and more useful than “Pay now”. Show your business name, contact number, and a reachable support channel so the recipient can verify a link before opening it.",
          "Keep the button label concrete: “Pay ₹1,000 booking advance” or “Pay project start advance” beats “Checkout”. If the amount varies, do not leave a generic payment button on every service page. First collect the enquiry, confirm the amount personally, then send a fresh request with a meaningful description. That small pause prevents accidental payments and avoids the awkward task of reversing money when the service is not actually available.",
        ],
      },
      {
        heading: "Verify the payment before you promise the slot or start work",
        paragraphs: [
          "A payment screenshot is not confirmation. Check the completed payment in the dashboard or bank record attached to your chosen collection method, then mark the booking or project as confirmed. Use one simple status list: enquiry received, details agreed, payment requested, payment verified, confirmed, completed. A spreadsheet is enough at first. The important part is that the person replying to customers knows which status is true and does not rely on a forwarded image or an unverified message.",
          "Send a short confirmation after verification. Include the service or project, advance paid, remaining amount or next pricing step, date and time if relevant, and your rescheduling contact. For a freelancer, this can also say when the brief, contract, or first draft is due. For a local service, it can repeat the address, preparation instructions, or arrival window. This message turns a transaction into a shared record and reduces repeated “is my booking confirmed?” follow-ups.",
        ],
      },
      {
        heading: "Add only the information that builds trust",
        paragraphs: [
          "A payment action belongs after a visitor understands your service, not in the first line of the homepage. Put it on a booking confirmation page, a clear service page, or a proposal page. Around it, show the practical proof a cautious customer needs: what you do, your locality or service area, portfolio or relevant examples, business hours, contact details, and the advance policy. Make the layout easy to read on a phone, where most UPI payments will begin.",
          "Review the workflow after the first ten requests. Note where customers hesitate, how often the amount needs correcting, and whether payment verification delays a booking. Improve the copy or the handoff before adding automation. A reliable advance-payment process is deliberately modest: clear agreement first, a specific payment request second, verified receipt third, and one written confirmation at the end. That is enough to protect time without making a small business feel impersonal.",
        ],
      },
    ],
  },
  {
    slug: "add-whatsapp-booking-button-to-local-business-website-india",
    title: "How to add a WhatsApp booking button to a local business website in India",
    description:
      "Set up a clear WhatsApp booking path that turns mobile visitors into organised enquiries without building a complicated booking system.",
    category: "Local growth",
    publishedAt: "2026-07-25",
    readingMinutes: 7,
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Two small-business owners discussing customer bookings on a laptop",
    keywords: [
      "add WhatsApp booking button to website India",
      "WhatsApp booking link for local business",
      "local service business website WhatsApp button",
      "WhatsApp appointment booking for freelancers",
    ],
    sections: [
      {
        heading: "Treat the button as the start of a small booking system",
        paragraphs: [
          "For a salon, tutor, photographer, repair service, consultant, or freelancer, a visitor who is ready to ask a question should not have to search for a contact form. A WhatsApp button can be the shortest path from a service page to a real conversation, especially on a phone. But a button by itself does not create an organised booking process. It only moves the enquiry into a chat where it can still be missed, answered late, or confused with another lead.",
          "Start by deciding what the first message needs to achieve. For most local services, it should help you identify the requested service, preferred date or time, locality, and the customer’s name. A freelancer may need project type, budget range, and deadline instead. This is a useful distinction: the website should make the customer confident enough to tap; the first WhatsApp exchange should collect only the information needed to decide the next step.",
        ],
      },
      {
        heading: "Create one focused link with a helpful pre-filled message",
        paragraphs: [
          "Use a WhatsApp click-to-chat link with your business number in international format: country code 91 followed by the mobile number, with no plus sign, spaces, or punctuation. Add a short pre-filled message so the customer does not begin with only “Hi”. For example: “Hello, I would like to book [service]. My preferred date is [date].” Keep it editable. A visitor should be able to replace the placeholder quickly rather than send an inaccurate message.",
          "Make a different link when the intent is meaningfully different. A salon’s haircut page can open “I would like to book a haircut,” while its bridal-service page can ask for event date and location. A designer’s portfolio can open “I would like to discuss a website project.” This gives you useful context without a long form, and it lets you see which page is producing enquiries. Do not make ten tiny variations just for tracking; separate links only when the response or follow-up will actually differ.",
        ],
      },
      {
        heading: "Put it where a mobile visitor expects it",
        paragraphs: [
          "The strongest placement is near the first explanation of your service, after the visitor understands what you offer. Repeat the same call to action after pricing guidance, portfolio proof, or FAQs, where people commonly decide to enquire. Use direct labels such as “Book on WhatsApp”, “Ask about availability”, or “Get a quote on WhatsApp”. “Contact us” is less clear because it hides the channel and the outcome.",
          "Keep the phone number visible as a fallback for people who prefer calling, and show service hours close to the button. If you cannot respond immediately, say what happens next: “We reply within business hours” is better than implying instant confirmation. Avoid a permanent floating button that covers important form fields or prices on small screens. Open every button on an actual phone before publishing; this is where a broken number format, an unclear label, or a hidden sticky element becomes obvious.",
        ],
      },
      {
        heading: "Make the chat easy to handle when work is busy",
        paragraphs: [
          "Prepare a single, human first reply before the enquiries arrive. It can acknowledge the message, restate the key details you need, and set the response expectation: “Thanks for reaching out. Please share the service, preferred slot, and your area. We will confirm availability today.” Save it as a quick reply in WhatsApp Business if that suits your workflow. Do not promise a slot until someone has checked the calendar, staff availability, travel time, or equipment needed.",
          "Use simple labels or a short spreadsheet to track each enquiry through the same stages: new enquiry, details received, slot offered, confirmed, completed, and follow-up. The tool matters less than the habit. Give every confirmed customer one clear message that includes the service, date, time, address or meeting link, price or estimate if applicable, and any next action. This reduces the avoidable back-and-forth that makes messaging feel chaotic.",
        ],
      },
      {
        heading: "Connect the website, Google profile, and real-world touchpoints",
        paragraphs: [
          "Use the same business number and service language everywhere customers find you: your website, Instagram bio, visiting card QR code, and Google Business Profile. Google currently lets eligible, claimed and verified Business Profiles add WhatsApp as a chat contact option, though availability varies by region. Check the live profile after saving because Google may show one chat option differently from another. Consistency matters more than clever copy: a customer should recognise the same business and know what will happen after tapping.",
          "Finally, review the messages after two weeks. Which questions repeat? Which page produces vague enquiries? Are customers asking for prices before they understand the service? Add the useful answer to the website, improve the pre-filled message, or clarify the button label. A WhatsApp booking button works best as a feedback loop: each conversation should make the next visitor’s path shorter and clearer, not simply add more chats to manage.",
        ],
      },
    ],
  },
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
