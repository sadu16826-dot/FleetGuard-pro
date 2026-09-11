import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LicenceEditForm } from "@/components/drivers/licence-edit-form";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function EditLicence({params}:{params:Promise<{id:string}>}){const {id}=await params;const user=await authenticatedUser(true);const licence=await db.driverLicence.findFirst({where:{id,driver:{companyId:user.companyId!}}});if(!licence)notFound();return <div className="mx-auto max-w-3xl"><h1 className="text-2xl font-bold">Edit Licence</h1><p className="mt-1 text-sm text-slate-500">Update licence and renewal information.</p><Card className="mt-6 p-6"><LicenceEditForm licence={{...licence,issueDate:licence.issueDate.toISOString(),expiryDate:licence.expiryDate.toISOString()}}/></Card></div>}
