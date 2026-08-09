-- Distinct "payment date" (the actual bank deposit date) separate from
-- createdAt (when the row was entered into the system). Existing rows
-- default to today since the real historical deposit date isn't known.
ALTER TABLE "payments" ADD COLUMN "paidAt" DATE NOT NULL DEFAULT CURRENT_DATE;
