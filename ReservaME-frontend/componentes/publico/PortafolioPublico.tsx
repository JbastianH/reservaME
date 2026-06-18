"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";
import "photoswipe/dist/photoswipe.css";

type Foto = { id: string; imageUrl: string };
type FotoConDims = Foto & { imageUrl: string; width: number; height: number };
type Props = { fotos: Foto[]; titulo?: string };

function safeImageSrc(src?: string | null) {
  const s = (src ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return null;
}

function cargarDimensiones(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1200, height: 1200 });
    img.src = src;
  });
}

export default function PortafolioLightbox({ fotos, titulo = "Portafolio" }: Props) {
  const [items, setItems] = useState<FotoConDims[]>([]);

  const fotosValidas = useMemo(
    () =>
      fotos
        .map((f) => ({ ...f, imageUrl: safeImageSrc(f.imageUrl) }))
        .filter((f): f is Foto & { imageUrl: string } => !!f.imageUrl),
    [fotos],
  );

  useEffect(() => {
    if (fotosValidas.length === 0) return;
    Promise.all(
      fotosValidas.map(async (f) => {
        const dims = await cargarDimensiones(f.imageUrl);
        return { ...f, ...dims };
      })
    ).then(setItems);
  }, [fotosValidas]);

  if (items.length === 0) return null;

  return (
    <section className="mt-0">
      <div className="flex items-end justify-between gap-3 mb-4">
        <h2 className="text-2xl font-semibold text-white">{titulo}</h2>
        <p className="text-xs text-white/30 tracking-widest uppercase">Click para Pantalla Completa →</p>
      </div>

      <Gallery
        options={{
          bgOpacity: 0.97,
          showHideAnimationType: "zoom",
          zoomAnimationDuration: 500,
          loop: true,
        }}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((f, i) => (
            <Item
              key={f.id}
              original={f.imageUrl}
              thumbnail={f.imageUrl}
              width={f.width}
              height={f.height}
              
            >
              {({ ref, open }) => (
                <button
                  ref={ref as unknown as React.RefObject<HTMLButtonElement>}
                  type="button"
                  onClick={open}
                  className="group relative h-48 w-40 shrink-0 overflow-hidden rounded-2xl bg-neutral-900 focus:outline-none"
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <Image
                    src={f.imageUrl}
                    alt={`Foto ${i + 1}`}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/30 flex items-center justify-center">
                    <span className="text-white/0 group-hover:text-white/90 transition-all duration-300 text-xs tracking-widest uppercase font-medium">
                      Ver
                    </span>
                  </div>
                </button>
              )}
            </Item>
          ))}
        </div>
      </Gallery>

      <style>{`
        .pswp { --pswp-bg: #0a0a0a; }
        .pswp__button { opacity: 0.6; transition: opacity 0.2s ease; }
        .pswp__button:hover { opacity: 1; }
        .pswp__counter {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.4;
          font-weight: 500;
        }
        .pswp__top-bar {
          background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent) !important;
        }
      `}</style>
    </section>
  );
}