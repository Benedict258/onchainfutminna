import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In | BlockchainClub FUTMinna" },
      { name: "description", content: "Sign in to your Blockchain Club FUTMinna account." },
    ],
  }),
  component: SignInPage,
});

function AuthBranding() {
  return (
    <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
      <Link to="/" className="inline-flex items-center gap-2 mb-12">
        <img src="/lightlogo.png" alt="BCF" className="h-[100px] w-auto" />
      </Link>
      <h2 className="text-headline-lg text-foreground">Welcome Back</h2>
      <p className="mt-3 text-muted-foreground">
        Sign in to your dashboard, track progress, and connect with builders.
      </p>
    </div>
  );
}

function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const authLogin = useAuthStore((s) => s.login);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok) {
        const msg = result.error || "Login failed";
        if (msg.toLowerCase().includes("password")) {
          form.setError("password", { message: msg });
        } else if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("username")) {
          form.setError("identifier", { message: msg });
        } else {
          form.setError("root", { message: msg });
        }
        throw new Error(msg);
      }
      authLogin(result.user, result.accessToken);
      toast.success("Welcome back!");
      setTimeout(() => {
        router.navigate({ to: "/" });
      }, 300);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="grid lg:grid-cols-2 lg:min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:flex bg-surface-low border-r border-border">
          <AuthBranding />
        </div>
        <div className="flex items-center justify-center px-6 py-12 lg:py-16">
          <Card className="w-full max-w-md border-border bg-card">
            <CardContent className="pt-8">
              <div className="mb-6 lg:hidden">
                <h1 className="text-headline-md">Welcome Back</h1>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
              </div>
              <Form {...form}>
                <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@futminna.edu.ng or yourusername"
                            type="text"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-end">
                    <Link
                      to="/auth/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  {form.formState.errors.root && (
                    <p className="text-sm text-destructive text-center">
                      {form.formState.errors.root.message}
                    </p>
                  )}
                </form>
              </Form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link to="/join" className="font-medium text-primary hover:underline">
                  Join the Club
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
