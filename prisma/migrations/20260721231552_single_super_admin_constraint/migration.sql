-- Enforce at most one SUPER_ADMIN row, regardless of application-level checks.
CREATE UNIQUE INDEX "users_single_super_admin" ON "users" ("role") WHERE "role" = 'SUPER_ADMIN';
