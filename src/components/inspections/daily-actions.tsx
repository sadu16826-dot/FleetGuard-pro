"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DailyActions({ vehicleId, name, registrationNumber }: { vehicleId: string; name: string; registrationNumber: string }) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const remarksRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!approveOpen) return;
    remarksRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) setApproveOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [approveOpen, busy]);

  async function submitApproval() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/inspections/status", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vehicleId, status: "APPROVED", remarks: remarks.trim() }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.message ?? "Unable to approve this inspection. Please try again."); return; }
      setApproveOpen(false); window.location.reload();
    } catch { setMessage("Unable to approve this inspection. Please try again."); }
    finally { setBusy(false); }
  }
  async function submitIssue() {
    if (!issueText.trim()) { setMessage("Describe the issue before submitting."); return; }
    setBusy(true); setMessage("");
    try {
      const issueResponse = await fetch(`/api/vehicles/${vehicleId}/issues`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ issueType: "OTHER", priority: "MEDIUM", description: issueText.trim(), photos: files.map(file => file.name) }) });
      const issueData = await issueResponse.json();
      if (!issueResponse.ok) { setMessage(issueData.message ?? "Unable to submit this issue."); return; }
      const statusForm = new FormData(); statusForm.set("vehicleId", vehicleId); statusForm.set("status", "ISSUE_REPORTED"); statusForm.set("remarks", issueText.trim()); files.forEach(file => statusForm.append("evidence", file));
      const statusResponse = await fetch("/api/inspections/status", { method: "POST", body: statusForm });
      const statusData = await statusResponse.json();
      if (!statusResponse.ok) { setMessage(statusData.message ?? "Issue saved, but inspection status could not be updated."); return; }
      setIssueOpen(false); window.location.reload();
    } catch { setMessage("Unable to submit this vehicle issue. Please try again."); }
    finally { setBusy(false); }
  }

  return <>
    <div className="flex flex-wrap items-center gap-2"><button disabled={busy} onClick={() => { setMessage(""); setApproveOpen(true); }} className="rounded-md bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50">✓ Approve</button><button disabled={busy} onClick={() => { setMessage(""); setIssueOpen(true); }} className="rounded-md bg-amber-100 px-3 py-2 text-[11px] font-semibold text-amber-800 disabled:opacity-50">⚠ Issue</button>{message && !approveOpen && !issueOpen && <span className="text-[11px] text-slate-500">{message}</span>}</div>
    {approveOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setApproveOpen(false); }}><div role="dialog" aria-modal="true" aria-labelledby="approve-inspection-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="approve-inspection-title" className="flex items-center gap-2 text-lg font-bold"><span className="grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-600">✓</span>Approve Vehicle Inspection</h2><p className="mt-1 text-xs text-slate-500">Confirm today’s vehicle inspection.</p></div><button type="button" aria-label="Close approval dialog" disabled={busy} onClick={() => setApproveOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><X size={18}/></button></div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">Vehicle</p><p className="mt-1 font-semibold text-slate-900">{name}</p><p className="mt-1 text-xs text-slate-500">{registrationNumber}</p></div><label htmlFor="approval-remarks" className="mt-5 block text-xs font-semibold text-slate-700">Approval Remarks <span className="font-normal text-slate-400">(optional)</span></label><textarea ref={remarksRef} id="approval-remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Enter inspection remarks..." rows={4} disabled={busy} className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-50"/><p className="mt-3 text-xs text-slate-500">This inspection will be recorded as approved for today.</p>{message && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{message}</p>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={busy} onClick={() => setApproveOpen(false)}>Cancel</Button><Button type="button" disabled={busy} onClick={submitApproval}>{busy ? "Approving..." : "✓ Approve Vehicle"}</Button></div></div></div>}
    {issueOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="issue-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 id="issue-title" className="text-lg font-bold">⚠ Report Vehicle Issue</h2><p className="mt-1 text-xs text-slate-500">{name} · {registrationNumber}</p></div><button aria-label="Close issue dialog" disabled={busy} onClick={() => setIssueOpen(false)} className="rounded-lg p-2 text-slate-400"><X size={18}/></button></div><label htmlFor="issue-description" className="mt-6 block text-xs font-semibold">Remarks / Issue Description</label><textarea id="issue-description" value={issueText} onChange={(event) => setIssueText(event.target.value)} rows={5} disabled={busy} placeholder="Describe the damage, defect, or issue found..." className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"/><label htmlFor="issue-files" className="mt-5 block text-xs font-semibold">Upload Images / Files</label><input id="issue-files" type="file" multiple accept="image/*,.pdf,.mp4,.webm" disabled={busy} onChange={(event) => { const selected = Array.from(event.target.files ?? []); if (selected.some(file => file.size > 10 * 1024 * 1024)) { setMessage("Each file must be no larger than 10 MB."); return; } setFiles(current => [...current, ...selected].slice(0, 10)); event.currentTarget.value = ""; }} className="mt-2 block w-full rounded-lg border border-dashed border-slate-300 p-3 text-xs"/><div className="mt-3 grid gap-2 sm:grid-cols-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs"><span className="truncate">{file.name} <span className="text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span></span><button type="button" disabled={busy} onClick={() => setFiles(current => current.filter((_, itemIndex) => itemIndex !== index))} className="ml-2 text-slate-500">Remove</button></div>)}</div>{message && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={busy} onClick={() => setIssueOpen(false)}>Cancel</Button><Button type="button" disabled={busy} onClick={submitIssue}>{busy ? "Submitting..." : "⚠ Submit Issue"}</Button></div></div></div>}
  </>;
}
