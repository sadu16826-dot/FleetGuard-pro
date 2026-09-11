"use client";
import { useEffect, useRef, useState } from "react";
import {
  DOCUMENT_ACCEPT,
  documentFileError,
  SERVICE_DOCUMENT_TYPES,
  FUEL_DOCUMENT_TYPES,
} from "@/lib/document-upload";

export function DocumentFileField({
  name = "file",
  required = false,
}: {
  name?: string;
  required?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-xs">
      <label className="block font-medium">
        {file ? "Replace file" : "Upload file"}
        <input
          ref={input}
          name={name}
          type="file"
          required={required}
          accept={DOCUMENT_ACCEPT}
          className="mt-2 block w-full text-xs"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            const message = selected ? documentFileError(selected) : null;
            event.target.setCustomValidity(message ?? "");
            setError(message ?? "");
            setFile(message ? undefined : selected);
            setPreview(
              selected && !message ? URL.createObjectURL(selected) : "",
            );
          }}
        />
      </label>
      <p className="text-slate-500">PDF, JPG, PNG or WEBP · Maximum 10 MB</p>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {file && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="break-all">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </span>
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600"
          >
            View
          </a>
          <button
            type="button"
            className="text-red-600"
            onClick={() => {
              if (input.current) {
                input.current.value = "";
                input.current.setCustomValidity("");
              }
              setFile(undefined);
              setPreview("");
              setError("");
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
export function RecordDocumentFields({
  context,
}: {
  context: "service" | "fuel";
}) {
  const [rows, setRows] = useState<number[]>([]);
  const next = useRef(0);
  const types =
    context === "service" ? SERVICE_DOCUMENT_TYPES : FUEL_DOCUMENT_TYPES;
  return (
    <section className="space-y-3 border-t pt-4">
      <h3 className="text-xs font-semibold uppercase">
        {context === "service"
          ? "Service documents"
          : "Fuel receipt / document"}
      </h3>
      <p className="text-xs text-slate-500">
        Upload{" "}
        {context === "service"
          ? "invoices, reports or warranty documents"
          : "fuel or charging receipts"}{" "}
        (up to five files).
      </p>
      {rows.map((id) => (
        <div key={id} className="space-y-2">
          <label className="block text-xs">
            Document type
            <select name="attachmentType" className="ml-2 rounded border p-2">
              {types.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <DocumentFileField name="attachment" required />
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => setRows(rows.filter((row) => row !== id))}
          >
            Remove attachment
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= 5}
        onClick={() => setRows([...rows, next.current++])}
        className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50"
      >
        + Upload document
      </button>
    </section>
  );
}
