import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Check, Users } from "lucide-react";

const empty = { name: "", addr1: "", addr2: "", country: "US", notes: "" };

export default function Clients() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState(null); // null = no edit, "new" = adding new
  const [form, setForm] = useState({ ...empty });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditingId(null); toast({ title: "Client saved" }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditingId(null); toast({ title: "Client updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast({ title: "Client deleted" }); },
  });

  function startNew() { setForm({ ...empty }); setEditingId("new"); }
  function startEdit(c) { setForm({ name: c.name, addr1: c.addr1 || "", addr2: c.addr2 || "", country: c.country || "US", notes: c.notes || "" }); setEditingId(c.id); }
  function cancel() { setEditingId(null); }

  function save() {
    if (!form.name.trim()) return;
    if (editingId === "new") createMut.mutate(form);
    else updateMut.mutate({ id: editingId, data: form });
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Client List</h1>
          </div>
          {editingId !== "new" && (
            <Button onClick={startNew} className="bg-primary text-white hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          )}
        </div>

        {/* New / Edit Form */}
        {editingId && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-4">
              {editingId === "new" ? "New Client" : "Edit Client"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Client Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Acme Corp" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Address Line 1</Label>
                <Input value={form.addr1} onChange={e => setForm(p => ({ ...p, addr1: e.target.value }))} placeholder="Street address" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Address Line 2</Label>
                <Input value={form.addr2} onChange={e => setForm(p => ({ ...p, addr2: e.target.value }))} placeholder="City, State, ZIP" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Country</Label>
                <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="US" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes…" className="text-sm min-h-[60px] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-border">
              <Button onClick={save} disabled={isSaving || !form.name.trim()} className="bg-primary text-white hover:bg-primary/90">
                <Check className="h-4 w-4 mr-2" /> {editingId === "new" ? "Save Client" : "Update Client"}
              </Button>
              <Button variant="outline" onClick={cancel}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            </div>
          </div>
        )}

        {/* Client List */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-10">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 bg-card rounded-xl border border-border">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No clients yet</p>
            <p className="text-sm mt-1">Add your first client above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground text-sm">{c.name}</div>
                  {(c.addr1 || c.addr2) && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {[c.addr1, c.addr2, c.country].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {c.notes && <div className="text-xs text-muted-foreground/70 mt-0.5 truncate">{c.notes}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(c)} className="h-8 px-2 hover:bg-primary/10 hover:text-primary">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate(c.id)} className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}