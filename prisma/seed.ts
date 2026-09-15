import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

async function seedDemoData(userId: string) {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name: { userId, name: category.name } },
      update: {},
      create: { ...category, userId },
    });
  }
}

async function main() {
  // Data dummy HANYA untuk lokal/staging — tidak pernah dijalankan otomatis di production (database-standards.md).
  if (process.env.NODE_ENV === "production") {
    console.log("Skip seeding: NODE_ENV=production");
    return;
  }

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@strukscan.test" },
    update: {},
    create: {
      email: "demo@strukscan.test",
      name: "Demo User",
      plan: "FREE",
    },
  });

  await seedDemoData(demoUser.id);
  console.log(`Seed selesai untuk user: ${demoUser.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
