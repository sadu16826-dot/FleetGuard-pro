ALTER TABLE "vehicles"
  ADD COLUMN "primary_photo_data" BYTEA,
  ADD COLUMN "primary_photo_mime_type" TEXT,
  ADD COLUMN "primary_photo_file_name" TEXT;
