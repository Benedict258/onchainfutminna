import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

interface LoginPromptProps {
  inline?: boolean;
}

export function LoginPrompt({ inline }: LoginPromptProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return null;

  return (
    <div className={inline ? "flex items-center justify-center px-4 py-8" : "flex items-center justify-center min-h-[70vh] px-6"}>
      <Card className="max-w-md w-full p-8 text-center border-border">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-headline-md">Sign in to access this content</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Join the BlockchainClub FUTMinna community to unlock learning tracks and opportunities.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild className="w-full font-semibold tracking-wide">
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="w-full font-semibold tracking-wide">
            <Link to="/join">Join the Club</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}


