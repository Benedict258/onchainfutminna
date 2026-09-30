import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, MailX, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    userId: (search.userId as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Verify Email | BlockchainClub FUTMinna" },
      { name: "description", content: "Verify your email address." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyBranding({ status }: { status: "idle" | "loading" | "success" | "error" }) {
  return (
    <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
      <Link to="/" className="inline-flex items-center gap-2 mb-12">
        <img src="/lightlogo.png" alt="BCF" className="h-[100px] w-auto" />
      </Link>
      <h2 className="text-headline-lg text-foreground">
        {status === "idle" && "Verify Your Email"}
        {status === "loading" && "Verifying Code"}
        {status === "success" && "Email Verified!"}
        {status === "error" && "Verification Failed"}
      </h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        {status === "idle" && "Enter the 6-digit code we sent to your email."}
        {status === "loading" && "Checking your verification code..."}
        {status === "success" &&
          "Your email has been confirmed. Welcome to BlockchainClub FUTMinna."}
        {status === "error" &&
          "Something went wrong. The code may have expired or already been used."}
      </p>
    </div>
  );
}

function OTPInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);

  const digits = value.split("").concat(Array(6 - value.length).fill(""));

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.slice(0, 6).join("");
    onChange(newValue);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={() => setFocused(i)}
          onBlur={() => setFocused(null)}
          disabled={disabled}
          className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 bg-surface-low text-foreground outline-none transition-colors ${
            focused === i
              ? "border-primary ring-2 ring-primary/20"
              : "border-border hover:border-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function VerifyEmailPage() {
  const { userId } = Route.useSearch();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!userId) {
      setStatus("error");
      setMessage("No user ID provided. Return to registration and try again.");
      return;
    }
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setStatus("success");
      setMessage(data.message || "Email verified successfully!");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Verification failed");
    }
  }, [userId, code]);

  const handleResend = async () => {
    if (!userId) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      toast.success("New code sent!");
      setCode("");
      setStatus("idle");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="grid lg:grid-cols-2 lg:min-h-[calc(100vh-4rem)]">
          <div className="hidden lg:flex bg-surface-low border-r border-border">
            <VerifyBranding status="error" />
          </div>
          <div className="flex items-center justify-center px-6 py-12 lg:py-16">
            <Card className="w-full max-w-md border-border bg-card">
              <CardContent className="pt-8">
                <div className="text-center space-y-6 py-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <MailX className="h-8 w-8 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-headline-sm text-foreground">Missing User ID</h2>
                    <p className="text-muted-foreground">
                      No user ID was provided. Please return to registration.
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/join">Return to Sign Up</Link>
                  </Button>
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
          <VerifyBranding status={status} />
        </div>
        <div className="flex items-center justify-center px-6 py-12 lg:py-16">
          <Card className="w-full max-w-md border-border bg-card">
            <CardContent className="pt-8">
              <div className="mb-6 lg:hidden">
                <h1 className="text-headline-md">
                  {status === "idle" && "Verify Your Email"}
                  {status === "loading" && "Verifying Code"}
                  {status === "success" && "Email Verified!"}
                  {status === "error" && "Verification Failed"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {status === "idle" && "Enter the code from your email"}
                  {status === "loading" && "Checking code"}
                  {status === "success" && "Your account is now active"}
                  {status === "error" && "We couldn't verify your code"}
                </p>
              </div>

              <div className="text-center space-y-6 py-4">
                {(status === "idle" || status === "error") && (
                  <>
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        Enter the 6-digit code we sent to your email
                      </p>
                    </div>
                    <OTPInput value={code} onChange={setCode} disabled={false} />
                    {status === "error" && <p className="text-sm text-destructive">{message}</p>}
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        onClick={handleVerify}
                        disabled={code.length !== 6}
                      >
                        Verify Email
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleResend}
                        disabled={isResending}
                      >
                        {isResending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>Resend Code</>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {status === "loading" && (
                  <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <p className="text-muted-foreground">{message || "Verifying your code..."}</p>
                  </>
                )}

                {status === "success" && (
                  <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                      <MailCheck className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-headline-sm text-foreground">All Set!</h2>
                      <p className="text-muted-foreground">{message}</p>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/auth">Go to Login</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
