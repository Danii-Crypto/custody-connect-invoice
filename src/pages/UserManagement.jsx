import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Users, Shield, User as UserIcon, Plus, Loader2 } from "lucide-react";

export default function UserManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      toast({ title: "User invited", description: `${inviteEmail.trim()} has been invited as ${inviteRole}.` });
      setInviteEmail("");
      setInviteRole("user");
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err.message || "Could not invite user.";
      toast({ title: "Invite failed", description: typeof msg === "string" ? msg : "Could not invite user." });
    }
    setInviting(false);
  }

  async function handleRoleChange(userId, newRole) {
    setUpdatingId(userId);
    try {
      await base44.entities.User.update(userId, { role: newRole });
      toast({ title: "Role updated", description: `User role changed to ${newRole}.` });
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast({ title: "Update failed", description: "Could not change user role." });
    }
    setUpdatingId(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">Invite team members and manage admin access</p>
          </div>
        </div>

        {/* Invite Form */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Invite New User
          </h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Label className="text-xs text-muted-foreground mb-1 block">Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="person@example.com"
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="w-full sm:w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={inviting} className="bg-primary text-white hover:bg-primary/90 h-9">
              {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Send Invite
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>User</strong> — Can create invoices and manage vessel owners. &nbsp;
            <strong>Admin</strong> — Full access including user management and data reset.
          </p>
        </div>

        {/* User List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Team Members ({users.length})</h2>
          </div>
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Loading users…</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${u.role === "admin" ? "bg-primary/10" : "bg-muted"}`}>
                      {u.role === "admin"
                        ? <Shield className="h-4 w-4 text-primary" />
                        : <UserIcon className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{u.full_name || u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                  <div className="w-full sm:w-40">
                    <Select
                      value={u.role || "user"}
                      onValueChange={(val) => handleRoleChange(u.id, val)}
                      disabled={updatingId === u.id}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="py-16 text-center text-muted-foreground text-sm">No users found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}