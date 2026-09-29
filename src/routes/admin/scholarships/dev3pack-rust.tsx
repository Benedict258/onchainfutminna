import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/scholarships/dev3pack-rust")({
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['scholarship-apps'],
    queryFn: async () => {
      const { data, error } = await supabase.from('rust_scholarship_applications').select('*').order('total_score',{ascending:false});
      if (error) throw error;
      return data;
    }
  });

  const updateScore = useMutation({
    mutationFn: async ({id, patch}:{id:string, patch:any}) => {
      const { error } = await supabase.from('rust_scholarship_applications').update(patch).eq('id',id);
      if (error) throw error;
    },
    onSuccess: ()=> qc.invalidateQueries({queryKey:['scholarship-apps']})
  });

  const exportCSV = () => {
    if (!data) return;
    const headers = Object.keys(data[0]||{});
    const rows = data.map(r => headers.map(h => {
      const v = r[h];
      const s = v==null?'':String(v);
      if (/^[=+\-@]/.test(s)) return "'"+s;
      return '"'+s.replace(/"/g,'""')+'"';
    }).join(','));
    const csv = '\ufeff'+[headers.join(','),...rows].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dev3pack-rust-scholarship-'+new Date().toISOString().slice(0,10)+'.csv';
    a.click();
  };

  const selectedCount = data?.filter(d=>d.status==='selected').length||0;

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dev3pack Rust Scholarship Admin</h1>
        <div className="flex gap-2">
          <span>Selected: {selectedCount}/15</span>
          <Button onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>
      <Input placeholder="Search name or email" />
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Dept</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {data?.map(r=>(
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.full_name}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.department}</td>
                <td className="p-2">
                  <Select value={r.status} onValueChange={v=>updateScore.mutate({id:r.id, patch:{status:v}})}>
                    <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {['pending','shortlisted','selected','waitlisted','rejected'].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">{r.total_score?.toFixed(1)||'-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCount>15 && <div className="text-red-500">Warning: more than 15 selected</div>}
    </div>
  );
}
