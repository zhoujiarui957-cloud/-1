import * as THREE from 'three';
import { ShapeType } from '../types';

export const generateParticles = (shape: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const i3 = i * 3;

    switch (shape) {
      case ShapeType.HEART: {
        // Parametric Heart
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()); // Even distribution
        const scale = 0.5;
        
        // Base heart curve
        let hx = 16 * Math.pow(Math.sin(t), 3);
        let hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        
        // Add volume
        x = hx * scale + (Math.random() - 0.5) * 2;
        y = hy * scale + (Math.random() - 0.5) * 2;
        z = (Math.random() - 0.5) * 5 * (1 - Math.abs(hy)/20); // Thicker at center
        break;
      }

      case ShapeType.SATURN: {
        const isRing = Math.random() > 0.6; // 40% planet, 60% ring
        if (!isRing) {
          // Planet sphere
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const rad = 4 + Math.random() * 0.5;
          x = rad * Math.sin(phi) * Math.cos(theta);
          y = rad * Math.sin(phi) * Math.sin(theta);
          z = rad * Math.cos(phi);
        } else {
          // Ring
          const theta = Math.random() * Math.PI * 2;
          const rad = 7 + Math.random() * 4;
          x = rad * Math.cos(theta);
          z = rad * Math.sin(theta);
          y = (Math.random() - 0.5) * 0.5; // Flat ring
          
          // Tilt the ring
          const tilt = Math.PI / 6;
          const ty = y * Math.cos(tilt) - z * Math.sin(tilt);
          const tz = y * Math.sin(tilt) + z * Math.cos(tilt);
          y = ty;
          z = tz;
        }
        break;
      }

      case ShapeType.FLOWER: {
        // Rose curve / Flower
        const k = 4; // Petals
        const theta = Math.random() * Math.PI * 2;
        const radBase = Math.cos(k * theta);
        const r = Math.abs(radBase) * 8 + Math.random(); 
        
        x = r * Math.cos(theta);
        y = r * Math.sin(theta);
        z = (Math.random() - 0.5) * 2 + Math.pow(r/8, 2) * 2; // Curve up at edges
        break;
      }

      case ShapeType.TREE: {
        // Cone spiral
        const h = Math.random() * 15; // Height
        const maxR = (15 - h) * 0.5;
        const theta = h * 5 + Math.random() * Math.PI * 2;
        
        x = maxR * Math.cos(theta);
        z = maxR * Math.sin(theta);
        y = h - 7.5; // Center vertically
        break;
      }

      case ShapeType.FIREWORKS: {
        // Explosion sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * 10;
        
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }

      case ShapeType.BOW: {
        // Lemniscate of Bernoulli ish
        const t = Math.random() * Math.PI * 2;
        const scale = 8;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        x = scale * Math.cos(t) / denom;
        y = scale * Math.sin(t) * Math.cos(t) / denom;
        z = (Math.random() - 0.5) * 2;
        break;
      }
      
      default:
        x = (Math.random() - 0.5) * 10;
        y = (Math.random() - 0.5) * 10;
        z = (Math.random() - 0.5) * 10;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }

  return positions;
};