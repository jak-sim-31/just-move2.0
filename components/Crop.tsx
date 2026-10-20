import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * 방울토마토 성장 그림.
 * stage 0~6 (사용한 물방울 수). 7번째 물주기에 수확하므로 화면에는 0~6만 나온다.
 * 앱의 색상(밝은 배경, 네이비·오렌지 포인트)에 맞춘 단순한 면 그림이다.
 * 이미지 파일을 받으면 이 컴포넌트만 교체하면 된다.
 */
const LEAF = '#4FAE7B';
const LEAF_DARK = '#3A8F63';
const STEM = '#3F9A6B';
const SOIL = '#B98A5E';
const SOIL_DARK = '#A07548';
const FRUIT_GREEN = '#8CCB6A';
const FRUIT_ORANGE = '#F5A623';
const FRUIT_RED = '#E5533D';

function Leaf({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <Path d="M0 0 C 10 -14 26 -14 32 0 C 26 12 10 12 0 0 Z" fill={LEAF} />
      <Path d="M2 0 L 28 0" stroke={LEAF_DARK} strokeWidth={1.5} strokeLinecap="round" />
    </G>
  );
}

function Fruit({ x, y, color, r = 9 }: { x: number; y: number; color: string; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={color} />
      <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.22} fill="#FFFFFF" opacity={0.45} />
      <Path
        d={`M${x - 4} ${y - r + 1} L${x} ${y - r - 3} L${x + 4} ${y - r + 1}`}
        stroke={LEAF_DARK}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

export function Crop({ stage, size = 140 }: { stage: number; size?: number }) {
  const s = Math.max(0, Math.min(6, Math.floor(stage)));
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="방울토마토">
      {/* 흙 */}
      <Ellipse cx={60} cy={104} rx={38} ry={9} fill={SOIL_DARK} />
      <Path d="M24 104 C 30 90 90 90 96 104 Z" fill={SOIL} />

      {s === 0 ? (
        <G>
          <Ellipse cx={60} cy={95} rx={5} ry={3} fill={SOIL_DARK} />
          <Circle cx={60} cy={92} r={2.2} fill="#E8D8A8" />
        </G>
      ) : null}

      {s >= 1 ? (
        <G>
          <Rect x={58.5} y={s === 1 ? 78 : s === 2 ? 64 : 40} width={3} height={s === 1 ? 20 : s === 2 ? 34 : 58} rx={1.5} fill={STEM} />
        </G>
      ) : null}

      {s === 1 ? (
        <G>
          <Leaf x={60} y={80} r={-35} s={0.6} />
          <Leaf x={60} y={80} r={-145} s={0.6} />
        </G>
      ) : null}

      {s === 2 ? (
        <G>
          <Leaf x={60} y={68} r={-30} s={0.8} />
          <Leaf x={60} y={68} r={-150} s={0.8} />
          <Leaf x={60} y={78} r={-10} s={0.6} />
        </G>
      ) : null}

      {s >= 3 ? (
        <G>
          <Leaf x={60} y={86} r={-15} s={0.9} />
          <Leaf x={60} y={86} r={-165} s={0.9} />
          <Leaf x={60} y={68} r={-35} s={1} />
          <Leaf x={60} y={68} r={-145} s={1} />
          <Leaf x={60} y={50} r={-40} s={0.9} />
          <Leaf x={60} y={50} r={-140} s={0.9} />
          <Leaf x={60} y={38} r={-90} s={0.7} />
        </G>
      ) : null}

      {s === 4 ? (
        <G>
          <Circle cx={84} cy={62} r={4} fill="#FFD76A" />
          <Circle cx={36} cy={72} r={4} fill="#FFD76A" />
          <Circle cx={60} cy={34} r={3.5} fill="#FFD76A" />
        </G>
      ) : null}

      {s === 5 ? (
        <G>
          <Fruit x={86} y={66} color={FRUIT_GREEN} r={7} />
          <Fruit x={34} y={76} color={FRUIT_GREEN} r={7} />
          <Fruit x={64} y={44} color={FRUIT_GREEN} r={6} />
        </G>
      ) : null}

      {s === 6 ? (
        <G>
          <Fruit x={87} y={68} color={FRUIT_ORANGE} r={9} />
          <Fruit x={33} y={78} color={FRUIT_RED} r={9} />
          <Fruit x={66} y={46} color={FRUIT_ORANGE} r={8} />
          <Fruit x={48} y={60} color={FRUIT_RED} r={7} />
        </G>
      ) : null}
    </Svg>
  );
}

export function Tomato({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Fruit x={15} y={17} color={FRUIT_RED} r={11} />
    </Svg>
  );
}
