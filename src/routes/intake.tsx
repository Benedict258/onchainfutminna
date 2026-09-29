import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuthStore } from "@/stores/auth-store";
import { LoginPrompt } from "@/components/login-prompt";
import { ChevronLeft, ChevronRight, CheckCircle2, Trophy } from "lucide-react";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Intake Assessment | BlockchainClub FUTMinna" },
      { name: "description", content: "Complete the intake assessment for lane placement in BlockchainClub FUTMinna." },
    ],
  }),
  component: IntakePage,
});

const SWE_QUESTIONS = [
  {
    question: "What does git rebase do differently from git merge?",
    options: [
      { value: "A", label: "Rebases create a linear history by replaying commits" },
      { value: "B", label: "Rebases delete all previous commits" },
      { value: "C", label: "Rebases create a merge commit like git merge" },
      { value: "D", label: "Rebases only work on the main branch" },
    ],
    correct: "A",
  },
  {
    question: "What is an environment variable and why store secrets in .env?",
    options: [
      { value: "A", label: "A variable that changes the desktop environment" },
      { value: "B", label: "An OS-level key-value pair, .env keeps secrets out of source code" },
      { value: "C", label: "A variable only used in production servers" },
      { value: "D", label: "A file that contains compiled code" },
    ],
    correct: "B",
  },
  {
    question: "What happens when you run npm install in a project folder?",
    options: [
      { value: "A", label: "It uploads your code to npm's registry" },
      { value: "B", label: "It reads package.json and downloads all listed dependencies" },
      { value: "C", label: "It creates a new Node.js project from scratch" },
      { value: "D", label: "It compiles all TypeScript files" },
    ],
    correct: "B",
  },
  {
    question: "You see a 404 error in your terminal. What does that typically mean?",
    options: [
      { value: "A", label: "Your code has a syntax error on line 404" },
      { value: "B", label: "The server cannot find the requested resource" },
      { value: "C", label: "Your internet connection is down" },
      { value: "D", label: "You need to restart your computer" },
    ],
    correct: "B",
  },
  {
    question: "Name one difference between a branch and a fork in GitHub:",
    options: [
      { value: "A", label: "Branches are private, forks are public" },
      { value: "B", label: "A branch exists within the same repo; a fork is a separate copy of the repo" },
      { value: "C", label: "Branches cannot be merged, forks can" },
      { value: "D", label: "Forks are only used in open source" },
    ],
    correct: "B",
  },
];

const BLOCKCHAIN_QUESTIONS = [
  {
    question: "What is a private key in one sentence?",
    options: [
      { value: "A", label: "A public address that anyone can send funds to" },
      { value: "B", label: "A secret number that proves ownership and signs transactions" },
      { value: "C", label: "A password used to log into a wallet app" },
      { value: "D", label: "A backup code for recovering email accounts" },
    ],
    correct: "B",
  },
  {
    question: "What is the difference between a transaction and a block?",
    options: [
      { value: "A", label: "They are the same thing" },
      { value: "B", label: "A transaction is a single action; a block is a batch of verified transactions" },
      { value: "C", label: "Transactions are public, blocks are private" },
      { value: "D", label: "Blocks are only used in Bitcoin" },
    ],
    correct: "B",
  },
  {
    question: "Name one difference between Proof of Work and Proof of Stake:",
    options: [
      { value: "A", label: "PoW uses miners solving puzzles; PoS uses validators staking tokens" },
      { value: "B", label: "PoW is faster than PoS" },
      { value: "C", label: "PoS requires more electricity than PoW" },
      { value: "D", label: "PoW is only used by Solana" },
    ],
    correct: "A",
  },
  {
    question: "What does 'gas' mean in the context of Ethereum?",
    options: [
      { value: "A", label: "A type of cryptocurrency" },
      { value: "B", label: "A unit measuring computational effort required for transactions" },
      { value: "C", label: "The fuel used by mining hardware" },
      { value: "D", label: "A nickname for Ether (ETH)" },
    ],
    correct: "B",
  },
  {
    question: "Name one blockchain that uses the Move programming language:",
    options: [
      { value: "A", label: "Ethereum" },
      { value: "B", label: "Solana" },
      { value: "C", label: "Sui" },
      { value: "D", label: "Bitcoin" },
    ],
    correct: "C",
  },
];

const STEPS = [
  { title: "SWE Basics" },
  { title: "Blockchain" },
  { title: "Practical" },
];

