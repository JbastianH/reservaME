import { Request } from 'express';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    domain: string | null;
  };
}