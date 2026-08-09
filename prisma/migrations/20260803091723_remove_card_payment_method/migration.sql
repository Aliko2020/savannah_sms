-- Fee payments are now limited to Cash, Momo, and Bank Receipt — card
-- payments were never actually used (0 existing rows), so this just drops
-- the enum value. Postgres has no direct "DROP VALUE" for enums, so the
-- type is recreated and the column re-cast onto it.

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER');
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod" USING ("method"::text::"PaymentMethod");
DROP TYPE "PaymentMethod_old";
