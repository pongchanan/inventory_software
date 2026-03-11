import { Package } from "lucide-react";
import Image from "next/image";

export function LoginDesktopShell({
  form,
}: {
  form: React.ReactNode;
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
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <Package size={24} className="text-[#ee4d2d]" />
            </div>
            <h1 className="text-2xl font-black uppercase leading-none tracking-tight">
              Smart
              <br />
              <span className="text-gray-400">Inventory</span>
            </h1>
          </div>

          <div className="max-w-lg">
            <h2 className="mb-6 text-5xl font-black leading-tight">
              ระบบจัดการ
              <br />
              ยืมคืนอุปกรณ์ IoT
            </h2>
            <p className="text-lg leading-relaxed text-gray-400">
              ระบบลงทะเบียน ยืม และ คืน อุปกรณ์อัตโนมัติ ใช้งานง่าย
              รองรับการยืนยันตัวตนด้วยบัตรนักศึกษา และการแจ้งเตือนแบบเรียลไทม์
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex w-1/2 items-center justify-center overflow-hidden p-12">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-100 opacity-50 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-100 opacity-50 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-10">
            <h2 className="mb-2 text-4xl font-black text-gray-900">ยินดีต้อนรับกลับ! 👋</h2>
            <p className="text-gray-500">กรุณาลงชื่อเข้าใช้เพื่อจัดการระบบ</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 p-10 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-white/60" />
            {form}
          </div>

          <div className="mt-8 space-x-1 text-center text-sm">
            <span className="font-medium text-gray-500">พบปัญหา?</span>
            <a href="#" className="font-bold text-[#ee4d2d] hover:underline">
              ติดต่อผู้ดูแลระบบ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
