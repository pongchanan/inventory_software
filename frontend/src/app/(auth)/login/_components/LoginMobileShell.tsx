import { Package } from "lucide-react";

export function LoginMobileShell({
  form,
}: {
  form: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] lg:hidden">
      <div className="relative flex w-full items-center justify-center overflow-hidden p-6 sm:p-12">
        <div className="absolute top-0 left-0 -z-10 h-80 w-full origin-top-left -skew-y-6 transform bg-gradient-to-br from-[#ee4d2d] to-[#ff7355]" />
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-100 opacity-50 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-100 opacity-50 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-10 text-center text-white">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-white/30 bg-white/20 shadow-xl backdrop-blur-md">
              <Package className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Smart Inventory</h1>
            <p className="mt-2 text-white/80">Sign in to the system</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-white/60" />
            {form}
          </div>
        </div>
      </div>
    </div>
  );
}
