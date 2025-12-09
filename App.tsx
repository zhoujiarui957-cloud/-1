import React, { useState, useRef } from 'react';
import { ParticleScene } from './components/ParticleScene';
import { HandTracker } from './components/HandTracker';
import { Controls } from './components/Controls';
import { ShapeType, HandGestureData } from './types';

function App() {
  const [currentShape, setShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#ff4d6d');
  const [debugData, setDebugData] = useState<{ isDetected: boolean; isOpen: boolean }>({ isDetected: false, isOpen: true });

  // Use a ref for high-frequency gesture data to avoid re-rendering React tree on every frame
  const gestureRef = useRef<HandGestureData>({
    isOpen: true,
    openness: 0,
    position: { x: 0, y: 0 },
    isDetected: false,
    isPointing: false,
    pointerPosition: { x: 0, y: 0 }
  });

  const handleGestureUpdate = (data: HandGestureData) => {
    // Update the ref for the 3D loop
    gestureRef.current = data;
    
    // Update state for UI feedback (throttled conceptually, but here just checking detection changes is light enough)
    if (data.isDetected !== debugData.isDetected || (data.isDetected && Math.abs(data.openness - (debugData.isOpen ? 1 : 0)) > 0.5)) {
        setDebugData({
            isDetected: data.isDetected,
            isOpen: data.openness > 0.5
        });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      
      {/* 3D Layer */}
      <div className="absolute inset-0 z-0">
        <ParticleScene 
          shape={currentShape} 
          color={color} 
          gestureRef={gestureRef}
        />
      </div>

      {/* Logic Layer */}
      <HandTracker 
        onGestureUpdate={handleGestureUpdate} 
        showDebug={true} // Show the small debug video in top right
      />

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Controls 
            currentShape={currentShape}
            setShape={setShape}
            color={color}
            setColor={setColor}
            gestureData={debugData}
        />
      </div>
      
    </div>
  );
}

export default App;