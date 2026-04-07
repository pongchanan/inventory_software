import { UserPlus } from "lucide-react";

export function RegisterMobileShell({
  form,
  onLogoClick,
}: {
  form: React.ReactNode;
  onLogoClick: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 lg:hidden">
      <div className="relative w-full flex-col items-center justify-start overflow-y-auto py-16 px-6 sm:px-12 min-h-screen flex">
        <div className="absolute top-0 left-0 -z-10 w-full h-full origin-top-left bg-gradient-to-br from-[#ee4d2d]/20 to-[#ff7355]/10" />
        <div className="pointer-events-none fixed -top-20 -right-20 h-96 w-96 rounded-full bg-orange-400 opacity-70 blur-[100px]" />
        <div className="pointer-events-none fixed -bottom-20 -left-20 h-96 w-96 rounded-full bg-orange-300 opacity-50 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md pb-12">
          <div className="mb-8 text-center text-white">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-white/30 bg-white/20 shadow-xl backdrop-blur-md" onClick={onLogoClick}>
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Register</h1>
            <p className="mt-2 text-white/90">Registration System (1/2)</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border-2 border-white/60 bg-white/95 p-8 shadow-2xl backdrop-blur-md bg-gradient-to-br from-white to-orange-50/30 sm:p-10">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-white/60" />
            {form}
          </div>
        </div>
      </div>
    </div>
  );
}
