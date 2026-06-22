'use client';
import { useEffect, useRef, useState } from 'react';

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// ============================================================
// CSS FALLBACK — Pure CSS/SVG neural orb
// ============================================================
function CSSFallbackOrb() {
  return (
    <div className="w-[500px] h-[500px] max-w-full relative flex items-center justify-center">
      {/* Outer glow */}
      <div className="absolute rounded-full animate-bio-pulse" style={{
        width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
      }} />

      {/* Wireframe circle rings */}
      {[280, 240, 200, 320].map((s, i) => (
        <div key={i} className="absolute rounded-full border" style={{
          width: s, height: s,
          borderColor: `rgba(59,130,246,${0.1 + i * 0.05})`,
          transform: `rotate(${i * 15}deg)`,
          animationName: 'bio-drift',
          animationDuration: `${8 + i * 3}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
          animationDelay: `${i * 0.5}s`,
        }} />
      ))}

      {/* Orbital rings */}
      {[0, 1, 2].map(i => (
        <svg key={`ring-${i}`} className="absolute" viewBox="0 0 400 400" width="400" height="400"
          style={{ animationName: 'halo-rotate', animationDuration: `${6 + i * 2}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite' }}>
          <ellipse cx="200" cy="200" rx={140 + i * 25} ry={60 + i * 10}
            fill="none" stroke={['#3B82F6', '#00E5FF', '#00FF88'][i]} strokeWidth="0.8" opacity="0.3"
            transform={`rotate(${i * 60} 200 200)`} />
        </svg>
      ))}

      {/* Central orb */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full" style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(59,130,246,0.3), rgba(139,92,246,0.15), transparent)',
          boxShadow: '0 0 40px rgba(59,130,246,0.2), 0 0 80px rgba(59,130,246,0.1), inset 0 0 30px rgba(59,130,246,0.1)',
        }} />
        <div className="absolute inset-0 rounded-full border border-[rgba(59,130,246,0.3)]" />
      </div>

      {/* Floating data dots */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 100 + (i * 3.7) % 60;
        return (
          <div key={`dot-${i}`} className="absolute w-1.5 h-1.5 rounded-full" style={{
            left: `calc(50% + ${Math.cos(angle) * radius}px)`,
            top: `calc(50% + ${Math.sin(angle) * radius}px)`,
            background: ['#3B82F6', '#00E5FF', '#00FF88'][i % 3],
            opacity: 0.4 + (i % 4) * 0.1,
            boxShadow: `0 0 6px ${['rgba(59,130,246,0.5)', 'rgba(139,92,246,0.5)', 'rgba(0,255,136,0.5)'][i % 3]}`,
            animationName: 'bio-drift',
            animationDuration: `${5 + (i % 5)}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.2}s`,
          }} />
        );
      })}
    </div>
  );
}

// ============================================================
// WebGL version
// ============================================================
function WebGLOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let renderer: import('three').WebGLRenderer;

    const init = async () => {
      try {
        const THREE = await import('three');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 6;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(500, 500);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        const sphereGeo = new THREE.SphereGeometry(1.8, 24, 24);
        const sphereMat = new THREE.MeshBasicMaterial({ color: '#3B82F6', wireframe: true, transparent: true, opacity: 0.25 });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        scene.add(sphere);

        const dataPoints: InstanceType<typeof THREE.Mesh>[] = [];
        const dpColors = ['#3B82F6', '#00E5FF', '#00FF88'];
        for (let i = 0; i < 120; i++) {
          const geo = new THREE.SphereGeometry(0.04, 6, 6);
          const mat = new THREE.MeshBasicMaterial({ color: dpColors[i % 3], transparent: true, opacity: 0.7 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.userData = { radius: 1.5 + Math.random() * 2, angle: Math.random() * Math.PI * 2, inclination: (Math.random() - 0.5) * Math.PI, speed: 0.002 + Math.random() * 0.008 };
          scene.add(mesh);
          dataPoints.push(mesh);
        }

        for (let i = 0; i < 3; i++) {
          const ringGeo = new THREE.TorusGeometry(2.2 + i * 0.5, 0.01, 4, 48);
          const ringMat = new THREE.MeshBasicMaterial({ color: dpColors[i], transparent: true, opacity: 0.3 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 4 + i * 0.5;
          ring.rotation.y = i * 0.8;
          scene.add(ring);
        }

        const animate = () => {
          animId = requestAnimationFrame(animate);
          sphere.rotation.y += 0.003;
          sphere.rotation.x += 0.001;
          dataPoints.forEach(dp => {
            dp.userData.angle += dp.userData.speed;
            const a = dp.userData.angle;
            const { radius, inclination } = dp.userData;
            dp.position.x = radius * Math.cos(a) * Math.cos(inclination);
            dp.position.y = radius * Math.sin(inclination) * Math.sin(a * 0.3);
            dp.position.z = radius * Math.sin(a) * Math.cos(inclination);
          });
          renderer.render(scene, camera);
        };
        animate();
      } catch (err) {
        console.warn('NeuralOrb WebGL failed:', err);
      }
    };
    init();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      try { 
        renderer?.dispose(); 
        if (container) {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }
      } catch {}
    };
  }, []);

  return <div ref={containerRef} className="w-[500px] h-[500px] max-w-full" />;
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default function NeuralOrb() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  if (webgl === null) return null;
  if (!webgl) return <CSSFallbackOrb />;
  return <WebGLOrb />;
}
