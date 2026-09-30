import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { scholarshipConfig } from "@/lib/config/scholarship";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TOTAL_STEPS = 5;

const initialForm = {
  level: "",
  gender: "",
  club_member: "",
  programming_experience: "",
  rust_experience: "",
  can_attend_full: "",
  weekly_hours: "",
  has_laptop: "",
  internet_quality: "",
  accuracy_confirmed: false,
  seat_forfeit_ack: false,
  data_consent: false,
  rust_reasoning: "",
};

type Rule = { key: string; message: string; test?: (v: any) => boolean };

const filled = (v: any) => (typeof v === "string" ? v.trim().length > 0 : !!v);

// Required fields per step. Anything not listed here is optional.
const STEP_RULES: Record<number, Rule[]> = {
  1: [
    {
      key: "full_name",
      message: "Enter your full name.",
      test: (v) => (v?.trim().length ?? 0) >= 2,
    },
    {
      key: "email",
      message: "Enter a valid email address.",
      test: (v) => /^\S+@\S+\.\S+$/.test(v?.trim() ?? ""),
    },
    {
      key: "phone_whatsapp",
      message: "Enter a valid phone number (7–20 characters).",
      test: (v) => {
        const n = v?.trim().length ?? 0;
        return n >= 7 && n <= 20;
      },
    },
    { key: "department", message: "Enter your department." },
    { key: "level", message: "Select your level." },
    { key: "gender", message: "Select your gender." },
  ],
  2: [
    { key: "club_member", message: "Tell us if you are a club member." },
    { key: "programming_experience", message: "Select your programming experience." },
    { key: "rust_experience", message: "Select your Rust experience." },
  ],
  3: [
    { key: "motivation", message: "Tell us why you want this scholarship." },
    { key: "hard_learning", message: "Tell us about something hard you learned." },
    { key: "goal_by_end_nov", message: "Tell us your goal for the end of November." },
  ],
  4: [
    { key: "can_attend_full", message: "Select whether you can attend." },
    { key: "weekly_hours", message: "Select your weekly hours." },
    { key: "has_laptop", message: "Select your laptop availability." },
    { key: "internet_quality", message: "Select your internet quality." },
  ],
  5: [
    { key: "giveback_plan", message: "Tell us how you will give back." },
    { key: "accuracy_confirmed", message: "Please tick this declaration." },
    { key: "seat_forfeit_ack", message: "Please tick this declaration." },
    { key: "data_consent", message: "Please tick this declaration." },
  ],
};

