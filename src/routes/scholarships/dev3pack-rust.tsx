import { createFileRoute } from "@tanstack/react-router";
import { scholarshipConfig } from "@/lib/config/scholarship";
import { Dev3packScholarshipForm } from "@/components/scholarship/dev3pack-form";

export const Route = createFileRoute("/scholarships/dev3pack-rust")({
  head: () => ({
    meta: [
      { title: "Dev3pack Rust Scholarship | BlockchainClub FUTMinna" },
      { name: "description", content: "Apply for 15 sponsored seats in Dev3pack Solana Rust Bootcamp." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <section className="space-y-4 mb-10">
        <h1 className="text-4xl font-bold">{scholarshipConfig.hero.headline}</h1>
        <p className="text-lg text-muted-foreground">{scholarshipConfig.hero.subheadline}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><strong>Seats</strong><br/>{scholarshipConfig.seats}</div>
          <div><strong>Format</strong><br/>{scholarshipConfig.format}</div>
          <div><strong>Bootcamp dates</strong><br/>{scholarshipConfig.bootcampDates}</div>
          <div><strong>Cost</strong><br/>{scholarshipConfig.cost}</div>
        </div>
      </section>

      <section className="prose prose-invert max-w-none mb-10">
        <h2>What is this?</h2>
        <p>Dev3pack is a global community for people building in Web3 and AI. Their Solana Rust Bootcamp is a free online program that helps you ship on Solana even if you are new to Rust.</p>
        <p>Blockchain Club FUTMinna has been given 15 scholarship seats for our community. This page is how you apply for one.</p>

        <h2>What you will get</h2>
        <ul>
          {scholarshipConfig.whatYouGet.map((item,i)=> <li key={i}>{item}</li>)}
        </ul>

        <h2>Who should apply</h2>
        <p>You do not need to know Rust. You do need to be ready to work. We are looking for students or members of the FUTMinna community who have written some code before, can commit to the full bootcamp, and will share what they learn.</p>

        <h2>What we expect from scholars</h2>
        <ol>
          <li>Attend and complete the bootcamp.</li>
          <li>Share progress in the club's scholar group every week.</li>
          <li>Teach one short session or write one guide for the club after the bootcamp.</li>
          <li>If you cannot continue, tell us early so your seat can go to someone on the waitlist.</li>
        </ol>

        <h2>How selection works</h2>
        <p>Applications close 10 October 2026. Each application is scored by at least two reviewers on commitment, motivation, evidence of effort, community involvement, potential, and give-back plan. Top scorers may be invited to a short conversation. 15 scholars and a waitlist are announced on {scholarshipConfig.resultsAnnounce}.</p>
      </section>

      <Dev3packScholarshipForm />
    </div>
  );
}