const STARTER_REPO_URL = "https://github.com/BlockchainClub-FUTMINNA/intake-starter";

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.title} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i <= step
                ? "bg-primary text-primary-foreground"
                : "bg-surface-high text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-sm font-medium hidden sm:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
            {s.title}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`hidden sm:block h-px w-8 ${i < step ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function IntakeBranding() {
  return (
    <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
      <a href="/" className="inline-flex items-center gap-2 mb-12">
        <img src="/lightlogo.png" alt="BCF" className="h-[100px] w-auto" />
      </a>
      <h2 className="text-headline-lg text-foreground">Intake Assessment</h2>
      <p className="mt-3 text-muted-foreground">
        Complete this assessment to help us place you in the right learning lane.
      </p>
    </div>
  );
}

type LaneResult = "Fast Lane" | "Foundation Lane";

function IntakePage() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [sweAnswers, setSweAnswers] = useState<Record<string, string>>({});
  const [blockchainAnswers, setBlockchainAnswers] = useState<Record<string, string>>({});
  const [forkUrl, setForkUrl] = useState("");
  const [practicalDone, setPracticalDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingResult, setExistingResult] = useState<{
    lane: string;
    total_score: number;
  } | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [result, setResult] = useState<{
    sweScore: number;
    blockchainScore: number;
    totalScore: number;
    practicalCompleted: boolean;
    lane: LaneResult;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setCheckingExisting(false);
      return;
    }
    const checkExisting = async () => {
      try {
        const res = await fetch("/api/supabase/query/intake_assessments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ single: true }),
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setExistingResult(json.data);
        }
      } catch {}
      setCheckingExisting(false);
    };
    checkExisting();
  }, [isAuthenticated, accessToken]);

  if (!isHydrated) return null;
  if (!isAuthenticated) return <LoginPrompt />;

  if (checkingExisting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (existingResult) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="grid lg:grid-cols-2 lg:min-h-[calc(100vh-4rem)]">
          <div className="hidden lg:flex bg-surface-low border-r border-border">
            <IntakeBranding />
          </div>
          <div className="flex items-start justify-center px-6 py-12 lg:py-16 lg:overflow-y-auto">
            <Card className="w-full max-w-xl border-border bg-card">
              <CardContent className="pt-8">
                <div className="text-center space-y-6 py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-headline-md">Assessment Already Completed</h2>
                    <p className="text-muted-foreground">
                      You have been placed in the{" "}
                      <span className="font-bold text-foreground">{existingResult.lane}</span>
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-left">
                    <p className="text-sm font-medium mb-1">Your Score: {existingResult.total_score} / 10</p>
                    <p className="text-xs text-muted-foreground">
                      {existingResult.lane === "Fast Lane"
                        ? "You meet the requirements for advanced tracks."
                        : "Start with the basics to build a strong foundation."}
                    </p>
                  </div>
                  <Button asChild variant="outline" className="mt-4">
                    <a href="/learn">Browse Learning Tracks</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function handleAnswerChange(questionIndex: number, value: string, category: "swe" | "blockchain") {
    if (category === "swe") {
      setSweAnswers((prev) => ({ ...prev, [questionIndex]: value }));
    } else {
      setBlockchainAnswers((prev) => ({ ...prev, [questionIndex]: value }));
    }
  }

  function handleNext() {
    setDirection("forward");
    setStep(step + 1);
  }

  function handleBack() {
    setDirection("back");
    setStep(step - 1);
  }

  function calculateScore(answers: Record<string, string>, questions: typeof SWE_QUESTIONS) {
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) score++;
    });
    return score;
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const sweScore = calculateScore(sweAnswers, SWE_QUESTIONS);
      const blockchainScore = calculateScore(blockchainAnswers, BLOCKCHAIN_QUESTIONS);
      const totalScore = sweScore + blockchainScore;
      const practicalCompleted = practicalDone && forkUrl.trim().length > 0;
      const lane: LaneResult = totalScore >= 6 && practicalCompleted ? "Fast Lane" : "Foundation Lane";

      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          swe_score: sweScore,
          blockchain_score: blockchainScore,
          total_score: totalScore,
          practical_completed: practicalCompleted,
          fork_url: forkUrl.trim() || null,
          lane,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.result) {
          setExistingResult(data.result);
          return;
        }
        throw new Error(data.error || "Failed to submit assessment");
      }

      setResult({ sweScore, blockchainScore, totalScore, practicalCompleted, lane });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit assessment");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="grid lg:grid-cols-2 lg:min-h-[calc(100vh-4rem)]">
          <div className="hidden lg:flex bg-surface-low border-r border-border">
            <IntakeBranding />
          </div>
          <div className="flex items-start justify-center px-6 py-12 lg:py-16 lg:overflow-y-auto">
            <Card className="w-full max-w-xl border-border bg-card">
              <CardContent className="pt-8">
                <div className="text-center space-y-6 py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-headline-md">Assessment Complete</h2>
                    <p className="text-muted-foreground">
                      You have been placed in the{" "}
                      <span className="font-bold text-foreground">{result.lane}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">SWE Score</p>
                      <p className="text-headline-sm font-bold">{result.sweScore} / 5</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Blockchain Score</p>
                      <p className="text-headline-sm font-bold">{result.blockchainScore} / 5</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-headline-sm font-bold">{result.totalScore} / 10</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Practical</p>
                      <p className="text-headline-sm font-bold">
                        {result.practicalCompleted ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-5 w-5" /> Done
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not completed</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4 text-left">
                    <p className="text-sm font-medium mb-1">
                      {result.lane === "Fast Lane"
                        ? "Fast Lane — You meet the requirements for advanced tracks."
                        : "Foundation Lane — Start with the basics to build a strong foundation."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.lane === "Fast Lane"
                        ? "You scored 6+ and completed the practical task. You are ready for accelerated learning."
                        : result.totalScore < 6 && !result.practicalCompleted
                          ? "Work on the fundamentals and complete the practical task to qualify for Fast Lane."
                          : result.totalScore < 6
                            ? "Score at least 6/10 to qualify for Fast Lane."
                            : "Complete the practical task to qualify for Fast Lane."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="grid lg:grid-cols-2 lg:min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:flex bg-surface-low border-r border-border">
          <IntakeBranding />
        </div>
        <div className="flex items-start justify-center px-6 py-12 lg:py-16 lg:overflow-y-auto">
          <Card className="w-full max-w-xl border-border bg-card">
            <CardContent className="pt-8">
              <StepIndicator step={step} />
              <Progress value={((step + 1) / STEPS.length) * 100} className="mb-8" />

              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${step * 100}%)` }}
                >
                  {/* Step 0: SWE Basics */}
                  <div className="w-full shrink-0 space-y-6 pr-1">
                    {SWE_QUESTIONS.map((q, qi) => (
                      <div key={qi} className="space-y-3">
                        <p className="text-sm font-medium">
                          {qi + 1}. {q.question}
                        </p>
                        <RadioGroup
                          value={sweAnswers[qi] || ""}
                          onValueChange={(v) => handleAnswerChange(qi, v, "swe")}
                        >
                          {q.options.map((opt) => (
                            <div key={opt.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt.value} id={`swe-${qi}-${opt.value}`} />
                              <Label htmlFor={`swe-${qi}-${opt.value}`} className="text-sm cursor-pointer">
                                {opt.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Blockchain Concepts */}
                  <div className="w-full shrink-0 space-y-6 pr-1">
                    {BLOCKCHAIN_QUESTIONS.map((q, qi) => (
                      <div key={qi} className="space-y-3">
                        <p className="text-sm font-medium">
                          {qi + 1}. {q.question}
                        </p>
                        <RadioGroup
                          value={blockchainAnswers[qi] || ""}
                          onValueChange={(v) => handleAnswerChange(qi, v, "blockchain")}
                        >
                          {q.options.map((opt) => (
                            <div key={opt.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt.value} id={`bc-${qi}-${opt.value}`} />
                              <Label htmlFor={`bc-${qi}-${opt.value}`} className="text-sm cursor-pointer">
                                {opt.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </div>

                  {/* Step 2: Practical Task */}
                  <div className="w-full shrink-0 space-y-6 pr-1">
                    <div className="space-y-2">
                      <h3 className="text-headline-sm font-bold">Practical Task</h3>
                      <p className="text-sm text-muted-foreground">
                        Fork and fix a deliberately buggy contract to demonstrate your hands-on skills.
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium">Starter Repository</p>
                      <a
                        href={STARTER_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {STARTER_REPO_URL}
                      </a>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fork-url">Your Fork URL</Label>
                      <Input
                        id="fork-url"
                        placeholder="https://github.com/your-username/intake-starter"
                        value={forkUrl}
                        onChange={(e) => setForkUrl(e.target.value)}
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="practical-done"
                        checked={practicalDone}
                        onCheckedChange={(checked) => setPracticalDone(checked === true)}
                      />
                      <Label htmlFor="practical-done" className="text-sm cursor-pointer">
                        I have forked the repository and fixed the bug
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                {step > 0 ? (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Assessment"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
