import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // --------------------------------------------------------
  // 1. CREACIÓN DEL USUARIO ADMINISTRADOR
  // --------------------------------------------------------
  
  const adminPasswordRaw = "Reservame2026@!"; 
  const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);
  const adminEmail = "admin@reservame.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      passwordHash: hashedPassword, 
      isActive: true,            
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword, 
      role: "ADMIN",
      isActive: true,             
    },
  });

  console.log(`Admin configurado: ${adminEmail}`);
  console.log(`Contraseña: ${adminPasswordRaw}`);
  console.log(`Estado: Activo (isActive: true)`);

  // --------------------------------------------------------
  // 2. LÓGICA DE HORARIOS DE BARBEROS
  // --------------------------------------------------------
  
  const barbers = await prisma.barber.findMany({ select: { id: true } });

  for (const b of barbers) {
    for (const day of ["MON","TUE","WED","THU","FRI","SAT","SUN"] as const) {
      await prisma.barberWeeklySchedule.upsert({
        where: { barberId_day: { barberId: b.id, day } },
        update: {},
        create: {
          barberId: b.id,
          day,
          isClosed: false,
          startMin: 600,
          endMin: 1200,
        },
      });
    }
  }
  
  console.log("Horarios de barberos verificados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });