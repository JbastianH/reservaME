export type Barbero = {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
};