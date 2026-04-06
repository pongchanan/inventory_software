import { Package } from "lucide-react";
import Image from "next/image";

export function RegisterDesktopShell({
  form,
  onLogoClick,
}: {
  form: React.ReactNode;
  onLogoClick: () => void;
}) {
  return (
    <div className="hidden lg:flex min-h-screen bg-gradient-to-b from-orange-50 to-orange-100/50">
      <div className="relative lg:w-1/2 overflow-hidden bg-gray-900 p-12 text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
            alt="Laboratory equipment"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex cursor-pointer items-center gap-3" onClick={onLogoClick}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20">
              <Package size={24} className="text-[#ee4d2d]" />
            </div>
            <h1 className="text-2xl font-black uppercase leading-none tracking-tight">
              Smart
              <br />
              <span className="text-gray-400">Inventory</span>
            </h1>
          </div>

          <div className="max-w-lg">
            <h2 className="mb-6 text-5xl font-black leading-tight">Create Account<br />to Get Started</h2>
            <ul className="space-y-3 text-lg text-gray-400">
              <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#ee4d2d]" />Automatic equipment lending 24/7</li>
              <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#ee4d2d]" />Use only your student card</li>
              <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#ee4d2d]" />Check history via app</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative flex w-1/2 items-center justify-center overflow-hidden p-12 bg-gradient-to-br from-[#fff5f0] via-[#ffe8dc] to-[#ffd4b8]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-400/20 to-orange-500/10" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-orange-300 opacity-60 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-orange-200 opacity-40 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-10">
            <h2 className="mb-2 text-4xl font-black text-gray-900">Create Your Account</h2>
            <p className="text-gray-600">Step 1: Enter basic information</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border-2 border-white/60 bg-white/95 p-10 shadow-2xl backdrop-blur-md bg-gradient-to-br from-white to-orange-50/30">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-white/60" />
            {form}
          </div>
        </div>
      </div>
    </div>
  );
}
