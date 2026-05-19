import GestionReservaClient from "./GestionReservaClient";

export default async function GestionReservaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <GestionReservaClient token={token} />
    </div>
  );
}