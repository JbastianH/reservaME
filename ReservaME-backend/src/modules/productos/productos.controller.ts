import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // El endpoint recibe los datos validados y crea un nuevo producto para el tenant actual
  @Post()
  create(@Req() req: TenantRequest, @Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(req.tenant!.id, createProductoDto);
  }

  // El endpoint devuelve los productos con stock y activos para la vista del cliente en la web
  @Get('public')
  findAllPublic(@Req() req: TenantRequest) {
    return this.productosService.findAllPublic(req.tenant!.id);
  }

  // El endpoint devuelve todos los productos para la tabla del panel de administración
  @Get('admin')
  findAllAdmin(@Req() req: TenantRequest) {
    return this.productosService.findAllAdmin(req.tenant!.id);
  }

  // El endpoint devuelve un producto específico mediante su ID dentro del tenant actual
  @Get(':id')
  findOne(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.productosService.findOne(req.tenant!.id, id);
  }

  // El endpoint actualiza la información de un producto existente dentro del tenant actual
  @Patch(':id')
  update(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(req.tenant!.id, id, updateProductoDto);
  }

  // El endpoint elimina un producto del catálogo de la base de datos dentro del tenant actual
  @Delete(':id')
  remove(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.productosService.remove(req.tenant!.id, id);
  }
}