import { useEffect } from 'react';
import type { VideoSurfaceProps } from './VideoSurface.types';

/**
 * 네이티브: 아직 영상 플레이어를 붙이지 않았으므로 바로 임시 재생 모드로 넘긴다.
 * (v1.0은 웹앱 기준. 네이티브 지원 시 expo-video로 교체)
 */
export default function VideoSurface({ onFail }: VideoSurfaceProps) {
  useEffect(() => {
    onFail();
  }, [onFail]);
  return null;
}
