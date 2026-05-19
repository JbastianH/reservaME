import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: AdminCreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existe = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existe)
      throw new BadRequestException('Ya existe un usuario con ese correo.');

    return this.prisma.user.create({
      data: {
        email,
        role: dto.role,
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
