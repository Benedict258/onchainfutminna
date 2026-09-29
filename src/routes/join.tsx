import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { ChevronLeft, ChevronRight, Mail, RefreshCw } from 'lucide-react';

export const Route = createFileRoute('/join')({
  head: () => ({
    meta: [
      { title: 'Join the Club | BlockchainClub FUTMinna' },
      { name: 'description', content: 'Apply for membership to Blockchain Club FUTMinna.' },
    ],
  }),
  component: JoinPage,
});

const SKILLS = [
  'Solidity',
  'Move',
  'Rust',
  'JavaScript',
  'Python',
  'Frontend Dev',
  'UI/UX Design',
  'Content Writing',
  'Marketing',
  'Community Management',
  'Research',
  'Other',
] as const;

const LEVELS = ['100', '200', '300', '400', '500', '600'] as const;

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
] as const;

const STEPS = [
  { title: 'Account', fields: ['fullName', 'username', 'email', 'phone', 'password', 'confirmPassword'] as const },
  { title: 'Academic', fields: ['dateOfBirth', 'department', 'level', 'experienceLevel'] as const },
  { title: 'Skills & Social', fields: ['skills', 'funFact', 'xLink', 'githubLink', 'portfolioLink'] as const },
];

function JoinBranding() {
  return (
    <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
      <Link to="/" className="inline-flex items-center gap-2 mb-12">
        <img src="/lightlogo.png" alt="BCF" className="h-[100px] w-auto" />
      </Link>
      <h2 className="text-headline-lg text-foreground">Join the Club</h2>
      <p className="mt-3 text-muted-foreground">
        FUTMinna's premier Web3 community  learn, build, and connect.
      </p>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.title} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i <= step
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-high text-muted-foreground'
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-sm font-medium hidden sm:inline ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
            {s.title}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`hidden sm:block h-px w-8 ${i < step ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function JoinPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState('');
  const [isResending, setIsResending] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      department: '',
      level: undefined as any,
      skills: [],
      experienceLevel: undefined as any,
      funFact: '',
      xLink: '',
      githubLink: '',
      portfolioLink: '',
    },
  });

  async function handleNext() {
    const currentFields = [...STEPS[step].fields];
    const valid = await form.trigger(currentFields as any);
    if (valid) {
      setDirection('forward');
      setStep(step + 1);
    }
  }

  function handleBack() {
    setDirection('back');
    setStep(step - 1);
  }

  async function onSubmit(values: RegisterInput) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok) {
        const msg = result.error || 'Registration failed';
        if (msg.toLowerCase().includes('email')) {
          form.setError('email', { message: msg });
        } else if (msg.toLowerCase().includes('password')) {
          form.setError('confirmPassword', { message: msg });
        } else if (msg.toLowerCase().includes('phone')) {
          form.setError('phone', { message: msg });
        } else if (msg.toLowerCase().includes('name')) {
          form.setError('fullName', { message: msg });
        } else {
          form.setError('root', { message: msg });
        }
        throw new Error(msg);
      }
      setRegisteredEmail(values.email);
      setRegisteredUserId(result.userId || result.user?.id || '');
      setShowVerificationMessage(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function resendVerification() {
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to resend');
      toast.success('Verification email resent!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="grid lg:grid-cols-2 lg:min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:flex bg-surface-low border-r border-border">
          <JoinBranding />
        </div>
        <div className="flex items-start justify-center px-6 py-12 lg:py-16 lg:overflow-y-auto">
          <Card className="w-full max-w-xl border-border bg-card">
            <CardContent className="pt-8">
              {showVerificationMessage ? (
                <div className="text-center space-y-6 py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-headline-md">Verify Your Email</h2>
                    <p className="text-muted-foreground">
                      Enter the 6-digit code we sent to <span className="font-medium text-foreground">{registeredEmail}</span>.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <a href={`/auth/verify?userId=${registeredUserId}`}>Enter Verification Code</a>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={resendVerification} disabled={isResending}>
                      {isResending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>Resend Code</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
              <div className="mb-6 lg:hidden">
                <h1 className="text-headline-md">Join the Club</h1>
                <p className="text-sm text-muted-foreground mt-1">Create your member profile</p>
              </div>

              <StepIndicator step={step} />

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-300 ease-in-out"
                      style={{
                        transform: `translateX(-${step * 100}%)`,
                      }}
                    >
                      {/* Step 0: Account */}
                      <div className="w-full shrink-0 space-y-4 pr-1">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="yourusername" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="you@futminna.edu.ng" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+2348012345678" type="tel" {...field} />
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
                                <Input placeholder="Min. 8 characters" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input placeholder="Re-enter password" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Step 1: Academic */}
                      <div className="w-full shrink-0 space-y-4 pr-1">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input placeholder="DD-MM" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Computer Science" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Level</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LEVELS.map((level) => (
                                    <SelectItem key={level} value={level}>
                                      Level {level}
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
                          name="experienceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experience Level</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select experience" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {EXPERIENCE_LEVELS.map((exp) => (
                                    <SelectItem key={exp.value} value={exp.value}>
                                      {exp.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Step 2: Skills & Social */}
                      <div className="w-full shrink-0 space-y-4 pr-1">
                        <FormField
                          control={form.control}
                          name="skills"
                          render={() => (
                            <FormItem>
                              <FormLabel>Skills</FormLabel>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {SKILLS.map((skill) => (
                                  <FormField
                                    key={skill}
                                    control={form.control}
                                    name="skills"
                                    render={({ field }) => {
                                      const checked = field.value?.includes(skill as never);
                                      return (
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={(isChecked) => {
                                              const current = field.value || [];
                                              if (isChecked) {
                                                field.onChange([...current, skill]);
                                              } else {
                                                field.onChange(current.filter((s) => s !== skill));
                                              }
                                            }}
                                          />
                                          {skill}
                                        </label>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="funFact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fun Fact (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Tell us something fun about yourself" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid gap-4 sm:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="xLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>X / Twitter</FormLabel>
                                <FormControl>
                                  <Input placeholder="username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="githubLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GitHub</FormLabel>
                                <FormControl>
                                  <Input placeholder="username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="portfolioLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Portfolio</FormLabel>
                                <FormControl>
                                  <Input placeholder="yoursite.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    )}
                  </div>
                  {form.formState.errors.root && (
                    <p className="mt-4 text-sm text-destructive text-center">{form.formState.errors.root.message}</p>
                  )}
                </form>
              </Form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Sign In
                </Link>
              </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


