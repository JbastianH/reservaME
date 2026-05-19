export type Resena = {
  id: string;
  rating: number;
  comment?: string | null;
  visible: boolean;
  createdAt: string; // ISO
};