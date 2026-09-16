ALTER TABLE "trip_vehicle_photos"
  ALTER COLUMN "data" DROP NOT NULL,
  ADD COLUMN "storage_url" TEXT;
