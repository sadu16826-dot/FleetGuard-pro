import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getExpiryStatus } from "@/lib/vehicle-utils";
import { authenticatedUser } from "@/lib/access-control";
import { documentSelect } from "@/lib/document-server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function Documents() {
  const user = await authenticatedUser();
  const docs = await db.vehicleDocument.findMany({ where: { vehicle: { companyId: user.companyId! }, serviceId: null, fuelRecordId: null }, select: { ...documentSelect, vehicle: { select: { vehicleName: true, registrationNumber: true } } }, orderBy: { createdAt: "desc" } });
  return <div className="mx-auto max-w-[1500px]"><h1 className="text-2xl font-bold">Vehicle documents</h1><p className="mt-1 text-sm text-slate-500">Monitor vehicle compliance files and expiry dates.</p><Card className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-slate-50"><tr>{["Vehicle", "Document", "Type", "Issue date", "Expiry", "Status", "Uploaded by", "Actions"].map(label => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{docs.map(document => <tr key={document.id} className="border-t border-slate-100"><td className="p-4"><Link href={`/vehicles/${document.vehicleId}?tab=Documents`}>{document.vehicle.vehicleName} · {document.vehicle.registrationNumber}</Link></td><td className="p-4">{document.documentName ?? document.fileName}</td><td className="p-4">{document.documentType.replaceAll("_", " ")}</td><td className="p-4">{document.issueDate?.toLocaleDateString("en-GB") ?? "—"}</td><td className="p-4">{document.expiryDate?.toLocaleDateString("en-GB") ?? "—"}</td><td className="p-4">{getExpiryStatus(document.expiryDate)}</td><td className="p-4">{document.uploadedBy}</td><td className="p-4"><a className="mr-3 text-blue-600" href={`/api/vehicles/${document.vehicleId}/documents/${document.id}`} target="_blank" rel="noreferrer">View</a><a className="text-blue-600" href={`/api/vehicles/${document.vehicleId}/documents/${document.id}?download=1`}>Download</a></td></tr>)}</tbody></table>{!docs.length && <p className="p-8 text-center text-sm text-slate-500">No vehicle documents found.</p>}</Card></div>;
}
