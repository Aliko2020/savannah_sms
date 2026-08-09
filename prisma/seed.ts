import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { ensureStandardSubjects } from "../src/services/subjectSeedService";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminIdentifier = process.env.SEED_ADMIN_USERNAME;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminIdentifier || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD must be set in .env",
    );
  }

  console.log("Starting database seeding...");

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminIdentifier },
  });

  if (existingAdmin) {
    console.log("Admin account already exists. Skipping creation.");
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        username: adminIdentifier,
        email: "admin@savannasms.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        firstName: "Director",
        lastName: "",
        isActive: true,
      },
    });

    console.log("Super Admin created successfully!");
    console.log(`Username/Phone: ${admin.username}`);
    console.log(`Password: ${adminPassword}`);
  }

  const subjectCount = await ensureStandardSubjects(prisma);
  console.log(`Standard subjects: ${subjectCount} added.`);

  await prisma.schoolSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      name: "WALLER ACADEMY",
      address: "POST OFFICE BOX 47, YIKENE-BOLGATANGA",
      phone: "0246787576 / 0244124636",
    },
  });
  console.log("School settings ready (editable from School Settings in the app).");
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
