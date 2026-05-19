// app/(publico)/layout.tsx
import Header from "@/componentes/layout/Header";
import Footer from "@/componentes/layout/Footer";
import { SesionProvider } from "@/context/SesionProvider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SesionProvider>
      <Header />
      <main className="pt-20 bg-black">{children}</main>
      <Footer />
    </SesionProvider>
  );
}