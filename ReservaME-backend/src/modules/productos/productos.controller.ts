import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // El endpoint recibe los datos validados y crea un nuevo producto
  @Post()
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  // El endpoint devuelve los productos con stock y activos para la vista del cliente en la web
  @Get('public')
  findAllPublic() {
    return this.productosService.findAllPublic();
  }

  // El endpoint devuelve todos los productos para la tabla del panel de administración
  @Get('admin')
  findAllAdmin() {
    return this.productosService.findAllAdmin();
  }

  // El endpoint devuelve un producto específico mediante su ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(id);
  }

  // El endpoint actualiza la información de un producto existente
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productosService.update(id, updateProductoDto);
  }

  // El endpoint elimina un producto del catálogo de la base de datos
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productosService.remove(id);
  }
}