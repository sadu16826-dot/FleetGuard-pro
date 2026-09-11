import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import PassportManager from "@/components/drivers/passport-manager";

export const dynamic = "force-dynamic";

export default async function PassportManagementPage() {
  const user = await authenticatedUser();

  const [passports, drivers] = await Promise.all([
    db.driverPassport.findMany({
      where: { driver: { companyId: user.companyId! } },
      include: {
        driver: {
          select: { id: true, name: true, employeeId: true, status: true },
        },
      },
      orderBy: [{ expiryDate: "asc" }, { passportNumber: "asc" }],
    }),
    db.driver.findMany({
      where: { companyId: user.companyId! },
      select: { id: true, name: true, employeeId: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PassportManager
      initialPassports={passports.map((passport) => ({
        ...passport,
        issueDate: passport.issueDate ? passport.issueDate.toISOString() : null,
        expiryDate: passport.expiryDate ? passport.expiryDate.toISOString() : null,
        createdAt: passport.createdAt.toISOString(),
        updatedAt: passport.updatedAt.toISOString(),
      }))}
      drivers={drivers}
    />
  );
}
