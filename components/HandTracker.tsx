import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { HandGestureData } from '../types';

interface HandTrackerProps {
  onGestureUpdate: (data: HandGestureData) => void;
  showDebug?: boolean;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onGestureUpdate, showDebug = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        if (!mounted) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        if (!mounted) return;
        landmarkerRef.current = landmarker;
        startCamera();
      } catch (err) {
        console.error("Error initializing MediaPipe:", err);
        setError("Failed to load hand tracking AI.");
        setLoading(false);
      }
    };

    setupMediaPipe();

    return () => {
      mounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied or unavailable.");
      setLoading(false);
    }
  };

  const predictWebcam = () => {
    if (!landmarkerRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Set canvas dimensions to match video
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const startTimeMs = performance.now();
    const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    let gestureData: HandGestureData = {
        isOpen: true,
        openness: 0,
        position: { x: 0, y: 0 },
        isDetected: false,
        isPointing: false,
        pointerPosition: { x: 0, y: 0 }
    };

    if (results.landmarks && results.landmarks.length > 0) {
      // Logic for first detected hand
      const landmarks = results.landmarks[0];
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];

      // --- 1. Fist/Open Detection ---
      const palmSize = Math.sqrt(
        Math.pow(wrist.x - middleMCP.x, 2) + 
        Math.pow(wrist.y - middleMCP.y, 2)
      );

      const fingerTips = [8, 12, 16, 20];
      let totalTipDist = 0;
      fingerTips.forEach(idx => {
        const tip = landmarks[idx];
        const dist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
        totalTipDist += dist;
      });
      
      const avgTipDist = totalTipDist / 4;
      const extensionRatio = avgTipDist / (palmSize || 1);
      const normalizedOpenness = Math.min(Math.max((extensionRatio - 0.9) / 1.1, 0), 1);

      // --- 2. Pointing Detection (One Finger) ---
      // Helper to calculate distance
      const getDist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];

      // Check if index is extended (Tip far from wrist)
      const isIndexExtended = getDist(indexTip, wrist) > palmSize * 1.5;

      // Check if others are curled (Tips close to wrist or close to MCPs)
      // A safe bet is checking if they are significantly closer to wrist than the index finger
      const areOthersCurled = 
        getDist(middleTip, wrist) < getDist(indexTip, wrist) * 0.7 &&
        getDist(ringTip, wrist) < getDist(indexTip, wrist) * 0.7 &&
        getDist(pinkyTip, wrist) < getDist(indexTip, wrist) * 0.7;

      const isPointing = isIndexExtended && areOthersCurled;

      gestureData = {
        isOpen: normalizedOpenness > 0.4,
        openness: normalizedOpenness,
        position: { x: wrist.x, y: wrist.y },
        isDetected: true,
        isPointing: isPointing,
        pointerPosition: { x: indexTip.x, y: indexTip.y }
      };

      // Debug drawing
      if (showDebug && ctx) {
        const drawingUtils = new DrawingUtils(ctx);
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: isPointing ? "#00FFFF" : "#00FF00", // Cyan when pointing
            lineWidth: 2
          });
          drawingUtils.drawLandmarks(landmarks, { 
            color: isPointing ? "#FFFF00" : "#FF0000", 
            lineWidth: 1,
            radius: (data) => data.index === 8 && isPointing ? 5 : 2 // Highlight index tip
          });
        }
      }
    }

    onGestureUpdate(gestureData);
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
       {/* Hidden video element for processing */}
       <video 
         ref={videoRef} 
         autoPlay 
         playsInline 
         className="hidden"
       />
       
       {/* Debug Canvas - Visible but small */}
       <div className={`relative overflow-hidden rounded-lg border border-white/20 bg-black/50 transition-all duration-300 ${loading ? 'w-32 h-24' : 'w-48 h-36'}`}>
          {loading && (
             <div className="absolute inset-0 flex items-center justify-center text-white/70 text-xs">
                Initializing AI...
             </div>
          )}
          {error && (
             <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs p-2 text-center">
                {error}
             </div>
          )}
          <canvas 
            ref={canvasRef} 
            className={`w-full h-full object-cover mirror-x ${!showDebug && !loading ? 'opacity-30' : 'opacity-100'}`}
            style={{ transform: 'scaleX(-1)' }} 
          />
          <div className="absolute bottom-1 left-2 text-[10px] text-white/50 font-mono">
             INPUT FEED
          </div>
       </div>
    </div>
  );
};