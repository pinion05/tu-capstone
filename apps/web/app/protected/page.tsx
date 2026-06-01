'use client';

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardOverview() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 min-h-[75vh]">
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-10">
        
        {/* Welcome Icon */}
        <div className="w-[72px] h-[72px] bg-[#61efce] rounded-full flex items-center justify-center shadow-sm relative">
          <svg className="w-9 h-9 text-teal-950 absolute top-[18px] left-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v4"/>
            <path d="M10 11V4a2 2 0 0 0-4 0v12"/>
            <path d="M6 16c-3 0-4-3-4-3l2-2c1-1 3-1 4 0l1 1"/>
            <path d="M22 15c0 3-3 6-7 6-4 0-6-1.5-6-3"/>
          </svg>
          <div className="absolute top-1 right-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal-950/20">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-5">
          <h1 className="text-[40px] font-extrabold text-[#111827] tracking-tight">
            반가워요! 첫 강의를 시작해볼까요?
          </h1>
          <p className="text-[17px] text-[#4b5563] font-medium">
            AI가 강의 내용을 분석하고 핵심을 요약해 드립니다. 지금 바로 시작해보세요.
          </p>
        </div>

        {/* Start Card */}
        <button
          type="button"
          onClick={() => router.push("/protected/live")}
          className="w-full max-w-[600px] mt-10 cursor-pointer bg-white border border-[#e5e7eb]/80 rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 group py-14 flex flex-col items-center justify-center space-y-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#61efce]/40"
          aria-label="새 강의 시작하기"
        >
          <div className="bg-[#0b1021] text-white p-3.5 rounded-full group-hover:scale-105 transition-transform duration-200">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-[19px] font-bold text-[#111827]">새 강의 시작하기</h3>
            <p className="text-[15px] text-[#6b7280] font-medium">동영상 링크나 문서를 업로드하세요</p>
          </div>
        </button>
      </div>
    </div>
  );
}
