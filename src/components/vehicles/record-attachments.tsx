"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function RecordAttachments({
  vehicleId,
  documents,
}: {
  vehicleId: string;
  documents: {
    id: string;
    fileName: string;
    documentType: string;
    serviceId: string | null;
    fuelRecordId: string | null;
    uploadedBy: string;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      {documents.map((document) => {
        const query = new URLSearchParams();
        if (document.serviceId) query.set("serviceId", document.serviceId);
        if (document.fuelRecordId)
          query.set("fuelRecordId", document.fuelRecordId);
        const url = `/api/vehicles/${vehicleId}/documents/${document.id}?${query}`;
        return (
          <div key={document.id} className="text-xs">
            <p>{document.fileName}</p>
            <p className="text-[10px] text-slate-500">
              {document.documentType.replaceAll("_", " ")} ·{" "}
              {document.uploadedBy}
            </p>
            <div className="mt-1 flex gap-3">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600"
              >
                View
              </a>
              <a href={`${url}&download=1`} className="text-blue-600">
                Download
              </a>
              <button
                disabled={busy}
                className="text-red-600"
                onClick={async () => {
                  if (
                    !window.confirm(`Remove attachment ${document.fileName}?`)
                  )
                    return;
                  setBusy(true);
                  setError("");
                  try {
                    const response = await fetch(url, { method: "DELETE" });
                    if (!response.ok)
                      throw new Error((await response.json()).message);
                    router.refresh();
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Unable to remove attachment.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remove attachment
              </button>
            </div>
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {!documents.length && "—"}
    </div>
  );
}
