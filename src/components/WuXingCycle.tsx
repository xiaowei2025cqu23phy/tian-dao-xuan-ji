import React from 'react';
import { motion } from 'motion/react';

interface WuXingProps {
  elements: Record<string, number>;
  strengths?: Record<string, string>;
}

export function WuXingCycle({ elements, strengths }: WuXingProps) {
  const elementColors: Record<string, string> = {
    '木': '#2d5a27', // Forest Green
    '火': '#c23b22', // Vermilion
    '土': '#7c512d', // Earth Ochre
    '金': '#8a8a8a', // Silver Gray
    '水': '#1e3a8a', // Deep Azure
  };

  const elementOrder = ['木', '火', '土', '金', '水'];
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  const getPos = (index: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const positions = elementOrder.map((_, i) => getPos(i));

  // Determine dominant and weak elements
  const sorted = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const weakest = sorted[sorted.length - 1][0];

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-white/30 backdrop-blur-sm rounded-full border border-ink-black/5 shadow-inner p-8">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <div className="text-[120px] font-brush">五行</div>
      </div>

      <svg viewBox="0 0 300 300" className="w-full h-full relative z-10 drop-shadow-sm">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <marker id="arrow-gen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,0,0,0.2)" />
          </marker>
        </defs>

        {/* Constructive Cycle (Flowing Arrows) */}
        {elementOrder.map((_, i) => {
          const next = (i + 1) % 5;
          const p1 = positions[i];
          const p2 = positions[next];
          
          // Outer arc path
          const midAngle = (i * 72 + 36 - 90) * (Math.PI / 180);
          const controlR = radius + 20;
          const cx_mid = centerX + controlR * Math.cos(midAngle);
          const cy_mid = centerY + controlR * Math.sin(midAngle);

          const pathD = `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}`;
          
          return (
            <g key={`const-${i}`}>
              <path
                d={pathD}
                fill="none"
                stroke={elementColors[elementOrder[i]]}
                strokeWidth="1.5"
                strokeDasharray="4 2"
                className="opacity-20"
                markerEnd="url(#arrow-gen)"
              />
              <motion.circle
                r="3"
                fill={elementColors[elementOrder[i]]}
                animate={{
                  offsetDistance: ["0%", "100%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.8
                }}
                style={{
                  offsetPath: `path("${pathD}")`,
                  filter: 'url(#glow)'
                }}
              />
            </g>
          );
        })}

        {/* Destructive Cycle (Lines Across) */}
        {elementOrder.map((_, i) => {
          const target = (i + 2) % 5;
          const p1 = positions[i];
          const p2 = positions[target];
          
          return (
            <g key={`dest-${i}`}>
              <motion.line
                x1={p1.x} y1={p1.y}
                x2={p2.x} y2={p2.y}
                stroke="#000"
                strokeWidth="0.5"
                strokeDasharray="1 4"
                initial={{ opacity: 0.1 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, delay: i * 1 }}
              />
            </g>
          );
        })}

        {/* Element Nodes */}
        {elementOrder.map((name, i) => {
          const pos = positions[i];
          const strengthVal = elements[name] || 0;
          const size = 22 + (strengthVal / 8) * 18;
          
          const strengthText = strengths?.[name];
          const isDominant = strengthText === '旺';
          const isStrong = strengthText === '相';
          const hasHalo = isDominant || isStrong;

          return (
            <g key={name} className="group cursor-help">
              {/* Outer Glow Halo */}
              {hasHalo && (
                <motion.circle
                  cx={pos.x} cy={pos.y}
                  r={size + 12}
                  fill={isDominant ? 'rgba(194, 59, 34, 0.15)' : 'rgba(0, 0, 0, 0.05)'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: isDominant ? 2 : 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              )}

              <motion.circle
                cx={pos.x} cy={pos.y}
                r={size}
                fill="white"
                stroke={elementColors[name]}
                strokeWidth={hasHalo ? "3" : "2"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="shadow-sm"
              />
              <motion.circle
                cx={pos.x} cy={pos.y}
                r={size - 4}
                fill={elementColors[name]}
                className="opacity-10 group-hover:opacity-30 transition-opacity"
              />
              
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-brush text-xl select-none"
                fill={elementColors[name]}
              >
                {name}
              </text>

              {/* Character labels for Dominant/Strong/Weakest */}
              {strengthText && (
                <g>
                  {isDominant && (
                    <circle
                      cx={pos.x} cy={pos.y}
                      r={size + 6}
                      fill="none"
                      stroke={elementColors[name]}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="animate-[spin_15s_linear_infinite] opacity-40"
                    />
                  )}
                  <rect 
                    x={pos.x - 12} y={pos.y + size + 2} 
                    width="24" height="12" 
                    rx="2" 
                    fill={isDominant ? elementColors[name] : (isStrong ? '#2d5a27' : 'gray')} 
                    className={strengthText === '死' || strengthText === '囚' ? 'opacity-40' : 'opacity-80'}
                  />
                  <text 
                    x={pos.x} y={pos.y + size + 11} 
                    textAnchor="middle" 
                    fill="white" 
                    className="text-[8px] font-bold"
                  >
                    {strengthText}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-[1.5px] border-t border-dashed border-ink-black/40" />
          <span className="text-[10px] tracking-widest opacity-40 uppercase font-bold">相生 (Generation)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-[1px] bg-ink-black/10" />
          <span className="text-[10px] tracking-widest opacity-40 uppercase font-bold">相克 (Control)</span>
        </div>
      </div>
    </div>
  );
}
