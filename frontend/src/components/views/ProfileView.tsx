import { ChevronRight, Box, AlertTriangle } from 'lucide-react';
import { User } from '../../domain/models/Item';

interface ProfileViewProps {
    user: User | null;
}

export function ProfileView({ user }: ProfileViewProps) {
    if (!user) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full pt-20">
                <div className="animate-pulse w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
                <div className="animate-pulse h-4 bg-gray-200 w-32 rounded mb-2"></div>
                <div className="animate-pulse h-3 bg-gray-200 w-24 rounded"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col items-center mb-10 pt-4">
                <div className="w-28 h-28 bg-gradient-to-br from-[#ee4d2d] to-[#ff7355] rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-orange-200 mb-4 border-4 border-white">
                    {user.initial}
                </div>
                <h2 className="font-bold text-xl text-gray-800">{user.name}</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">รหัสนักศึกษา: {user.studentId}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button className="w-full p-4 flex items-center justify-between border-b hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500">
                            <Box size={20} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">จัดการ RFID ของฉัน (M3)</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </button>

                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">ประวัติของเสียหาย (M4)</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </button>
            </div>
        </div>
    );
}
