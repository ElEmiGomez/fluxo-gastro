import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CameraTransform {
  scale?: number;
  translateX?: number;
  translateY?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
}

export interface PhoneFrame916Props {
  children: React.ReactNode;
  camera?: CameraTransform;
  brandAccentColor?: string;
}

export const PhoneFrame916: React.FC<PhoneFrame916Props> = ({
  children,
  camera,
  brandAccentColor = '#2563eb',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle natural floating motion (0.5 degree tilt and 4px floating Y)
  const idleY = Math.sin((frame / fps) * 1.5) * 4;
  const idleRotate = Math.sin((frame / fps) * 1.0) * 0.4;

  const scale = camera?.scale ?? 1;
  const translateX = camera?.translateX ?? 0;
  const translateY = (camera?.translateY ?? 0) + idleY;
  const rotateX = camera?.rotateX ?? 0;
  const rotateY = (camera?.rotateY ?? 0) + idleRotate;
  const rotateZ = camera?.rotateZ ?? 0;

  // Clamped transform string without negative scale bugs
  const clampedScale = Math.max(0.1, scale);
  const transformStyle = `perspective(1600px) translate3d(${translateX}px, ${translateY}px, 0px) scale(${clampedScale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;

  return (
    <div className="relative w-[1080px] h-[1920px] bg-[#070a12] overflow-hidden flex items-center justify-center select-none">
      {/* 1. Cinematic Ambient Background with Dynamic Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 30%, ${brandAccentColor}28 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, #0ea5e915 0%, transparent 50%),
            linear-gradient(180deg, #070a12 0%, #0d121f 50%, #070a12 100%)
          `,
        }}
      />

      {/* Ambient Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* 2. 2.5D Smartphone Container */}
      <div
        style={{
          transform: transformStyle,
          transformStyle: 'preserve-3d',
          transition: 'none', // Strictly no CSS transitions in Remotion
        }}
        className="relative w-[860px] h-[1780px] flex items-center justify-center"
      >
        {/* Smartphone Chassis */}
        <div
          className="relative w-full h-full rounded-[56px] bg-[#121620] p-[10px] border-[3px] border-[#2a3245] ring-1 ring-white/20"
          style={{
            boxShadow: `
              0 30px 80px -15px rgba(0, 0, 0, 0.8),
              0 0 50px -10px ${brandAccentColor}33,
              inset 0 1px 2px rgba(255, 255, 255, 0.25)
            `,
          }}
        >
          {/* Inner Bezel Frame */}
          <div className="relative w-full h-full rounded-[48px] bg-white overflow-hidden flex flex-col shadow-inner">
            {/* Status Bar */}
            <div className="relative w-full h-12 bg-white flex items-center justify-between px-8 pt-2.5 z-40 select-none">
              <span className="font-extrabold text-[15px] text-slate-800 tracking-tight">14:32</span>
              
              {/* Dynamic Island */}
              <div className="w-[180px] h-[30px] bg-black rounded-full flex items-center justify-between px-3 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-[#151515] border border-[#2a2a2a]" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border border-[#222]" />
                </div>
              </div>

              {/* Network / Battery Icons */}
              <div className="flex items-center gap-1.5 text-slate-800">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z" opacity="0.3"/>
                  <path d="M12 6a6 6 0 0 0-6 6c0 1.45.52 2.78 1.38 3.82L12 19l4.62-3.18A5.96 5.96 0 0 0 18 12a6 6 0 0 0-6-6z"/>
                </svg>
                <span className="text-[11px] font-black tracking-wider">5G</span>
                <div className="w-5 h-2.5 border border-slate-800 rounded-[3px] p-[1px] flex items-center">
                  <div className="w-3 h-full bg-slate-800 rounded-[1px]" />
                </div>
              </div>
            </div>

            {/* Screen Content Body */}
            <div className="relative flex-1 w-full overflow-hidden bg-white">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="w-full h-6 bg-white flex items-center justify-center pb-1">
              <div className="w-36 h-1.5 rounded-full bg-slate-300 opacity-70" />
            </div>

            {/* Glass Glare Reflection overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 45%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
