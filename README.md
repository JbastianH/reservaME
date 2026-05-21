# ReservaME

Plataforma web Micro-SaaS Multi-Tenant para la gestión de reservas de barberías.

## Descripción

ReservaME es una aplicación web que permite a barberías administrar reservas, servicios, horarios y barberos mediante un sistema de agendamiento online.

El proyecto está diseñado bajo una arquitectura SaaS Multi-Tenant, permitiendo que múltiples barberías utilicen la misma plataforma manteniendo sus datos y configuraciones independientes.

## Características principales

- Gestión de reservas online
- Administración de barberos
- Administración de servicios
- Visualización de horarios disponibles
- Autenticación mediante JWT
- Reseñas de clientes
- Galería de trabajos
- Envío de correos automáticos
- Arquitectura preparada para Multi-Tenant

## Tecnologías utilizadas

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- NestJS
- Prisma ORM
- JWT Authentication

### Base de Datos
- PostgreSQL
- Supabase

### Servicios externos
- Cloudinary
- Resend

## Arquitectura

El sistema utiliza una arquitectura de 3 capas:

1. Presentación (Frontend - Next.js)
2. Lógica de negocio (Backend - NestJS)
3. Acceso a datos (PostgreSQL + Prisma)

## Estructura del proyecto

```text
/
├── ReservaME-frontend/
├── ReservaME-backend/
├── Documentacion/
└── Gestion/
```

## Instalación

### Clonar repositorio

```bash
git clone <url-del-repositorio>
```

### Backend

```bash
cd ReservaME-backend

npm install

npx prisma generate

npx prisma db push

npm run start:dev
```

### Frontend

```bash
cd ReservaME-frontend

npm install

npm run dev
```

## Variables de entorno

### Backend

```env
DATABASE_URL=
JWT_SECRET=
TOKEN_SECRET=
RESEND_API_KEY=
FRONTEND_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend

```env
NEXT_PUBLIC_API_URL=
```

## Estado actual

- Sistema de reservas funcional
- Backend operativo
- Frontend operativo
- Integración con Supabase completada
- Autenticación JWT implementada
- Preparación para despliegue cloud
- Desarrollo de arquitectura Multi-Tenant en progreso

## Autor

Joel Bastián Arancibia Hernández

Analista Programador

Duoc UC
