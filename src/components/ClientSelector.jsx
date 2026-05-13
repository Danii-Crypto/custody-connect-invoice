import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

export default function ClientSelector({ onSelect }) {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  if (clients.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <Users className="h-4 w-4 text-primary shrink-0" />
      <Select
        onValueChange={(id) => {
          const c = clients.find(cl => cl.id === id);
          if (c) onSelect(c);
        }}
      >
        <SelectTrigger className="h-9 text-sm bg-card border-primary/40 text-foreground">
          <SelectValue placeholder="Fill from saved client…" />
        </SelectTrigger>
        <SelectContent>
          {clients.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}