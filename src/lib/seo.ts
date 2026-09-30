const SITE_URL = process.env.SITE_URL || "https://futminna.club";
const SITE_NAME = "Blockchain Club FUTMinna";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export function generateMetaTags(title: string, description: string, image?: string) {
  const ogImage = image || DEFAULT_OG_IMAGE;
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "author", content: SITE_NAME },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:image", content: ogImage },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:site", content: "@bcf_futminna" },
      { rel: "canonical", href: SITE_URL },
    ],
  };
}

export function generateOpenGraph(title: string, description: string, image?: string) {
  const ogImage = image || DEFAULT_OG_IMAGE;

  return {
    "og:title": title,
    "og:description": description,
    "og:image": ogImage,
    "og:type": "website",
    "og:site_name": SITE_NAME,
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": ogImage,
  };
}

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "FUTMinna's premier hub for blockchain innovation, decentralized development, and academic excellence.",
    sameAs: ["https://twitter.com/bcf_futminna", "https://github.com/blockchainclub-futminna"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Minna",
      addressRegion: "Niger State",
      addressCountry: "NG",
    },
  };
}
