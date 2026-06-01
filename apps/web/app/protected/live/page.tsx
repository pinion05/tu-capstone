'use client';

import { useRouter } from 'next/navigation';
import LiveLectureRoom from '@/components/LiveLectureRoom';

export default function LiveLecturePage() {
  const router = useRouter();

  return <LiveLectureRoom onEnd={() => router.push('/protected')} />;
}
