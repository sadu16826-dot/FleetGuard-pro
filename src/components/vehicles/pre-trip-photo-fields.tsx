/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { ImageOptimizationError, optimizeVehicleImage } from "@/lib/image-optimization";
import { TRIP_PHOTO_TYPES } from "@/lib/trip-photo-upload";

const PHOTO_SLOTS = [
  { type: "FRONT", label: "Front" },
  { type: "REAR", label: "Rear / Back" },
  { type: "LEFT", label: "Left Side" },
  { type: "RIGHT", label: "Right Side" },
] as const;

export type TripPhotoType = typeof TRIP_PHOTO_TYPES[number];
type PhotoChange = (type: TripPhotoType, file?: File) => void;

export function PreTripPhotoFields({ onPhotoChange, uploading = false }: { onPhotoChange: PhotoChange; uploading?: boolean }) { return <TripPhotoFields phase="pre-trip" onPhotoChange={onPhotoChange} uploading={uploading}/>; }
export function PostTripPhotoFields({ onPhotoChange, uploading = false }: { onPhotoChange: PhotoChange; uploading?: boolean }) { return <TripPhotoFields phase="post-trip" onPhotoChange={onPhotoChange} uploading={uploading}/>; }

function TripPhotoFields({ phase, onPhotoChange, uploading }: { phase: "pre-trip" | "post-trip"; onPhotoChange: PhotoChange; uploading: boolean }) {
  const returning = phase === "post-trip";
  return <section aria-labelledby={`${phase}-photo-heading`} className="rounded-lg border border-slate-200 p-4">
    <h3 id={`${phase}-photo-heading`} className="text-sm font-semibold text-slate-900">{returning ? "Post-trip" : "Pre-trip"} vehicle photos</h3>
    <p className="mt-1 text-xs text-slate-500">Upload all four sides {returning ? "after returning the vehicle" : "before starting the trip"}. JPG, PNG or WEBP, up to 5 MB each.</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{PHOTO_SLOTS.map(slot => <PhotoSlot key={slot.type} {...slot} onPhotoChange={onPhotoChange} uploading={uploading}/>)}</div>
  </section>;
}

function PhotoSlot({ type, label, onPhotoChange, uploading }: { type: TripPhotoType; label: string; onPhotoChange: PhotoChange; uploading: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const original = event.target.files?.[0];
    const current = ++sequence.current;
    setError("");
    onPhotoChange(type);
    if (!original) { setPreview(""); return; }
    setOptimizing(true);
    try {
      const file = await optimizeVehicleImage(original, `vehicle-${type.toLowerCase()}`);
      if (current !== sequence.current) return;
      setPreview((previous) => { if (previous) URL.revokeObjectURL(previous); return URL.createObjectURL(file); });
      onPhotoChange(type, file);
    } catch (reason) {
      if (current !== sequence.current) return;
      event.target.value = "";
      setPreview("");
      setError(reason instanceof ImageOptimizationError ? reason.message : "Photo could not be optimized. Please choose another photo.");
    } finally {
      if (current === sequence.current) setOptimizing(false);
    }
  }

  function remove() {
    sequence.current += 1;
    if (input.current) input.current.value = "";
    onPhotoChange(type);
    setPreview("");
    setError("");
    setOptimizing(false);
  }

  const state = optimizing ? "Optimizing…" : uploading && preview ? "Uploading…" : preview ? "Ready to upload" : "";
  return <div className="min-w-0">
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
    <label className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center outline-none focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      {preview ? <img src={preview} alt={`${label} vehicle preview`} className="size-full object-cover"/> : <span className="flex flex-col items-center px-2 text-[11px] font-medium text-slate-500"><Camera size={18} className="mb-1.5"/>Upload {label}</span>}
      <input ref={input} name={`photo_${type}`} type="file" accept="image/jpeg,image/png,image/webp" required onChange={select} className="sr-only" aria-label={`Upload ${label} photo`}/>
    </label>
    {state && <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-blue-700">{optimizing || uploading ? <LoaderCircle size={12} className="animate-spin"/> : <CheckCircle2 size={12} className="text-emerald-700"/>}{state}</p>}
    {preview && !uploading && <div className="mt-1.5 flex justify-end gap-2 text-[10px]"><button type="button" onClick={() => input.current?.click()} className="font-semibold text-blue-600">Replace</button><button type="button" onClick={remove} className="text-slate-500" aria-label={`Remove ${label} photo`}><X size={12}/></button></div>}
    {error && <p role="alert" className="mt-1 text-[10px] leading-4 text-red-600">{error}</p>}
  </div>;
}
