import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import { passportStatusClassName, passportStatusLabel, resolvePassportStatus } from "@/lib/passport";

export const dynamic = "force-dynamic";

export default async function PassportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticatedUser();

  const passport = await db.driverPassport.findFirst({
    where: { id, driver: { companyId: user.companyId! } },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          status: true,
        },
      },
    },
  });

  if (!passport) notFound();

  const status = resolvePassportStatus(passport);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/drivers/passports" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600">
        <ArrowLeft size={14} /> Passport management
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Passport details</h1>
          <p className="mt-1 text-sm text-slate-500">Review passport validity, driver link, and document status.</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${passportStatusClassName(status)}`}>
          {passportStatusLabel(status)}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Passport information</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Driver" value={<Link href={`/dashboard/drivers/${passport.driverId}`} className="font-semibold text-blue-600">{passport.driver.name}</Link>} />
            <InfoRow label="Employee ID" value={passport.driver.employeeId ?? "—"} />
            <InfoRow label="Passport number" value={passport.passportNumber} />
            <InfoRow label="Passport holder" value={passport.passportHolderName ?? "—"} />
            <InfoRow label="Nationality" value={passport.issuingCountry ?? "—"} />
            <InfoRow label="Issue date" value={passport.issueDate ? new Date(passport.issueDate).toLocaleDateString("en-GB") : "—"} />
            <InfoRow label="Expiry date" value={passport.expiryDate ? new Date(passport.expiryDate).toLocaleDateString("en-GB") : "—"} />
            <InfoRow label="Place of issue" value={passport.placeOfIssue ?? "—"} />
            <InfoRow label="Issuing authority" value={passport.fileName ?? "—"} />
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold">Document</h2>
          {passport.fileUrl ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-medium text-slate-700">{passport.fileName ?? "Passport document"}</p>
              <a href={passport.fileUrl} download={passport.fileName ?? "passport-document"} className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                Download document
              </a>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No passport document uploaded.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
