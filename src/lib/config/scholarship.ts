/** Parses Postgres-style "2026-10-10 23:59:00+01" (JS needs "…T23:59:00+01:00"). */
function parseTimestamp(value: string) {
  return new Date(value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
}

export const scholarshipConfig = {
  route: "/scholarships/dev3pack-rust",
  adminRoute: "/admin/scholarships/dev3pack-rust",
  seats: 15,
  format: "Virtual",
  cost: "Free",
  bootcampDates: "2–27 November 2026",
  languages: "English",
  applicationClose: "2026-10-10 23:59:00+01",
  resultsAnnounce: "2026-10-16",
  contactEmail: "blockchainclubfutminna@gmail.com",
  hero: {
    headline: "Learn Rust. Build on Solana. Fully sponsored.",
    subheadline:
      "Blockchain Club FUTMinna has 15 scholarship seats in the Dev3pack Solana Rust Bootcamp. Apply Now",
  },
  whatYouGet: [
    "A sponsored seat in the Dev3pack Solana Rust Bootcamp",
    "Mentorship and support from Blockchain Club FUTMinna: study groups, code review, and a place to build alongside other scholars",
    "Your work becomes portfolio material for hackathons, grants, and internships",
  ],
};

/** When applications close, as a Date. */
export const scholarshipClosesAt = parseTimestamp(scholarshipConfig.applicationClose);

/** e.g. "10 October 2026 at 11:59 pm", in West Africa Time (the config's offset). */
export const scholarshipClosesLabel = scholarshipClosesAt.toLocaleString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Africa/Lagos",
});
