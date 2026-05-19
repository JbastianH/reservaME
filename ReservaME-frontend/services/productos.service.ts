import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

// Se define la interfaz del producto para mantener el tipado estricto en la aplicación.
export type PublicProductoItem = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// La función solicita el listado de productos habilitados para la vista del cliente.
export function listarProductosPublico() {
  return apiGet<PublicProductoItem[]>('/productos/public', { auth: false });
}

// La función recupera el inventario completo, incluyendo elementos inactivos, para el panel de gestión.
export function listarProductosAdmin() {
  return apiGet<PublicProductoItem[]>('/productos/admin', { auth: true });
}

// La función envía la carga útil para registrar un nuevo producto en el sistema.
export function crearProductoAdmin(datos: Omit<PublicProductoItem, 'id' | 'createdAt' | 'updatedAt'>) {
  return apiPost<PublicProductoItem>('/productos', datos, { auth: true });
}

// La función transmite los cambios específicos para modificar un registro existente en la base de datos.
export function actualizarProductoAdmin(id: string, datos: Partial<PublicProductoItem>) {
  return apiPatch<PublicProductoItem>(`/productos/${id}`, datos, { auth: true });
}

// La función emite la instrucción para eliminar de forma permanente un producto del sistema.
export function eliminarProductoAdmin(id: string) {
  return apiDelete<any>(`/productos/${id}`, { auth: true });
}

// La función recupera la información detallada de un producto específico mediante su identificador único.
export function obtenerProductoAdmin(id: string) {
  return apiGet<PublicProductoItem>(`/productos/${id}`, { auth: true });
}