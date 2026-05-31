'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ENDPOINTS, API_CONFIG } from '@/lib/endpoints';
import { BookOpen, Zap, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/protected');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.OAUTH2_GOOGLE}`;
  };

  return (
    <div className="flex min-h-screen w-full font-sans">
      {/* Left Pane */}
      <div className="hidden lg:flex w-1/2 bg-[#0b1021] text-white flex-col px-16 py-20 justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-teal-400" />
          <span className="text-3xl font-bold tracking-tight">EduPulse AI</span>
        </div>
        
        <div className="space-y-10 max-w-xl pb-32">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            당신의 곁을 지키는 나만의 맞춤형 교수
          </h1>
          
          <div className="space-y-6">
            <div className="bg-[#12182b] border border-white/5 p-6 rounded-2xl flex gap-5 items-start">
              <div className="bg-teal-500/10 p-3 rounded-xl shrink-0">
                <Zap className="w-6 h-6 text-teal-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">나만의 강의 튜터</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  강의 중 궁금한 점을 즉시 해결해주는 당신만의 실시간 멘토입니다.
                </p>
              </div>
            </div>
            
            <div className="bg-[#12182b] border border-white/5 p-6 rounded-2xl flex gap-5 items-start">
              <div className="bg-teal-500/10 p-3 rounded-xl shrink-0">
                <BookOpen className="w-6 h-6 text-teal-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">맞춤형 학습 가이드</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  강의 내용을 요약하고 핵심 내용을 정리해 성장을 돕는 맞춤형 가이드를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-8">
        <div className="w-full max-w-[400px] space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">다시 오신 것을 환영합니다</h2>
          </div>
          
          <Button 
            onClick={handleGoogleLogin}
            variant="outline" 
            className="w-full h-14 text-[15px] font-bold bg-white hover:bg-gray-50 border-gray-200 text-gray-700 rounded-xl shadow-sm" 
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google 계정으로 로그인
          </Button>
        </div>
      </div>
    </div>
  );
}
