ALTER TABLE "inspections" ADD COLUMN "vehicle_id" TEXT,
ADD COLUMN "driver_id" TEXT,
ADD COLUMN "inspector_id" TEXT,
ADD COLUMN "company_id" TEXT,
ADD COLUMN "inspection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "previous_km" INTEGER,
ADD COLUMN "current_km" INTEGER,
ADD COLUMN "result" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "inspections" ALTER COLUMN "trip_id" DROP NOT NULL;
CREATE INDEX "inspections_company_id_inspection_date_idx" ON "inspections"("company_id", "inspection_date");
CREATE INDEX "inspections_vehicle_id_inspection_date_idx" ON "inspections"("vehicle_id", "inspection_date");
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
