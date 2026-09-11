-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DriverStatus" ADD VALUE 'ON_LEAVE';
ALTER TYPE "DriverStatus" ADD VALUE 'TERMINATED';

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "emergency_address" TEXT,
ADD COLUMN     "emergency_alternate_phone" TEXT,
ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "emergency_relationship" TEXT,
ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "employment_type" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "joining_date" TIMESTAMP(3),
ADD COLUMN     "profile_photo_url" TEXT;

-- CreateTable
CREATE TABLE "driver_documents" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_name" TEXT,
    "document_number" TEXT,
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_licences" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "licence_number" TEXT NOT NULL,
    "licence_type" TEXT NOT NULL,
    "vehicle_class" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "issuing_authority" TEXT,
    "issuing_country" TEXT,
    "issuing_state" TEXT,
    "renewal_date" TIMESTAMP(3),
    "renewal_application_date" TIMESTAMP(3),
    "renewal_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "operational_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "previous_licence_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_licences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "driver_licence_documents" (
    "id" TEXT NOT NULL,
    "licence_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_data" BYTEA NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_licence_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_passports" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "passport_holder_name" TEXT,
    "passport_number" TEXT NOT NULL,
    "issuing_country" TEXT,
    "place_of_issue" TEXT,
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "file_url" TEXT,
    "file_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_assignments" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "assignment_type" TEXT NOT NULL DEFAULT 'PRIMARY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "driver_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "driver_documents_driver_id_expiry_date_idx" ON "driver_documents"("driver_id", "expiry_date");

-- CreateIndex
CREATE INDEX "driver_licences_driver_id_is_current_idx" ON "driver_licences"("driver_id", "is_current");
CREATE INDEX "driver_licences_licence_number_idx" ON "driver_licences"("licence_number");
CREATE INDEX "driver_licence_documents_licence_id_is_current_idx" ON "driver_licence_documents"("licence_id", "is_current");
CREATE INDEX "driver_licence_documents_driver_id_idx" ON "driver_licence_documents"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_passports_driver_id_key" ON "driver_passports"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_passports_passport_number_key" ON "driver_passports"("passport_number");

-- CreateIndex
CREATE INDEX "driver_assignments_driver_id_status_idx" ON "driver_assignments"("driver_id", "status");

-- CreateIndex
CREATE INDEX "driver_assignments_vehicle_id_status_idx" ON "driver_assignments"("vehicle_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_employee_id_key" ON "drivers"("employee_id");

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_licences" ADD CONSTRAINT "driver_licences_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_licences" ADD CONSTRAINT "driver_licences_previous_licence_id_fkey" FOREIGN KEY ("previous_licence_id") REFERENCES "driver_licences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "driver_licence_documents" ADD CONSTRAINT "driver_licence_documents_licence_id_fkey" FOREIGN KEY ("licence_id") REFERENCES "driver_licences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_licence_documents" ADD CONSTRAINT "driver_licence_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_licence_documents" ADD CONSTRAINT "driver_licence_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_passports" ADD CONSTRAINT "driver_passports_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
