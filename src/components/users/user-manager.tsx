"use client";

import { FormEvent, useRef, useState } from "react";
import { Pencil, ShieldCheck, Trash2, UserPlus, UserRound } from "lucide-react";
import type { UserRole } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { roleLabel, userRoles } from "@/lib/permissions";
import { UserEditModal } from "@/components/users/user-edit-modal";
import { UserDeleteModal } from "@/components/users/user-delete-modal";

type ManagedUser = { id: string; name: string; email: string; role: UserRole; active: boolean; createdAt: string; lastLoginAt: string | null };
const roles: UserRole[] = [...userRoles];

export function UserManager({ initialUsers, currentUserId }: { initialUsers: ManagedUser[]; currentUserId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);
  const [success, setSuccess] = useState("");
  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) return setError(payload.message ?? "Unable to create user.");
    setUsers((current) => [...current, { ...payload, createdAt: new Date().toISOString(), lastLoginAt: null }].sort((a, b) => a.name.localeCompare(b.name)));
    formRef.current?.reset();
  }
  async function updateUser(id: string, input: { role?: UserRole; active?: boolean }) {
    setError("");
    const response = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const payload = await response.json();
    if (!response.ok) return setError(payload.message ?? "Unable to update user.");
    setUsers((current) => current.map((user) => user.id === id ? { ...user, ...payload } : user));
  }
  function userEdited(updated: Pick<ManagedUser, "id" | "name" | "email" | "role" | "active">) {
    setUsers((current) => current.map((user) => user.id === updated.id ? { ...user, ...updated } : user));
    setEditing(null);
    setSuccess("User updated successfully.");
  }
  function userDeleted(id: string, result: { action?: string; message?: string }) {
    setUsers((current) => result.action === "deleted" ? current.filter((user) => user.id !== id) : current.map((user) => user.id === id ? { ...user, active: false } : user));
    setDeleting(null);
    setSuccess(result.message || "User deleted successfully.");
  }
  return <div className="mx-auto max-w-[1200px]">
    <div className="flex items-end justify-between"><div><p className="text-xs font-medium text-slate-500">Administration</p><h1 className="mt-1 text-2xl font-bold">User Management</h1><p className="mt-1 text-sm text-slate-500">Create users, assign roles, and control account access.</p></div><div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"><ShieldCheck size={15}/>Company scoped</div></div>
    <Card className="mt-6 p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><UserPlus size={16}/>Create user</h2><form ref={formRef} onSubmit={createUser} className="mt-4 grid gap-3 md:grid-cols-4"><input required name="name" placeholder="Full name" className="rounded-lg border px-3 py-2 text-sm"/><input required type="email" name="email" placeholder="Email" className="rounded-lg border px-3 py-2 text-sm"/><input required minLength={10} type="password" name="password" placeholder="Temporary password" className="rounded-lg border px-3 py-2 text-sm"/><select name="role" required className="rounded-lg border px-3 py-2 text-sm"><option value="">Select role</option>{roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating…" : "Create user"}</button></form>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}</Card>
    {success && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
    <Card className="mt-6 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50"><tr>{["User", "Email", "Role", "Account", "Last login", "Created", "Actions"].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold text-slate-600">{label}</th>)}</tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-t text-xs"><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-blue-50 text-blue-600"><UserRound size={15}/></span><span className="font-semibold">{item.name}</span></div></td><td className="px-4 py-4">{item.email}</td><td className="px-4 py-4"><select value={item.role} onChange={(event) => updateUser(item.id, { role: event.target.value as UserRole })} className="rounded border px-2 py-1" disabled={item.id === currentUserId}>{roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></td><td className="px-4 py-4"><button disabled={item.id === currentUserId} onClick={() => updateUser(item.id, { active: !item.active })} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.active ? "ACTIVE" : "INACTIVE"}</button></td><td className="px-4 py-4">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString("en-GB") : "Never"}</td><td className="px-4 py-4">{new Date(item.createdAt).toLocaleDateString("en-GB")}</td><td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => { setSuccess(""); setEditing(item); }} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-semibold text-blue-600 hover:bg-blue-50"><Pencil size={13}/>Edit</button><button type="button" disabled={item.id === currentUserId} onClick={() => { setSuccess(""); setDeleting(item); }} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={13}/>Delete</button></div></td></tr>)}</tbody></table></div></Card>
    {editing && <UserEditModal user={editing} currentUserId={currentUserId} onClose={() => setEditing(null)} onUpdated={userEdited}/>} 
    {deleting && <UserDeleteModal user={deleting} onClose={() => setDeleting(null)} onDeleted={(result) => userDeleted(deleting.id, result)}/>}
  </div>;
}
