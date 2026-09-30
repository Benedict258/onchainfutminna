import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { apiInsert } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Lightbulb } from "lucide-react";

const EVENT_TYPES = ["WORKSHOP", "HACKATHON", "TALK", "BOOTCAMP", "SOCIAL", "OTHER"] as const;

const eventRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(EVENT_TYPES),
  proposedDate: z.string().optional(),
  requesterName: z.string().optional(),
});

type EventRequestInput = z.infer<typeof eventRequestSchema>;

export const Route = createFileRoute("/events/request")({
  head: () => ({
    meta: [
      { title: "Submit Event Request | BlockchainClub FUTMinna" },
      {
        name: "description",
        content: "Submit an event idea to Blockchain Club FUTMinna for admin review.",
      },
    ],
  }),
  component: EventRequestPage,
});

function EventRequestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const form = useForm<EventRequestInput>({
    resolver: zodResolver(eventRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "OTHER",
      proposedDate: "",
      requesterName: user?.profile?.fullName || "",
    },
  });

  async function onSubmit(values: EventRequestInput) {
    if (!accessToken) {
      toast.error("Please sign in to submit an event request");
      return;
    }

    setIsLoading(true);
    try {
      await apiInsert("events", {
        title: values.title,
        description: values.description,
        type: values.type,
        status: "REQUESTED",
        proposed_date: values.proposedDate || null,
        requester_name: values.requesterName || null,
      });

      setSubmitted(true);
      toast.success("Event request submitted for review!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit event request");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">Please sign in to submit an event request.</p>
            <Button asChild className="w-full">
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="p-6 text-center space-y-4">
            <Lightbulb className="mx-auto h-10 w-10 text-primary" />
            <h2 className="text-headline-sm">Event Request Submitted!</h2>
            <p className="text-muted-foreground">
              Your event idea has been submitted for review. An admin will review it shortly.
            </p>
            <Button asChild className="w-full">
              <Link to="/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Submit Event Request</CardTitle>
          <CardDescription>
            Propose a workshop, talk, or hackathon for the BlockchainClub FUTMinna community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="ghost" className="mb-4 -ml-2">
            <Link to="/events">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
            </Link>
          </Button>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Intro to Solidity Workshop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your event idea. What will it cover? Who is it for?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proposedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requesterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Event Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
