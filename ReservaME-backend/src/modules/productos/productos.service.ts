import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  // Se inyecta el servicio de Prisma para interactuar con la base de datos
  constructor(private prisma: PrismaService) {}

  // El método crea un nuevo producto en la base de datos desde el panel de administración
  async create(createProductoDto: CreateProductoDto) {
    return this.prisma.producto.create({
      data: createProductoDto,
    });
  }

  // El método recupera todos los productos sin filtros para la tabla del panel de administración
  async findAllAdmin() {
    return this.prisma.producto.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // El método recupera únicamente los productos activos y con stock mayor a cero para la vista pública
  async findAllPublic() {
    return this.prisma.producto.findMany({
      where: {
        stock: { gt: 0 },
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // El método busca un producto específico mediante su ID
  async findOne(id: string) {
    return this.prisma.producto.findUnique({
      where: { id },
    });
  }

  // El método actualiza los datos de un producto existente, como el precio o el stock
  async update(id: string, updateProductoDto: UpdateProductoDto) {
    return this.prisma.producto.update({
      where: { id },
      data: updateProductoDto,
    });
  }

  // El método elimina un producto de la base de datos de forma permanente
  async remove(id: string) {
    return this.prisma.producto.delete({
      where: { id },
    });
  }
}