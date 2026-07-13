interface MemberPortalProps {
  subscriber: any;
}

export default function MemberPortal({
  subscriber,
}: MemberPortalProps) {
  return (
    <main className="min-h-screen bg-slate-100 p-10">

      <div className="mx-auto max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">

        <div className="bg-[#1E2D5A] p-10 text-center text-white">

          <img
            src="/AustraliaNewZealand-02.png"
            alt="ASFP"
            className="mx-auto h-36 w-auto"
          />

          <h1 className="mt-6 text-4xl font-bold">
            Welcome
          </h1>

          <p className="mt-3 text-2xl">
            {subscriber.name}
          </p>

          <p className="text-slate-300">
            {subscriber.company}
          </p>

        </div>

        <div className="p-10">

          <p className="text-lg">
            Member Portal
          </p>

        </div>

      </div>

    </main>
  );
}