import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, X, Check, Users, Upload, Loader2, FileText, AlertCircle } from "lucide-react";

const empty = { name: "", addr1: "", addr2: "", country: "US", notes: "" };

export default function Clients() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [uploading, setUploading] = useState(false);
  const [extractedClients, setExtractedClients] = useState([]);
  const [showExtracted, setShowExtracted] = useState(false);
  const fileInputRef = useRef(null);

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

  async function handleInvoiceUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setExtractedClients([]);

    const results = [];
    for (const file of files) {
      const isDataFile = /\.(csv|xlsx|xls|json)$/i.test(file.name);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (isDataFile) {
        // Extract structured rows from spreadsheet/CSV
        const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              addr1: { type: "string" },
              addr2: { type: "string" },
              country: { type: "string" },
              notes: { type: "string" },
            }
          }
        });
        if (extracted.status === "success") {
          const rows = Array.isArray(extracted.output) ? extracted.output : [extracted.output];
          for (const row of rows) {
            if (row.name) results.push({ ...row, notes: row.notes || "", _file: file.name, _selected: true });
          }
        }
      } else {
        // PDF / image invoice — extract Bill To via LLM
        const extracted = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract the "Bill To" client details from this invoice image/PDF. Return ONLY the client info as JSON with fields: name (company/person name), addr1 (street address line), addr2 (city, state, zip line), country (2-letter code or full name). If a field is not found, use empty string. Do not include the sender/sFOX details.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              addr1: { type: "string" },
              addr2: { type: "string" },
              country: { type: "string" },
            }
          }
        });
        if (extracted.name) {
          results.push({ ...extracted, notes: "", _file: file.name, _selected: true });
        }
      }
    }

    setExtractedClients(results);
    setShowExtracted(true);
    setUploading(false);
    fileInputRef.current.value = "";
    if (!results.length) toast({ title: "No client data found", description: "Could not extract client details from the uploaded files." });
  }

  async function saveExtracted() {
    const toSave = extractedClients.filter(c => c._selected && c.name);
    for (const c of toSave) {
      const { _file, _selected, ...data } = c;
      await base44.entities.Client.create(data);
    }
    qc.invalidateQueries({ queryKey: ["clients"] });
    setShowExtracted(false);
    setExtractedClients([]);
    toast({ title: `${toSave.length} client(s) saved` });
  }

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
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx,.xls,.json,image/*" multiple className="hidden" onChange={handleInvoiceUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current.click()} disabled={uploading} className="border-primary text-primary hover:bg-primary/10">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Extracting…" : "Upload Invoices"}
            </Button>
            {editingId !== "new" && (
              <Button onClick={startNew} className="bg-primary text-white hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" /> Add Client
              </Button>
            )}
          </div>
        </div>

        {/* Extracted Clients Review Panel */}
        {showExtracted && extractedClients.length > 0 && (
          <div className="bg-card border border-primary/40 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Extracted Clients — Review &amp; Save
              </h3>
              <button onClick={() => setShowExtracted(false)} className="text-muted-foreground hover:text-foreground p-1 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {extractedClients.map((c, idx) => (
                <div key={idx} className={`border rounded-lg p-4 transition-colors ${c._selected ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30 opacity-60"}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={c._selected} onChange={e => setExtractedClients(prev => prev.map((x, i) => i === idx ? { ...x, _selected: e.target.checked } : x))} className="mt-1 h-4 w-4 cursor-pointer accent-primary" />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Name *</Label>
                        <Input value={c.name} onChange={e => setExtractedClients(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Address Line 1</Label>
                        <Input value={c.addr1} onChange={e => setExtractedClients(prev => prev.map((x, i) => i === idx ? { ...x, addr1: e.target.value } : x))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Address Line 2</Label>
                        <Input value={c.addr2} onChange={e => setExtractedClients(prev => prev.map((x, i) => i === idx ? { ...x, addr2: e.target.value } : x))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Country</Label>
                        <Input value={c.country} onChange={e => setExtractedClients(prev => prev.map((x, i) => i === idx ? { ...x, country: e.target.value } : x))} className="h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 pl-7 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Source: {c._file}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <Button onClick={saveExtracted} className="bg-primary text-white hover:bg-primary/90">
                <Check className="h-4 w-4 mr-2" /> Save {extractedClients.filter(c => c._selected).length} Client(s)
              </Button>
              <Button variant="outline" onClick={() => setShowExtracted(false)}><X className="h-4 w-4 mr-2" /> Discard</Button>
            </div>
          </div>
        )}

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