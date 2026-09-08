/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, X } from "lucide-react";

const PHOTO_SLOTS = [
  { type: "FRONT", label: "Front" },
  { type: "REAR", label: "Rear / Back" },
  { type: "LEFT", label: "Left Side" },
  { type: "RIGHT", label: "Right Side" },
] as const;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export function PreTripPhotoFields() { return <TripPhotoFields phase="pre-trip"/>; }
export function PostTripPhotoFields() { return <TripPhotoFields phase="post-trip"/>; }

function TripPhotoFields({ phase }: { phase: "pre-trip" | "post-trip" }) {
  const returning = phase === "post-trip";
  return <section aria-labelledby={`${phase}-photo-heading`} className="rounded-lg border border-slate-200 p-4">
    <h3 id={`${phase}-photo-heading`} className="text-sm font-semibold text-slate-900">{returning ? "Post-trip" : "Pre-trip"} vehicle photos</h3>
    <p className="mt-1 text-xs text-slate-500">Upload all four sides {returning ? "after returning the vehicle" : "before starting the trip"}. JPG, PNG or WEBP, up to 5 MB each.</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{PHOTO_SLOTS.map(slot => <PhotoSlot key={slot.type} {...slot}/>)}</div>
  </section>;
}

function PhotoSlot({ type, label }: { type: typeof PHOTO_SLOTS[number]["type"]; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    if (!file) return setPreview("");
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_SIZE) {
      event.target.value = "";
      setPreview("");
      setError("Use JPG, PNG or WEBP up to 5 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function remove() {
    if (input.current) input.current.value = "";
    setPreview("");
    setError("");
  }

  return <div className="min-w-0">
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
    <label className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center outline-none focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      {preview ? <img src={preview} alt={`${label} vehicle preview`} className="size-full object-cover"/> : <span className="flex flex-col items-center px-2 text-[11px] font-medium text-slate-500"><Camera size={18} className="mb-1.5"/>Upload {label}</span>}
      <input ref={input} name={`photo_${type}`} type="file" accept="image/jpeg,image/png,image/webp" required onChange={select} className="sr-only" aria-label={`Upload ${label} photo`}/>
    </label>
    {preview && <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px]"><span className="flex items-center gap-1 font-medium text-emerald-700"><CheckCircle2 size={12}/>Selected</span><span><button type="button" onClick={() => input.current?.click()} className="font-semibold text-blue-600">Replace</button><button type="button" onClick={remove} className="ml-2 text-slate-500" aria-label={`Remove ${label} photo`}><X size={12}/></button></span></div>}
    {error && <p role="alert" className="mt-1 text-[10px] leading-4 text-red-600">{error}</p>}
  </div>;
}
