import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { scholarshipConfig } from "@/lib/config/scholarship";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function Dev3packScholarshipForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({});
  const [applicationsOpen, setApplicationsOpen] = useState<boolean | null>(null);

  useState(() => {
    supabase.rpc('applications_open').then(({ data }) => setApplicationsOpen(!!data));
  });

  const mutation = useMutation({
    mutationFn: async (payload:any) => {
      const { error } = await supabase.from('rust_scholarship_applications').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted. We will announce results on " + scholarshipConfig.resultsAnnounce);
    },
    onError: (err:any) => {
      toast.error(err.message || "Submission failed");
    }
  });

  if (applicationsOpen === false) {
    return <div className="rounded-lg border p-6 text-center">Applications for this scholarship have closed.</div>;
  }
  if (applicationsOpen === null) return <div className="p-6">Loading…</div>;

  const update = (k:string,v:any)=> setForm((f:any)=>({...f,[k]:v}));

  const handleSubmit = () => {
    // normalize usernames to URLs
    const github = form.github_url?.startsWith('http') ? form.github_url : form.github_url ? `https://github.com/${form.github_url}` : null;
    const social = form.social_url?.startsWith('http') ? form.social_url : form.social_url ? `https://x.com/${form.social_url}` : null;
    mutation.mutate({
      ...form,
      github_url: github,
      social_url: social,
      languages_tools: form.languages_tools || [],
    });
  };

  return (
    <div className="rounded-xl border p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Apply for a seat</h2>
      <p className="text-sm text-muted-foreground">Applications close {scholarshipConfig.applicationClose}</p>

      {step===1 && (
        <div className="space-y-3">
          <label>Full name</label><Input value={form.full_name||''} onChange={e=>update('full_name',e.target.value)} />
          <label>Email</label><Input type="email" value={form.email||''} onChange={e=>update('email',e.target.value)} />
          <label>WhatsApp</label><Input value={form.phone_whatsapp||''} onChange={e=>update('phone_whatsapp',e.target.value)} />
          <label>Telegram handle</label><Input value={form.telegram_handle||''} onChange={e=>update('telegram_handle',e.target.value)} />
          <label>Department</label><Input value={form.department||''} onChange={e=>update('department',e.target.value)} />
          <label>Level</label>
          <Select value={form.level} onValueChange={v=>update('level',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {['100','200','300','400','500','Postgraduate','Graduate'].map(l=> <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Gender</label>
          <Select value={form.gender} onValueChange={v=>update('gender',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {step===2 && (
        <div className="space-y-3">
          <label>GitHub username</label><Input placeholder="username" value={form.github_url||''} onChange={e=>update('github_url',e.target.value)} />
          <label>X / Twitter username</label><Input placeholder="username" value={form.social_url||''} onChange={e=>update('social_url',e.target.value)} />
          <label>Club member?</label>
          <Select value={form.club_member} onValueChange={v=>update('club_member',v==='true')}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
          <label>Programming experience</label>
          <Select value={form.programming_experience} onValueChange={v=>update('programming_experience',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {['never','beginner','intermediate','advanced'].map(v=> <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Rust experience</label>
          <Select value={form.rust_experience} onValueChange={v=>update('rust_experience',v)}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              {['none','a_little','comfortable'].map(v=> <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {step===3 && (
        <div className="space-y-3">
          <label>Motivation <span className="text-xs text-muted-foreground">max 800</span></label>
          <Textarea maxLength={800} value={form.motivation||''} onChange={e=>update('motivation',e.target.value)} />
          <label>Rust reasoning <span className="text-xs">max 500</span></label>
          <Textarea maxLength={500} value={form.rust_reasoning||''} onChange={e=>update('rust_reasoning',e.target.value)} />
          <label>Hard learning experience <span className="text-xs">max 600</span></label>
          <Textarea maxLength={600} value={form.hard_learning||''} onChange={e=>update('hard_learning',e.target.value)} />
          <label>Goal by end Nov <span className="text-xs">max 500</span></label>
          <Textarea maxLength={500} value={form.goal_by_end_nov||''} onChange={e=>update('goal_by_end_nov',e.target.value)} />
        </div>
      )}

      {step===4 && (
        <div className="space-y-3">
          <label>Can attend full bootcamp?</label>
          <Select value={form.can_attend_full} onValueChange={v=>update('can_attend_full',v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="mostly">Mostly</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          <label>Weekly hours</label>
          <Select value={form.weekly_hours} onValueChange={v=>update('weekly_hours',v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              {['under_5','5_10','10_15','15_plus'].map(v=> <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Has laptop</label>
          <Select value={form.has_laptop} onValueChange={v=>update('has_laptop',v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              {['yes','shared','no'].map(v=> <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <label>Internet quality</label>
          <Select value={form.internet_quality} onValueChange={v=>update('internet_quality',v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              {['reliable','sometimes','poor'].map(v=> <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {step===5 && (
        <div className="space-y-3">
          <label>Giveback plan <span className="text-xs">max 500</span></label>
          <Textarea maxLength={500} value={form.giveback_plan||''} onChange={e=>update('giveback_plan',e.target.value)} />
          <label>Declarations</label>
          <div className="flex items-center gap-2"><Checkbox checked={form.accuracy_confirmed} onCheckedChange={v=>update('accuracy_confirmed',!!v)} /><span>I confirm info is accurate</span></div>
          <div className="flex items-center gap-2"><Checkbox checked={form.seat_forfeit_ack} onCheckedChange={v=>update('seat_forfeit_ack',!!v)} /><span>I understand seat may be forfeited</span></div>
          <div className="flex items-center gap-2"><Checkbox checked={form.data_consent} onCheckedChange={v=>update('data_consent',!!v)} /><span>Consent to store/share with Dev3pack if selected</span></div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" disabled={step===1} onClick={()=>setStep(s=>s-1)}>Back</Button>
        {step<5 ? <Button onClick={()=>setStep(s=>s+1)}>Next</Button> : <Button onClick={handleSubmit} disabled={mutation.isPending}>Submit</Button>}
      </div>
    </div>
  );
}
