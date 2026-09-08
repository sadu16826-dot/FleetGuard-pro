-- Vehicle Management phase. Apply to an existing FleetGuard schema with `prisma migrate deploy`.
CREATE TYPE "VehicleType" AS ENUM ('CAR','SUV','VAN','BUS','TRUCK','PICKUP','OTHER');
CREATE TYPE "FuelType" AS ENUM ('PETROL','DIESEL','ELECTRIC','HYBRID','CNG');
CREATE TYPE "OwnershipType" AS ENUM ('COMPANY_OWNED','LEASED','RENTED','EMPLOYEE_OWNED','THIRD_PARTY');
CREATE TYPE "DocumentType" AS ENUM ('RC','INSURANCE','POLLUTION_CERTIFICATE','FITNESS_CERTIFICATE','PERMIT','TAX_DOCUMENT','OTHER');
CREATE TYPE "VehicleActivityAction" AS ENUM ('VEHICLE_CREATED','VEHICLE_UPDATED','STATUS_CHANGED','DOCUMENT_UPLOADED','DOCUMENT_UPDATED','VEHICLE_CHECKED_OUT','VEHICLE_RETURNED','INSPECTION_COMPLETED','SERVICE_COMPLETED','TYRE_UPDATED','ACCIDENT_REPORTED');
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'AVAILABLE';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'IN_USE';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'INSPECTION_REQUIRED';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'SERVICE_DUE';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'ACCIDENT_REPAIR';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'NOT_ROADWORTHY';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'SOLD';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'DISPOSED';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'TRANSFERRED';

ALTER TABLE "vehicles" ADD COLUMN "vehicle_code" TEXT,
ADD COLUMN "vehicle_type" "VehicleType", ADD COLUMN "variant" TEXT,
ADD COLUMN "manufacturing_year" INTEGER, ADD COLUMN "colour" TEXT,
ADD COLUMN "transmission" TEXT, ADD COLUMN "seating_capacity" INTEGER,
ADD COLUMN "chassis_number" TEXT, ADD COLUMN "engine_number" TEXT, ADD COLUMN "vin" TEXT,
ADD COLUMN "engine_capacity" TEXT, ADD COLUMN "battery_type" TEXT, ADD COLUMN "battery_capacity" TEXT,
ADD COLUMN "vehicle_weight" TEXT, ADD COLUMN "owner_name" TEXT, ADD COLUMN "ownership_type" "OwnershipType",
ADD COLUMN "purchase_date" TIMESTAMP(3), ADD COLUMN "purchase_price" DECIMAL(14,2),
ADD COLUMN "current_estimated_value" DECIMAL(14,2), ADD COLUMN "finance_status" TEXT,
ADD COLUMN "finance_company" TEXT, ADD COLUMN "registration_date" TIMESTAMP(3),
ADD COLUMN "registration_state" TEXT, ADD COLUMN "registration_authority" TEXT,
ADD COLUMN "rc_number" TEXT, ADD COLUMN "vehicle_class" TEXT,
ADD COLUMN "last_service_date" TIMESTAMP(3), ADD COLUMN "last_service_km" INTEGER,
ADD COLUMN "next_service_date" TIMESTAMP(3), ADD COLUMN "next_service_km" INTEGER,
ADD COLUMN "service_interval" INTEGER, ADD COLUMN "primary_photo_url" TEXT,
ADD COLUMN "primary_driver_id" TEXT, ADD COLUMN "current_driver_id" TEXT,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "vehicles_vehicle_code_key" ON "vehicles"("vehicle_code");
UPDATE "vehicles" SET "vehicle_code" = 'VEH-' || substr("id", 1, 8), "vehicle_type" = 'OTHER' WHERE "vehicle_code" IS NULL;
ALTER TABLE "vehicles" ALTER COLUMN "vehicle_code" SET NOT NULL, ALTER COLUMN "vehicle_type" SET NOT NULL;
ALTER TABLE "vehicles" ALTER COLUMN "fuel_type" TYPE "FuelType" USING upper("fuel_type")::"FuelType";

ALTER TABLE "vehicle_documents" ADD COLUMN "file_name" TEXT,
ADD COLUMN "uploaded_by" TEXT, ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "vehicle_documents" SET "file_name" = 'legacy-document', "uploaded_by" = 'System' WHERE "file_name" IS NULL;
ALTER TABLE "vehicle_documents" ALTER COLUMN "file_name" SET NOT NULL, ALTER COLUMN "uploaded_by" SET NOT NULL;
ALTER TABLE "vehicle_documents" ALTER COLUMN "document_type" TYPE "DocumentType" USING upper(replace("document_type", ' ', '_'))::"DocumentType";

CREATE TABLE "vehicle_activities" (
  "id" TEXT NOT NULL, "vehicle_id" TEXT NOT NULL, "user_id" TEXT,
  "action" "VehicleActivityAction" NOT NULL, "description" TEXT NOT NULL,
  "metadata" JSONB, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vehicle_activities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vehicle_activities_vehicle_id_created_at_idx" ON "vehicle_activities"("vehicle_id","created_at");
ALTER TABLE "vehicle_activities" ADD CONSTRAINT "vehicle_activities_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_activities" ADD CONSTRAINT "vehicle_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
