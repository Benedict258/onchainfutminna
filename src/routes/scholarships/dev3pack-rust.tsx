import { createFileRoute } from "@tanstack/react-router";
import { scholarshipConfig } from "@/lib/config/scholarship";
import { Dev3packScholarshipForm } from "@/components/scholarship/dev3pack-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scholarships/dev3pack-rust")({
  head: () => ({
    meta: [
      { title: "Dev3pack Rust Scholarship | BlockchainClub FUTMinna" },
      {
        name: "description",
        content: "Apply for 15 sponsored seats in Dev3pack Solana Rust Bootcamp.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const scrollToForm = () => {
    document
      .getElementById("scholarship-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
      <img
        src="/dev3pack.jpg"
        alt="Dev3pack Rust Scholarship"
        className="w-full max-w-2xl mx-auto rounded-xl mb-8 object-cover"
      />
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">{scholarshipConfig.hero.headline}</h1>
        <p className="text-lg text-muted-foreground">{scholarshipConfig.hero.subheadline}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm rounded-lg border p-4">
          <div>
            <span className="font-semibold">Seats</span>
            <br />
            {scholarshipConfig.seats}
          </div>
          <div>
            <span className="font-semibold">Format</span>
            <br />
            {scholarshipConfig.format}
          </div>
          <div>
            <span className="font-semibold">Bootcamp dates</span>
            <br />
            {scholarshipConfig.bootcampDates}
          </div>
          <div>
            <span className="font-semibold">Cost</span>
            <br />
            {scholarshipConfig.cost}
          </div>
          <div className="flex items-center justify-center">
            <Button onClick={scrollToForm} size="sm" className="font-semibold">
              APPLY NOW
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">What is this?</h2>
          <p>
            Dev3pack is a global community for people building in Web3 and AI. Their Solana Rust
            Bootcamp is a free online program that helps you ship on Solana even if you are new to
            Rust.
          </p>
          <p className="mt-2">
            <em>
              Blockchain Club FUTMinna has been given 15 scholarship seats for our community. This
              page is how you apply for one.
            </em>
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">What you will get</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>A sponsored seat</strong> in the Dev3pack Solana Rust Bootcamp
            </li>
            <li>
              <strong>Mentorship and support</strong> from Blockchain Club FUTMinna: study groups,
              code review, and a place to build alongside other scholars
            </li>
            <li>Your work becomes portfolio material for hackathons, grants, and internships</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Who should apply</h2>
          <p>
            You do not need to know Rust. You do need to be ready to work. We are looking for
            students or members of the FUTMinna community who have written some code before, can
            commit to the full bootcamp, and will share what they learn.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">What we expect from scholars</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Attend and complete the bootcamp.</li>
            <li>Share progress in the club's scholar group every week.</li>
            <li>Teach one short session or write one guide for the club after the bootcamp.</li>
            <li>
              If you cannot continue, tell us early so your seat can go to someone on the waitlist.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">How selection works</h2>
          <p>
            Applications close <strong>10 October 2026</strong>. Each application is scored by at
            least two reviewers on commitment, motivation, evidence of effort, community
            involvement, potential, and give-back plan. Top scorers may be invited to a short
            conversation. 15 scholars and a waitlist are announced on{" "}
            <strong>{scholarshipConfig.resultsAnnounce}</strong>.
          </p>
        </div>
      </section>

      <Dev3packScholarshipForm />
    </div>
  );
}
