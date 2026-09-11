import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";
type IssueInput = {
  issueType?: string;
  description?: string;
  priority?: string;
  reportedDate?: string;
  status?: string;
  currentKm?: number;
  photos?: string[];
  safetyCritical?: boolean;
};
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await accessibleVehicle(id);
    return NextResponse.json(
      await db.vehicleIssue.findMany({
        where: { vehicleId: id },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (error) {
    return accessFailure(error, "Unable to load issues.");
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, vehicle } = await accessibleVehicle(id, true);
    const input = (await request.json()) as IssueInput;
    if (!input.issueType || !input.description?.trim() || !input.priority)
      return NextResponse.json(
        { message: "Issue type, description and priority are required." },
        { status: 400 },
      );
    const currentKm =
      input.currentKm == null ? vehicle.currentKm : Number(input.currentKm);
    if (!Number.isInteger(currentKm) || currentKm < vehicle.currentKm)
      return NextResponse.json(
        {
          message:
            "Issue odometer cannot be lower than the vehicle's current KM.",
        },
        { status: 400 },
      );
    const issueType = input.issueType;
    const critical =
      input.priority === "CRITICAL" && Boolean(input.safetyCritical);
    const issue = await db.$transaction(async (tx) => {
      const created = await tx.vehicleIssue.create({
        data: {
          vehicleId: id,
          issueType: issueType as never,
          description: input.description!.trim(),
          priority: input.priority as never,
          status: (input.status || "OPEN") as never,
          reportedDate: input.reportedDate
            ? new Date(input.reportedDate)
            : new Date(),
          reportedBy: user.name,
          currentKm,
          photos: input.photos ?? [],
          safetyCritical: critical,
        },
      });
      const vehicleUpdate: { status?: "NOT_ROADWORTHY"; currentKm?: number } =
        {};
      if (critical) vehicleUpdate.status = "NOT_ROADWORTHY";
      if (currentKm > vehicle.currentKm) vehicleUpdate.currentKm = currentKm;
      if (Object.keys(vehicleUpdate).length)
        await tx.vehicle.update({ where: { id }, data: vehicleUpdate });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "ISSUE_REPORTED",
          description: `${input.priority} ${issueType.replaceAll("_", " ")} issue reported`,
          metadata: { issueId: created.id, safetyCritical: critical },
        },
      });
      return created;
    });
    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error("Report issue failed", error);
    return accessFailure(error, "Unable to report vehicle issue.");
  }
}
