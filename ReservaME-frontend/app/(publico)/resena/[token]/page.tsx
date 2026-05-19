import DejarResenaClient from "./DejarResenaClient";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <section className="mx-auto w-full max-w-2xl p-4">
      <DejarResenaClient token={token} />
    </section>
  );
}