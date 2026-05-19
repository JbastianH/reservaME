import { PartialType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';

// El DTO hereda y vuelve opcionales todos los campos de CreateProductoDto
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}