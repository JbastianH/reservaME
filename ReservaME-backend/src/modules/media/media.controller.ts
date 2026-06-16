import { Body, Controller, Post } from '@nestjs/common';
import { Auth } from '../../common/decorators/auth.decorator';
import { MediaService } from './media.service';

type CloudinaryVariant =
  | 'perfil'
  | 'portafolio'
  | 'productos'
  | 'tenant-logo'
  | 'tenant-hero';

@Auth('BARBERO', 'ADMIN')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('cloudinary/sign')
  signCloudinary(
    @Body()
    body: {
      folder?: string;
      variant?: CloudinaryVariant;
    },
  ) {
    return this.mediaService.firmarCloudinary(body);
  }
}
