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
    <div className="hidden lg:flex min-h-screen bg-[#f8f9fa]">
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
            <h2 className="mb-6 text-5xl font-black leading-tight">สมัครสมาชิก<br />เพื่อเริ่มต้นใช้งาน</h2>
            <ul className="space-y-3 text-lg text-gray-400">
              <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#ee4d2d]" />ยืม-คืน อุปกรณ์อัตโนมัติ 24 ชม.</li>
              <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#ee4d2d]" />ใช้เพียงบัตรนักศึกษาใบเดียว</li>
              <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#ee4d2d]" />ตรวจสอบประวัติผ่านแอปพลิเคชัน</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative flex w-1/2 items-center justify-center overflow-hidden p-12">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-100 opacity-50 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-100 opacity-50 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-10">
            <h2 className="mb-2 text-4xl font-black text-gray-900">สร้างบัญชีใหม่</h2>
            <p className="text-gray-500">ขั้นตอนที่ 1: กรอกข้อมูลเบื้องต้น</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 p-10 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-white/60" />
            {form}
          </div>
        </div>
      </div>
    </div>
  );
}
