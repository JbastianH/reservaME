import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

type CloudinaryVariant =
  | 'perfil'
  | 'portafolio'
  | 'productos'
  | 'tenant-logo'
  | 'tenant-hero';

@Injectable()
export class MediaService {
  constructor(private readonly config: ConfigService) {}

  firmarCloudinary(params?: { folder?: string; variant?: CloudinaryVariant }) {
    const cloudName = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.getOrThrow<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');

    const baseFolder =
      this.config.get<string>('CLOUDINARY_FOLDER') ?? 'bawstudio';
    const variant = params?.variant ?? 'perfil';

    let finalFolder = '';
    let eager = '';

    if (variant === 'productos') {
      finalFolder = `${baseFolder}/productos`;
      eager = 'c_limit,w_1000,f_auto,q_auto';
    } else if (variant === 'portafolio') {
      finalFolder = `${baseFolder}/barberos/portafolio`;
      eager = 'c_limit,w_1600,f_auto,q_auto';
    } else if (variant === 'tenant-logo') {
      finalFolder = `${baseFolder}/tenant/logo`;
      eager = 'c_limit,w_512,h_512,f_auto,q_auto';
    } else if (variant === 'tenant-hero') {
      finalFolder = `${baseFolder}/tenant/hero`;
      eager = 'c_limit,w_1920,f_auto,q_auto';
    } else {
      finalFolder = `${baseFolder}/barberos/perfil`;
      eager = 'c_fill,w_512,h_512,g_face,f_auto,q_auto';
    }

    if (params?.folder?.trim()) {
      finalFolder = params.folder.trim();
    }

    const eagerAsync = '0';
    const timestamp = Math.floor(Date.now() / 1000);

    const stringsToJoin = [
      `eager=${eager}`,
      `eager_async=${eagerAsync}`,
      `folder=${finalFolder}`,
      `timestamp=${timestamp}`,
    ];

    const toSign = `${stringsToJoin.join('&')}${apiSecret}`;

    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: finalFolder,
      eager,
      eagerAsync,
      variant,
    };
  }
}
