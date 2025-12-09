import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { ShapeType, HandGestureData } from '../types';
import { generateParticles } from '../utils/geometry';

interface ParticleSystemProps {
  shape: ShapeType;
  color: string;
  gestureData: React.MutableRefObject<HandGestureData>;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ shape, color, gestureData }) => {
  const count = 12000;
  const meshRef = useRef<THREE.Points>(null);
  
  const targetPositions = useMemo(() => {
    return generateParticles(shape, count);
  }, [shape]);

  const currentPositions = useMemo(() => {
    return new Float32Array(count * 3);
  }, []);

  const randomOffsets = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for(let i = 0; i < count * 3; i++) {
        arr[i] = (Math.random() - 0.5) * 45; 
    }
    return arr;
  }, []);

  useEffect(() => {
    // Reset if needed
  }, [shape]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const { openness, isDetected, isPointing, pointerPosition } = gestureData.current;
    
    // --- MODE LOGIC ---
    // If Pointing: Force targetFactor to 0 (Shape formed) so we drag the object, not dust.
    // Else: Use openness.
    const targetFactor = isPointing ? 0 : (isDetected ? openness : 0); 
    
    const time = state.clock.getElapsedTime();
    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    // --- POSITION & ROTATION FOLLOWING ---
    if (isPointing) {
        // Map 0..1 to -X..X
        // Note: Webcam is usually mirrored for user experience. 
        // If user moves Right (on screen), x goes 0->1 in Canvas coordinate? 
        // HandTracker draws with scaleX(-1). 
        // Raw data: x=0 is left of camera image (Right of user in mirror).
        // Let's assume standard mirror logic:
        // x < 0.5 (Left of image) -> Right side of screen -> +X in 3D
        const targetX = (0.5 - pointerPosition.x) * 35; // Wider range
        const targetY = -(pointerPosition.y - 0.5) * 20; // Invert Y
        
        // Smooth lerp to finger position
        meshRef.current.position.lerp(new THREE.Vector3(targetX, targetY, 0), 0.1);
        
        // Rotate faster when being dragged
        meshRef.current.rotation.y += 0.01;
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, (pointerPosition.x - 0.5) * 0.5, 0.1); // Tilt slightly
    } else {
        // Return to center
        meshRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.05);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.05);
        
        // Normal Auto Rotate
        meshRef.current.rotation.y += 0.002 + (1 - targetFactor) * 0.003;
    }

    // --- PARTICLE PHYSICS ---
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      const dx = tx + randomOffsets[i3];
      const dy = ty + randomOffsets[i3 + 1];
      const dz = tz + randomOffsets[i3 + 2];

      const desiredX = tx + (dx - tx) * targetFactor;
      const desiredY = ty + (dy - ty) * targetFactor;
      const desiredZ = tz + (dz - tz) * targetFactor;

      const cx = currentPositions[i3];
      const cy = currentPositions[i3 + 1];
      const cz = currentPositions[i3 + 2];

      const speed = 0.08 + (1 - targetFactor) * 0.05; 
      
      currentPositions[i3] += (desiredX - cx) * speed;
      currentPositions[i3 + 1] += (desiredY - cy) * speed;
      currentPositions[i3 + 2] += (desiredZ - cz) * speed;

      const baseNoise = 0.005; 
      const explosionNoise = 0.15;
      const currentNoise = baseNoise + (explosionNoise * targetFactor);

      currentPositions[i3] += Math.sin(time * 2 + i) * currentNoise; 
      currentPositions[i3 + 1] += Math.cos(time * 1.5 + i * 0.5) * currentNoise;
      
      positionAttribute.setXYZ(i, currentPositions[i3], currentPositions[i3+1], currentPositions[i3+2]);
    }
    
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12} 
        color={color}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};

interface SceneProps {
  shape: ShapeType;
  color: string;
  gestureRef: React.MutableRefObject<HandGestureData>;
}

export const ParticleScene: React.FC<SceneProps> = ({ shape, color, gestureRef }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={60} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ParticleSystem shape={shape} color={color} gestureData={gestureRef} />
        <OrbitControls enableZoom={true} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
};