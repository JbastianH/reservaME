"use client";

export default function TestCarrusel({ productos }: { productos: any[] }) {
  return <div style={{ color: "white" }}>test: {productos.length}</div>;
}