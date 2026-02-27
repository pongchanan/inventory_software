import { Home, Package, User } from 'lucide-react';

export type TabType = 'home' | 'borrowed' | 'profile';

interface BottomNavProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    borrowedCount: number;
}

export function BottomNav({ activeTab, setActiveTab, borrowedCount }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t flex justify-around items-center py-3 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40">
            <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'home' ? 'text-[#ee4d2d]' : 'text-gray-300'}`}
            >
                <Home size={22} className={activeTab === 'home' ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">หน้าหลัก</span>
            </button>

            <button
                onClick={() => setActiveTab('borrowed')}
                className={`flex flex-col items-center gap-1 flex-1 relative ${activeTab === 'borrowed' ? 'text-[#ee4d2d]' : 'text-gray-300'}`}
            >
                <Package size={22} className={activeTab === 'borrowed' ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">ของที่ยืม</span>
                {borrowedCount > 0 && (
                    <span className="absolute -top-1 right-5 bg-[#ee4d2d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        {borrowedCount}
                    </span>
                )}
            </button>

            <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'profile' ? 'text-[#ee4d2d]' : 'text-gray-300'}`}
            >
                <User size={22} className={activeTab === 'profile' ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">โปรไฟล์</span>
            </button>
        </nav>
    );
}
