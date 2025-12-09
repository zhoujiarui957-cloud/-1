import React, { useState } from 'react';
import { ShapeType } from '../types';

interface ControlsProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  color: string;
  setColor: (c: string) => void;
  gestureData: { isDetected: boolean; isOpen: boolean };
}

const predefinedColors = [
  '#ff4d6d', // Pink/Red
  '#4dabf7', // Blue
  '#69db7c', // Green
  '#ffd43b', // Yellow
  '#e599f7', // Purple
  '#ffffff', // White
];

export const Controls: React.FC<ControlsProps> = ({ 
  currentShape, 
  setShape, 
  color, 
  setColor,
  gestureData 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-full pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-xl">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Gesture Particles
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
            {gestureData.isDetected 
              ? <span className="text-green-400">● Hand Detected</span>
              : <span className="text-yellow-400">● Waiting for hand...</span>
            }
          </p>
           <div className="text-[10px] text-gray-500 mt-2 space-y-1">
             <p>✊ <span className="text-gray-300">Closed Hand</span> = Form Shape</p>
             <p>🖐️ <span className="text-gray-300">Open Hand</span> = Explode</p>
             <p>☝️ <span className="text-gray-300">One Finger</span> = Move Shape</p>
           </div>
        </div>

        <button 
          onClick={toggleFullscreen}
          className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          )}
        </button>
      </div>

      {/* Main Controls Bottom */}
      <div className="pointer-events-auto self-center mb-8 bg-black/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl w-full max-w-2xl animate-fade-in-up">
        
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            
            {/* Shapes */}
            <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Models</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.values(ShapeType).map((s) => (
                        <button
                            key={s}
                            onClick={() => setShape(s)}
                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                                currentShape === s 
                                ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                                : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] md:w-[1px] md:h-12 bg-white/10"></div>

            {/* Colors */}
            <div className="flex flex-col items-center md:items-start">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Color</label>
                <div className="flex gap-3">
                    {predefinedColors.map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                color === c ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                        />
                    ))}
                    {/* Custom Color Input Wrapper */}
                    <div className="relative group w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer hover:border-white">
                        <input 
                            type="color" 
                            value={color} 
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                        />
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-white text-[10px]">+</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};