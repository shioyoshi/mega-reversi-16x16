import React from 'react';
import { FloatingText } from '../types/game';

interface FloatingNumbersProps {
  floatingTexts: FloatingText[];
}

export const FloatingNumbers: React.FC<FloatingNumbersProps> = ({ floatingTexts }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="absolute animate-float font-black text-sm font-display select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            color: item.color || '#38bdf8',
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
