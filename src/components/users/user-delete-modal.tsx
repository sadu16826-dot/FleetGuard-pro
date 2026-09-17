"use client";

import { LoaderCircle, X } from "lucide-react";
import { useState } from "react";

type UserToDelete = { id: string; name: string };

export function UserDeleteModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserToDelete;
  onClose: () => void;
  onDeleted: (result: { action?: string; message?: string }) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const result = await response.json() as { action?: string; message?: string };
      if (!response.ok) {
        setError(result.message || "Unable to delete user.");
        return;
      }
      onDeleted(result);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  }

  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/50 p-4" onMouseDown={() => !deleting && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="delete-user-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><div><h2 id="delete-user-title" className="text-lg font-semibold">Delete User?</h2><p className="mt-2 text-sm text-slate-600">Are you sure you want to delete <strong>{user.name}</strong>? This action may affect access to FleetGuard.</p></div><button type="button" disabled={deleting} onClick={onClose} aria-label="Close delete user"><X size={19}/></button></div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" disabled={deleting} onClick={remove} className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{deleting && <LoaderCircle size={15} className="mr-2 animate-spin" />}{deleting ? "Deleting…" : "Delete"}</button></div>
    </section>
  </div>;
}
