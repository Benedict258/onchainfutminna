import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scholarshipClosesAt as closesAt, scholarshipConfig } from "@/lib/config/scholarship";

const closeLabel = closesAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

/** Featured card for the Dev3pack scholarship; renders nothing once applications close. */
export function ScholarshipHighlight() {
  if (Date.now() > closesAt.getTime()) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Link
          to="/scholarships/dev3pack-rust"
          className="group block bg-surface-low overflow-hidden"
          aria-label="Dev3pack Rust Scholarship details"
        >
          <img
            src="/dev3pack.jpg"
            alt="Dev3pack Solana Rust Bootcamp scholarship"
            className="w-full h-full object-cover aspect-[16/10] md:aspect-auto group-hover:scale-[1.02] transition-transform duration-300"
          />
        </Link>
        <div className="p-6 md:p-8 flex flex-col justify-center gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="text-xs">SCHOLARSHIP</Badge>
            <Badge variant="secondary" className="text-xs">
              {scholarshipConfig.seats} SEATS · {scholarshipConfig.cost.toUpperCase()}
            </Badge>
          </div>
          <div>
            <h3 className="text-headline-md">Dev3pack Solana Rust Bootcamp</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Learn Rust and build on Solana with a fully sponsored seat. {scholarshipConfig.seats}{" "}
              seats for FUTMinna students, beginners welcome.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Bootcamp</dt>
              <dd className="font-medium">{scholarshipConfig.bootcampDates}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Applications close</dt>
              <dd className="font-medium">{closeLabel}</dd>
            </div>
          </dl>
          <div>
            <Button asChild>
              <Link to="/scholarships/dev3pack-rust">
                Apply now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
