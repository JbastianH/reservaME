import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  // Se inyecta el servicio de Prisma para interactuar con la base de datos
  constructor(private prisma: PrismaService) {}

  // El método crea un nuevo producto en la base de datos desde el panel de administración
  async create(tenantId: string, createProductoDto: CreateProductoDto) {
    return this.prisma.producto.create({
      data: {
        ...createProductoDto,
        tenantId,
      },
    });
  }

  // El método recupera todos los productos sin filtros para la tabla del panel de administración
  async findAllAdmin(tenantId: string) {
    return this.prisma.producto.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // El método recupera únicamente los productos activos y con stock mayor a cero para la vista pública
  async findAllPublic(tenantId: string) {
    return this.prisma.producto.findMany({
      where: {
        tenantId,
        stock: { gt: 0 },
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // El método busca un producto específico mediante su ID
  async findOne(tenantId: string, id: string) {
    return this.prisma.producto.findFirst({
      where: {
        id,
        tenantId,
      },
    });
  }

  // El método actualiza los datos de un producto existente, como el precio o el stock
  async update(tenantId: string, id: string, updateProductoDto: UpdateProductoDto) {
    return this.prisma.producto.update({
      where: { id },
      data: updateProductoDto,
    });
  }

  // El método elimina un producto de la base de datos de forma permanente
  async remove(tenantId: string, id: string) {
    return this.prisma.producto.delete({
      where: { id },
    });
  }
}