import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminIdentifier = "0507363607";
  const adminPassword = "Sweetface@1734!";

  console.log("Starting database seeding...");

  const existingAdmin = await prisma.user.findUnique({
    where: { usernameOrPhone: adminIdentifier },
  });

  if (existingAdmin) {
    console.log("Admin account already exists. Skipping creation.");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      usernameOrPhone: adminIdentifier,
      email: "admin@savannasms.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      firstName: "System",
      lastName: "Administrator",
      isActive: true,
    },
  });

  console.log("Super Admin created successfully!");
  console.log(`Username/Phone: ${admin.usernameOrPhone}`);
  console.log(`Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });