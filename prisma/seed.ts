import "dotenv/config";
import { PrismaClient, Plan } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Kategori default per user baru — dibuat lagi tiap seed dijalankan, idempotent lewat upsert.
const DEFAULT_CATEGORIES = [
  { name: "Makanan & Minuman", color: "#2563EB", icon: "utensils" },
  { name: "Transportasi", color: "#0EA5E9", icon: "car" },
  { name: "Alat Tulis Kantor", color: "#E3A844", icon: "pencil" },
  { name: "Rumah Tangga", color: "#22C55E", icon: "home" },
  { name: "Lainnya", color: "#71717A", icon: "more-horizontal" },
];

async function seedCategories(userId: string) {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name: { userId, name: category.name } },
      update: {},
      create: { ...category, userId },
    });
  }
}

const SEED_USERS = [
  {
    email: "admin@strukscan.com",
    name: "Admin StrukScan",
    password: "password123",
    plan: "PRO" as Plan,
  },
  {
    email: "idosiregar24@gmail.com",
    name: "Ido Refael Siregar",
    password: "password123",
    plan: "PRO" as Plan,
  },
  {
    email: "demo@strukscan.test",
    name: "Demo User",
    password: "password123",
    plan: "FREE" as Plan,
  },
];

async function main() {
  console.log("--> Menjalankan Seeder Akun StrukScan...");

  const passwordHash = await bcrypt.hash("password123", 10);

  for (const u of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        name: u.name,
        plan: u.plan,
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        plan: u.plan,
      },
    });

    await seedCategories(user.id);
    console.log(`✓ Akun siap: ${u.email} | Password: ${u.password} (Plan: ${u.plan})`);
  }

  console.log("=== Seeding Berhasil Selesai! ===");
}

main()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
