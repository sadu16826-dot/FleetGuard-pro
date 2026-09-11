import { authenticatedUser, AccessError } from "@/lib/access-control";
import { db } from "@/lib/db";

export async function accessibleLicence(id: string, write = false) {
  const user = await authenticatedUser(write);
  const licence = await db.driverLicence.findFirst({
    where: { id, driver: { companyId: user.companyId! } },
  });
  if (!licence) throw new AccessError("Licence not found.", 404);
  return { user, licence };
}
