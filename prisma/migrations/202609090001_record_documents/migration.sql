-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'REGISTRATION_DOCUMENT';
ALTER TYPE "DocumentType" ADD VALUE 'ROAD_TAX';
ALTER TYPE "DocumentType" ADD VALUE 'WARRANTY';
ALTER TYPE "DocumentType" ADD VALUE 'LEASE_DOCUMENT';
ALTER TYPE "DocumentType" ADD VALUE 'FINANCE_DOCUMENT';
ALTER TYPE "DocumentType" ADD VALUE 'SERVICE_INVOICE';
ALTER TYPE "DocumentType" ADD VALUE 'SERVICE_BILL';
ALTER TYPE "DocumentType" ADD VALUE 'SERVICE_REPORT';
ALTER TYPE "DocumentType" ADD VALUE 'SERVICE_ESTIMATE';
ALTER TYPE "DocumentType" ADD VALUE 'FUEL_BILL';
ALTER TYPE "DocumentType" ADD VALUE 'FUEL_RECEIPT';
ALTER TYPE "DocumentType" ADD VALUE 'CHARGING_RECEIPT';
ALTER TYPE "DocumentType" ADD VALUE 'CHARGING_INVOICE';
ALTER TYPE "DocumentType" ADD VALUE 'OTHER_FUEL_DOCUMENT';

-- AlterTable
ALTER TABLE "vehicle_documents" ADD COLUMN     "data" BYTEA,
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "fuel_record_id" TEXT,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "original_file_name" TEXT,
ADD COLUMN     "service_id" TEXT,
ADD COLUMN     "uploaded_by_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "services_id_vehicle_id_key" ON "services"("id", "vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_records_id_vehicle_id_key" ON "fuel_records"("id", "vehicle_id");

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_service_id_vehicle_id_fkey" FOREIGN KEY ("service_id", "vehicle_id") REFERENCES "services"("id", "vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_fuel_record_id_vehicle_id_fkey" FOREIGN KEY ("fuel_record_id", "vehicle_id") REFERENCES "fuel_records"("id", "vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A document belongs to at most one business record.
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_context_check"
CHECK ("service_id" IS NULL OR "fuel_record_id" IS NULL);
