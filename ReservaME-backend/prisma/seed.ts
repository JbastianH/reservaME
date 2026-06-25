import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordRaw = "Reservame2026@!";
  const passwordHash = await bcrypt.hash(passwordRaw, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Black & White Studio",
      domain: "black.localhost",
      email: "admin@studioblackandwhite.cl",
      address: "Valparaíso, Chile",
      isActive: true,
      settings: {
        create: {
          primaryColor: "#000000",
          secondaryColor: "#FFFFFF",
          headerColor: "#000000",
          footerColor: "#000000",
          fontFamily: "Inter",
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      tenantId: null,
      email: "superadmin@reservame.com",
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@studioblackandwhite.cl",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Seed ejecutado correctamente");
  console.log("SUPER_ADMIN: superadmin@reservame.com");
  console.log("ADMIN TENANT: admin@studioblackandwhite.cl");
  console.log(`Contraseña: ${passwordRaw}`);
}

main()
  .catch((e) => {
    console.error("Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });