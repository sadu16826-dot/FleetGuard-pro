"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { UserRole } from "@/generated/prisma";
import { roleLabel } from "@/lib/permissions";

type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export function UserEditModal({
  user,
  currentUserId,
  onClose,
  onUpdated,
}: {
  user: EditableUser;
  currentUserId: string;
  onClose: () => void;
  onUpdated: (user: EditableUser) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const body: { email: string; role?: string; password?: string } = {
      email: String(form.get("email") ?? ""),
    };
    if (user.id !== currentUserId) body.role = String(form.get("role") ?? "");
    if (password) body.password = password;
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "Unable to update user.");
        return;
      }
      onUpdated(payload);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  const field = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500";
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/50 p-4" onMouseDown={() => !saving && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="edit-user-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 id="edit-user-title" className="text-lg font-semibold">Edit User</h2>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Close edit user"><X size={19}/></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-700">Full Name<input value={user.name} readOnly className={`${field} bg-slate-50 text-slate-500`}/></label>
          <label className="block text-xs font-semibold text-slate-700">Email<input name="email" type="email" required defaultValue={user.email} className={field}/></label>
          <label className="block text-xs font-semibold text-slate-700">New Password<input name="password" type="password" minLength={10} autoComplete="new-password" placeholder="Leave blank to keep current password" className={field}/></label>
          <label className="block text-xs font-semibold text-slate-700">Role<select name="role" required defaultValue={user.role} disabled={user.id === currentUserId} className={field}>{Object.values(UserRole).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
          {user.id === currentUserId && <p className="text-xs text-slate-500">Your own administrator role is protected.</p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" disabled={saving} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save Changes"}</button></div>
        </form>
      </section>
    </div>
  );
}
