import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { scholarshipConfig } from "@/lib/config/scholarship";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const initialForm = {
  level: '',
  gender: '',
  club_member: '',
  programming_experience: '',
  rust_experience: '',
  can_attend_full: '',
  weekly_hours: '',
  has_laptop: '',
  internet_quality: '',
  accuracy_confirmed: false,
  seat_forfeit_ack: false,
  data_consent: false,
  rust_reasoning: '',
};

export function Dev3packScholarshipForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [applicationsOpen, setApplicationsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOpen = async () => {
      const { data, error } = await supabase.query('scholarship_settings', {
        select: 'opens_at,closes_at',
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
    mutationFn: async (payload:any) => {
      // anon has no SELECT policy on this table, so duplicates can't be checked up front;
      // the unique index on lower(email) rejects them and we translate the error here.
      const { error } = await supabase.from('rust_scholarship_applications').insert(payload, { returning: 'minimal' });
      if (error) {
        if (error.pgCode === '23505' || error.code === 409) throw new Error("An application with this email already exists.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Application submitted.");
      setSubmitted(true);
      setForm(initialForm);
      setStep(1);
      document.getElementById('scholarship-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    onError: (err:any) => {
      toast.error(err.message || "Submission failed");
    }
  });

  if (applicationsOpen === false) {
    return <div className="rounded-lg border p-6 text-center">Applications for this scholarship have closed.</div>;
  }
  if (applicationsOpen === null) return <GlobalLoader inline />;

  const update = (k:string,v:any)=> setForm((f:any)=>({...f,[k]:v}));

  if (submitted) {
    return (
      <div id="scholarship-form" className="rounded-xl border p-6 space-y-3 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-semibold">Application received</h2>
        <p className="text-muted-foreground">
          Thanks for applying to the Dev3pack Rust Scholarship. Results will be announced on {scholarshipConfig.resultsAnnounce}.
        </p>
        <p className="text-sm text-muted-foreground">
          Questions? Email <a className="underline" href={`mailto:${scholarshipConfig.contactEmail}`}>{scholarshipConfig.contactEmail}</a>.
        </p>
      </div>
    );
  }

const handleSubmit = () => {
    // client‑side validation
    if ((form.full_name?.trim().length ?? 0) < 2) { toast.error("Full name is required."); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email?.trim() ?? '')) { toast.error("Enter a valid email."); return; }
    const phoneLen = form.phone_whatsapp?.trim().length ?? 0;
    if (phoneLen < 7 || phoneLen > 20) { toast.error("Enter a valid phone number."); return; }
    if (!form.department?.trim()) { toast.error("Department is required."); return; }
    if (!form.level) { toast.error("Select your level."); return; }
    if (!form.gender) { toast.error("Select gender."); return; }
    if (!form.club_member) { toast.error("Indicate club membership."); return; }
    if (!form.programming_experience) { toast.error("Select programming experience."); return; }
    if (!form.rust_experience) { toast.error("Select Rust experience."); return; }
    if (!form.motivation?.trim()) { toast.error("Motivation is required."); return; }
    if (!form.hard_learning?.trim()) { toast.error("Hard learning experience is required."); return; }
    if (!form.goal_by_end_nov?.trim()) { toast.error("Goal by end of November is required."); return; }
    if (!form.can_attend_full) { toast.error("Select attendance option."); return; }
    if (!form.weekly_hours) { toast.error("Select weekly hours."); return; }
    if (!form.has_laptop) { toast.error("Select laptop availability."); return; }
    if (!form.internet_quality) { toast.error("Select internet quality."); return; }
    if (!form.giveback_plan?.trim()) { toast.error("Giveback plan is required."); return; }
    if (!form.accuracy_confirmed || !form.seat_forfeit_ack || !form.data_consent) {
      toast.error("Please confirm all declarations."); return;
    }

    // normalize usernames to URLs
    const github = form.github_url?.startsWith('http') ? form.github_url : form.github_url ? `https://github.com/${form.github_url}` : null;
    const social = form.social_url?.startsWith('http') ? form.social_url : form.social_url ? `https://x.com/${form.social_url}` : null;
    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone_whatsapp: form.phone_whatsapp.trim(),
      github_url: github,
      social_url: social,
      club_member: form.club_member === 'yes',
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

  return (
    <div id="scholarship-form" className="rounded-xl border p-6 space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold">Apply for a seat</h2>
      <p className="text-sm text-muted-foreground">Applications close {scholarshipConfig.applicationClose}</p>

      {step===1 && (
        <div className="space-y-4">
          <label>Full name</label>
          <p className="text-xs text-muted-foreground mb-1">As on your student ID</p>
          <Input value={form.full_name||''} onChange={e=>update('full_name',e.target.value)} />
          <label>Email</label>
          <Input type="email" value={form.email||''} onChange={e=>update('email',e.target.value)} />
<label>Phone Number (WhatsApp Preferred)</label>
          <Input value={form.phone_whatsapp||''} onChange={e=>update('phone_whatsapp',e.target.value)} />
          <label>Telegram handle</label>
          <p className="text-xs text-muted-foreground mb-1">Username without @</p>
          <Input value={form.telegram_handle||''} onChange={e=>update('telegram_handle',e.target.value)} />
          <label>Department</label>
          <Input value={form.department||''} onChange={e=>update('department',e.target.value)} />
          <label>Level</label>
          <Select value={form.level} onValueChange={v=>update('level',v)}>
            <SelectTrigger><SelectValue placeholder="Select level"/></SelectTrigger>
            <SelectContent>
              {['100','200','300','400','500','Postgraduate','Graduate'].map(l=> <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Gender</label>
          <Select value={form.gender} onValueChange={v=>update('gender',v)}>
            <SelectTrigger><SelectValue placeholder="Select gender"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {step===2 && (
        <div className="space-y-4">
          <label>GitHub username</label>
          <p className="text-xs text-muted-foreground mb-1">Your GitHub handle without @</p>
          <Input placeholder="username" value={form.github_url||''} onChange={e=>update('github_url',e.target.value)} />
          <label>X / Twitter username</label>
          <p className="text-xs text-muted-foreground mb-1">Your X handle without @</p>
          <Input placeholder="username" value={form.social_url||''} onChange={e=>update('social_url',e.target.value)} />
          <label>Club member?</label>
          <p className="text-xs text-muted-foreground mb-1">Are you a member of Blockchain Club FUTMinna?</p>
          <Select value={form.club_member} onValueChange={v=>update('club_member',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          <label>Programming experience</label>
          <p className="text-xs text-muted-foreground mb-1">Overall coding experience</p>
<Select value={form.programming_experience} onValueChange={v=>update('programming_experience',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {[
                {value:'never', label:'Never'},
                {value:'beginner', label:'Beginner'},
                {value:'intermediate', label:'Intermediate'},
                {value:'advanced', label:'Advanced'},
              ].map(o=> <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Rust experience</label>
          <p className="text-xs text-muted-foreground mb-1">How familiar are you with Rust?</p>
<Select value={form.rust_experience} onValueChange={v=>update('rust_experience',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {[
                {value:'none', label:'None'},
                {value:'a_little', label:'A little'},
                {value:'comfortable', label:'Comfortable'},
              ].map(o=> <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {step===3 && (
        <div className="space-y-4">
          <label>Motivation <span className="text-xs text-muted-foreground">max 800</span></label>
          <p className="text-xs text-muted-foreground mb-1">Why do you want this scholarship and what will you do with it?</p>
          <Textarea maxLength={800} value={form.motivation||''} onChange={e=>update('motivation',e.target.value)} />
          <label>Hard learning experience <span className="text-xs">max 600</span></label>
          <p className="text-xs text-muted-foreground mb-1">Describe a time you learned something difficult independently.</p>
          <Textarea maxLength={600} value={form.hard_learning||''} onChange={e=>update('hard_learning',e.target.value)} />
          <label>Goal by end Nov <span className="text-xs">max 500</span></label>
          <p className="text-xs text-muted-foreground mb-1">What do you want to be able to build by 27 November 2026?</p>
          <Textarea maxLength={500} value={form.goal_by_end_nov||''} onChange={e=>update('goal_by_end_nov',e.target.value)} />
        </div>
      )}

      {step===4 && (
        <div className="space-y-4">
          <label>Can attend full bootcamp?</label>
          <p className="text-xs text-muted-foreground mb-1">Commitment from 2–27 November 2026</p>
          <Select value={form.can_attend_full} onValueChange={v=>update('can_attend_full',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="mostly">Mostly</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          <label>Weekly hours</label>
          <p className="text-xs text-muted-foreground mb-1">How many hours can you dedicate weekly?</p>
<Select value={form.weekly_hours} onValueChange={v=>update('weekly_hours',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {[
                {value:'under_5', label:'Under 5 hrs'},
                {value:'5_10', label:'5–10 hrs'},
                {value:'10_15', label:'10–15 hrs'},
                {value:'15_plus', label:'15+ hrs'},
              ].map(o=> <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Has laptop</label>
          <p className="text-xs text-muted-foreground mb-1">Do you have a laptop for development?</p>
<Select value={form.has_laptop} onValueChange={v=>update('has_laptop',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {[
                {value:'yes', label:'Yes'},
                {value:'shared', label:'Shared'},
                {value:'no', label:'No'},
              ].map(o=> <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Internet quality</label>
          <p className="text-xs text-muted-foreground mb-1">Typical internet reliability</p>
<Select value={form.internet_quality} onValueChange={v=>update('internet_quality',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {[
                {value:'reliable', label:'Reliable'},
                {value:'sometimes', label:'Sometimes'},
                {value:'poor', label:'Poor'},
              ].map(o=> <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {step===5 && (
        <div className="space-y-4">
          <label>Giveback plan <span className="text-xs">max 500</span></label>
          <p className="text-xs text-muted-foreground mb-1">How will you give back to the community after the bootcamp?</p>
          <Textarea maxLength={500} value={form.giveback_plan||''} onChange={e=>update('giveback_plan',e.target.value)} />
          <label>Declarations</label>
          <div className="flex items-center gap-2"><Checkbox checked={!!form.accuracy_confirmed} onCheckedChange={v=>update('accuracy_confirmed',!!v)} /><span>I confirm info is accurate</span></div>
          <div className="flex items-center gap-2"><Checkbox checked={!!form.seat_forfeit_ack} onCheckedChange={v=>update('seat_forfeit_ack',!!v)} /><span>I understand seat may be forfeited for inactivity</span></div>
          <div className="flex items-center gap-2"><Checkbox checked={!!form.data_consent} onCheckedChange={v=>update('data_consent',!!v)} /><span>Consent to store/share with Dev3pack if selected</span></div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" disabled={step===1} onClick={()=>setStep(s=>s-1)}>Back</Button>
        {step<5 ? <Button onClick={()=>setStep(s=>s+1)}>Next</Button> : <Button onClick={handleSubmit} disabled={mutation.isPending}>Submit</Button>}
      </div>
    </div>
  );
}


