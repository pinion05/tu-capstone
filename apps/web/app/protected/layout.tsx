'use client';

import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  HelpCircle,
  Zap,
  PlusCircle,
  Bell,
  Radio,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full bg-[#fcfdfd] font-sans">
        
        {/* Sidebar */}
        <aside className="hidden w-[280px] shrink-0 border-r border-gray-100 bg-white md:flex flex-col h-screen overflow-y-auto">
          {/* Logo */}
          <div className="p-6 pb-8 flex items-center gap-3 font-extrabold text-xl tracking-tight text-gray-900">
            <div className="bg-[#0b1021] text-white p-1.5 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            에듀펄스 AI
          </div>

          <div className="px-5 pb-6">
            <Button
              type="button"
              onClick={() => router.push("/protected/live")}
              className="w-full bg-[#0b1021] hover:bg-[#0b1021]/90 text-white justify-start relative h-[52px] rounded-xl shadow-md"
            >
              <PlusCircle className="mr-3 h-[18px] w-[18px]" />
              <span className="font-bold text-[15px]">새 강의 시작</span>
              <span className="absolute right-4 text-[11px] text-white/50 font-medium">Ctrl+N</span>
            </Button>
          </div>

          <nav className="flex-1 px-3 space-y-8">
            <div className="space-y-1">
              <Link
                href="/protected"
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold transition-all ${
                  pathname === '/protected' 
                    ? "bg-[#f1f3f5] text-gray-900" 
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard className="h-[18px] w-[18px]" />
                대시보드
              </Link>
              <Link
                href="/protected/live"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                <Radio className="h-[18px] w-[18px]" />
                실시간 강의
              </Link>
            </div>

            <div className="space-y-3 px-2">
              <div>
                <h4 className="px-2 text-xs font-bold text-gray-400 mb-2">오늘</h4>
                <div className="space-y-0.5">
                  <div className="px-2 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 cursor-pointer truncate transition-colors">고급 기계학습론 - 5주차</div>
                  <div className="px-2 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 cursor-pointer truncate transition-colors">데이터 마이닝 실습</div>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="px-2 text-xs font-bold text-gray-400 mb-2">어제</h4>
                <div className="space-y-0.5">
                  <div className="px-2 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 cursor-pointer truncate transition-colors">알고리즘 분석 4차</div>
                  <div className="px-2 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 cursor-pointer truncate transition-colors">인공지능 윤리 토론</div>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="px-2 text-xs font-bold text-gray-400 mb-2">지난 7일</h4>
                <div className="space-y-0.5">
                  <div className="px-2 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 cursor-pointer truncate transition-colors">확률과 통계 기초</div>
                  <div className="px-2 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 cursor-pointer truncate transition-colors">컴퓨터 비전 입문</div>
                </div>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-1">
            <Link
              href="/protected/settings"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Settings className="h-5 w-5" />
              설정
            </Link>
            <Link
              href="/protected/support"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <HelpCircle className="h-5 w-5" />
              고객 센터
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="flex items-center justify-end h-20 px-8 gap-5 shrink-0">
            <button className="text-gray-400 hover:text-gray-900 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            
            <button onClick={() => logout()} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <UserIcon className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
