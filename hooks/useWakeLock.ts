import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

/** 운동 영상 중 화면이 꺼지지 않게 한다. 지원하지 않는 브라우저에서는 아무 일도 하지 않는다. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
        if (nav?.wakeLock?.request) {
          const s = await nav.wakeLock.request('screen');
          if (cancelled) await s.release();
          else sentinel = s;
        }
      } catch {
        // 지원하지 않거나 거부됨: 무시
      }
    };
    void request();

    // 탭이 다시 보이면 잠금이 풀려 있으므로 다시 요청
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') void request();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