function validateStep(form: any, step: number) {
  const errors: Record<string, string> = {};
  for (const rule of STEP_RULES[step] ?? []) {
    const ok = rule.test ? rule.test(form[rule.key]) : filled(form[rule.key]);
    if (!ok) errors[rule.key] = rule.message;
  }
  return errors;
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  return (
    <p
      className={cn(
        "text-right text-xs",
        len >= max ? "text-red-500" : len >= max * 0.9 ? "text-amber-600" : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {len}/{max} characters
    </p>
  );
}

export function Dev3packScholarshipForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [applicationsOpen, setApplicationsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOpen = async () => {
      const { data, error } = await supabase.query("scholarship_settings", {
        select: "opens_at,closes_at",
        filters: { id: 1 },
        single: true,
      });
      if (!error && data) {
        const now = new Date();
        const open = new Date(data.opens_at) <= now && now <= new Date(data.closes_at);
        setApplicationsOpen(open);
      } else {
        // fallback to open if check fails
        setApplicationsOpen(true);
      }
    };
    checkOpen();
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      // anon has no SELECT policy on this table, so duplicates can't be checked up front;
      // the unique index on lower(email) rejects them and we translate the error here.
      const { error } = await supabase
        .from("rust_scholarship_applications")
        .insert(payload, { returning: "minimal" });
      if (error) {
        if (error.pgCode === "23505" || error.code === 409)
          throw new Error("An application with this email already exists.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Application submitted.");
      setSubmitted(true);
      setForm(initialForm);
      setStep(1);
      scrollToForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Submission failed");
    },
  });

  if (applicationsOpen === false) {
    return (
      <div className="rounded-lg border p-6 text-center">
        Applications for this scholarship have closed.
      </div>
    );
  }
  if (applicationsOpen === null) return <GlobalLoader inline />;

  const update = (k: string, v: any) => {
    setForm((f: any) => ({ ...f, [k]: v }));
    if (errors[k])
      setErrors((e) => {
        const next = { ...e };
        delete next[k];
        return next;
      });
  };

  if (submitted) {
    return (
      <div
        id="scholarship-form"
        className="rounded-xl border p-6 space-y-3 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-2xl font-semibold">Application received</h2>
        <p className="text-muted-foreground">
          Thanks for applying to the Dev3pack Rust Scholarship. Results will be announced on{" "}
          {scholarshipConfig.resultsAnnounce}.
        </p>
        <p className="text-sm text-muted-foreground">
          Questions? Email{" "}
          <a className="underline" href={`mailto:${scholarshipConfig.contactEmail}`}>
            {scholarshipConfig.contactEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  const showErrors = (stepErrors: Record<string, string>) => {
    setErrors(stepErrors);
    toast.error("Please fill in the required fields marked *");
  };

  const goNext = () => {
    const stepErrors = validateStep(form, step);
    if (Object.keys(stepErrors).length) return showErrors(stepErrors);
    setErrors({});
    setStep((s) => s + 1);
    scrollToForm();
  };

  const handleSubmit = () => {
    // Re-check every step; send the applicant back to the first one with a problem.
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const stepErrors = validateStep(form, s);
      if (Object.keys(stepErrors).length) {
        setStep(s);
        return showErrors(stepErrors);
      }
    }

    // normalize usernames to URLs
    const github = form.github_url?.startsWith("http")
      ? form.github_url
      : form.github_url
        ? `https://github.com/${form.github_url}`
        : null;
    const social = form.social_url?.startsWith("http")
      ? form.social_url
      : form.social_url
        ? `https://x.com/${form.social_url}`
        : null;
    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone_whatsapp: form.phone_whatsapp.trim(),
      github_url: github,
      social_url: social,
      club_member: form.club_member === "yes",
      languages_tools: form.languages_tools || [],
      built_description: "",
      rust_reasoning: form.rust_reasoning || "",
      club_activity: "",
      built_link: "",
      clashes: "",
      support_needed: "",
      how_heard: "",
    };

    mutation.mutate(payload);
  };

  const text = (key: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      value={form[key] || ""}
      onChange={(e) => update(key, e.target.value)}
      aria-invalid={!!errors[key]}
      className={cn(errors[key] && "border-red-500")}
      {...props}
    />
  );

  const longText = (key: string, max: number) => (
    <>
      <Textarea
        maxLength={max}
        value={form[key] || ""}
        onChange={(e) => update(key, e.target.value)}
        aria-invalid={!!errors[key]}
        className={cn(errors[key] && "border-red-500")}
      />
      <CharCount value={form[key] || ""} max={max} />
    </>
  );

  const choice = (
    key: string,
    options: { value: string; label: string }[],
    placeholder = "Select",
  ) => (
    <Select value={form[key]} onValueChange={(v) => update(key, v)}>
      <SelectTrigger aria-invalid={!!errors[key]} className={cn(errors[key] && "border-red-500")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const declaration = (key: string, label: string) => (
    <div>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={!!form[key]}
          onCheckedChange={(v) => update(key, !!v)}
          aria-invalid={!!errors[key]}
          className={cn("mt-0.5", errors[key] && "border-red-500")}
        />
        <span>
          {label}
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        </span>
      </label>
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  const yesNo = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  return (
    <div id="scholarship-form" className="rounded-xl border p-6 space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Apply for a seat</h2>
        <p className="text-sm text-muted-foreground">
          Applications close {scholarshipConfig.applicationClose}
        </p>
        <p className="text-xs text-muted-foreground">
          Step {step} of {TOTAL_STEPS} · Fields marked <span className="text-red-500">*</span> are
          required
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Full name" required hint="As on your student ID" error={errors.full_name}>
            {text("full_name")}
          </Field>
          <Field label="Email" required error={errors.email}>
            {text("email", { type: "email" })}
          </Field>
          <Field label="Phone Number (WhatsApp Preferred)" required error={errors.phone_whatsapp}>
            {text("phone_whatsapp", { type: "tel" })}
          </Field>
          <Field label="Telegram handle" hint="Username without @">
            {text("telegram_handle")}
          </Field>
          <Field label="Department" required error={errors.department}>
            {text("department")}
          </Field>
          <Field label="Level" required error={errors.level}>
            {choice(
              "level",
              ["100", "200", "300", "400", "500", "Postgraduate", "Graduate"].map((l) => ({
                value: l,
                label: l,
              })),
              "Select level",
            )}
          </Field>
          <Field label="Gender" required error={errors.gender}>
            {choice(
              "gender",
              [
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ],
              "Select gender",
            )}
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="GitHub username" hint="Your GitHub handle without @">
            {text("github_url", { placeholder: "username" })}
          </Field>
          <Field label="X / Twitter username" hint="Your X handle without @">
            {text("social_url", { placeholder: "username" })}
          </Field>
          <Field
            label="Club member?"
            required
            hint="Are you a member of Blockchain Club FUTMinna?"
            error={errors.club_member}
          >
            {choice("club_member", yesNo)}
          </Field>
          <Field
            label="Programming experience"
            required
            hint="Overall coding experience"
            error={errors.programming_experience}
          >
            {choice("programming_experience", [
              { value: "never", label: "Never" },
              { value: "beginner", label: "Beginner" },
              { value: "intermediate", label: "Intermediate" },
              { value: "advanced", label: "Advanced" },
            ])}
          </Field>
          <Field
            label="Rust experience"
            required
            hint="How familiar are you with Rust?"
            error={errors.rust_experience}
          >
            {choice("rust_experience", [
              { value: "none", label: "None" },
              { value: "a_little", label: "A little" },
              { value: "comfortable", label: "Comfortable" },
            ])}
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Field
            label="Motivation"
            required
            hint="Why do you want this scholarship and what will you do with it?"
            error={errors.motivation}
          >
            {longText("motivation", 800)}
          </Field>
          <Field
            label="Hard learning experience"
            required
            hint="Describe a time you learned something difficult independently."
            error={errors.hard_learning}
          >
            {longText("hard_learning", 600)}
          </Field>
          <Field
            label="Goal by end of November"
            required
            hint="What do you want to be able to build by 27 November 2026?"
            error={errors.goal_by_end_nov}
          >
            {longText("goal_by_end_nov", 500)}
          </Field>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Field
            label="Can attend full bootcamp?"
            required
            hint="Commitment from 2–27 November 2026"
            error={errors.can_attend_full}
          >
            {choice("can_attend_full", [
              { value: "yes", label: "Yes" },
              { value: "mostly", label: "Mostly" },
              { value: "no", label: "No" },
            ])}
          </Field>
          <Field
            label="Weekly hours"
            required
            hint="How many hours can you dedicate weekly?"
            error={errors.weekly_hours}
          >
            {choice("weekly_hours", [
              { value: "under_5", label: "Under 5 hrs" },
              { value: "5_10", label: "5–10 hrs" },
              { value: "10_15", label: "10–15 hrs" },
              { value: "15_plus", label: "15+ hrs" },
            ])}
          </Field>
          <Field
            label="Has laptop"
            required
            hint="Do you have a laptop for development?"
            error={errors.has_laptop}
          >
            {choice("has_laptop", [
              { value: "yes", label: "Yes" },
              { value: "shared", label: "Shared" },
              { value: "no", label: "No" },
            ])}
          </Field>
          <Field
            label="Internet quality"
            required
            hint="Typical internet reliability"
            error={errors.internet_quality}
          >
            {choice("internet_quality", [
              { value: "reliable", label: "Reliable" },
              { value: "sometimes", label: "Sometimes" },
              { value: "poor", label: "Poor" },
            ])}
          </Field>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Field
            label="Giveback plan"
            required
            hint="How will you give back to the community after the bootcamp?"
            error={errors.giveback_plan}
          >
            {longText("giveback_plan", 500)}
          </Field>
          <div className="space-y-3">
            <p className="text-sm font-medium">Declarations</p>
            {declaration("accuracy_confirmed", "I confirm info is accurate")}
            {declaration("seat_forfeit_ack", "I understand seat may be forfeited for inactivity")}
            {declaration("data_consent", "Consent to store/share with Dev3pack if selected")}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="secondary"
          disabled={step === 1}
          onClick={() => {
            setErrors({});
            setStep((s) => s - 1);
          }}
        >
          Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={goNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}

function scrollToForm() {
  document
    .getElementById("scholarship-form")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
