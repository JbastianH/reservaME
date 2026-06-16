import { headers } from "next/headers";
import DejarResenaClient from "./DejarResenaClient";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";
import Reveal from "@/componentes/animaciones/Reveal";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const requestHeaders = await headers();
  const tenantHost = requestHeaders.get("host");

  const tenant = await obtenerTenantPublico(tenantHost);

  const settings = tenant.settings;

  const backgroundColor = settings.primaryColor || "#000000";
  const secondaryColor = settings.secondaryColor || "#ffffff";
  const fontFamilyTenant = obtenerVariableFuente(settings.fontFamily);

  return (
    <main
      className="relative min-h-[calc(100vh-8rem)] overflow-hidden px-4 py-10 font-sans"
      style={{ backgroundColor }}
    >
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${secondaryColor}25` }}
      />

      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${secondaryColor}18` }}
      />

      <Reveal delay={0.1} direction="up">
        <section className="relative mx-auto w-full max-w-2xl">
          <div
            className="relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8"
            style={{
              background: "linear-gradient(135deg, rgba(10,10,10,0.92), rgba(38,38,38,0.86))",
              borderColor: `${secondaryColor}55`,
            }}
          >
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
              style={{ backgroundColor: `${secondaryColor}33` }}
            />

            <div
              className="relative mb-6 h-1 w-24 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />

            <div className="relative">
              <DejarResenaClient
                token={token}
                secondaryColor={secondaryColor}
                fontFamilyTenant={fontFamilyTenant}
              />
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
