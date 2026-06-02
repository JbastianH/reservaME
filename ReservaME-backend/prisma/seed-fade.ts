import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordRaw = "Reservame2026@!";
  const passwordHash = await bcrypt.hash(passwordRaw, 10);

  // ======================================
  // TENANT FADE ZONE
  // ======================================

  const tenant = await prisma.tenant.create({
    data: {
      name: "Fade Zone",
      domain: "fade.localhost",
      email: "admin@fadezone.cl",
      address: "Viña del Mar, Chile",
      isActive: true,
      settings: {
        create: {
          primaryColor: "#111827",
          secondaryColor: "#F59E0B",
          headerColor: "#111827",
          footerColor: "#111827",
          fontFamily: "Inter",
        },
      },
    },
  });

  // ======================================
  // ADMIN TENANT
  // ======================================

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@fadezone.cl",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("=====================================");
  console.log("TENANT CREADO");
  console.log("=====================================");
  console.log(`Nombre: ${tenant.name}`);
  console.log(`Dominio: ${tenant.domain}`);
  console.log("");
  console.log("ADMIN:");
  console.log(admin.email);
  console.log(passwordRaw);
  console.log("=====================================");
}

main()
  .catch((e) => {
    console.error("Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });