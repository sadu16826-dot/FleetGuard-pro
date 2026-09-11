CREATE TABLE "inspection_evidence" (
  "id" TEXT NOT NULL,
  "inspection_id" TEXT NOT NULL,
  "vehicle_id" TEXT NOT NULL,
  "uploaded_by_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "file_data" BYTEA NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inspection_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inspection_evidence_inspection_id_created_at_idx" ON "inspection_evidence"("inspection_id", "created_at");
ALTER TABLE "inspection_evidence" ADD CONSTRAINT "inspection_evidence_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_evidence" ADD CONSTRAINT "inspection_evidence_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_evidence" ADD CONSTRAINT "inspection_evidence_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
