-- Bank Receipt entry workflow: record which bank and branch/channel a bank
-- deposit came through, alongside the existing reference (the receipt/ref
-- number printed on the pay-in slip).

ALTER TABLE "payments" ADD COLUMN "bankName" TEXT;
ALTER TABLE "payments" ADD COLUMN "branchOrChannel" TEXT;
