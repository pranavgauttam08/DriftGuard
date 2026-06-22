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
// CSS FALLBACK — Pure CSS bioluminescent particle field
// ============================================================
function CSSFallbackOcean() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: 'var(--color-abyss)' }}>
      {/* Radial gradient caustics */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 600px 400px at 15% 80%, rgba(59,130,246,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 500px 500px at 85% 20%, rgba(139,92,246,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 400px 300px at 50% 50%, rgba(0,255,136,0.03) 0%, transparent 50%)
        `,
      }} />

      {/* Floating particles via CSS */}
      {Array.from({ length: 40 }).map((_, i) => {
        const size = 2 + (i * 1.3) % 4;
        const left = ((i * 37) % 100);
        const top = ((i * 53) % 100);
        const delay = ((i * 0.3) % 5);
        const dur = 6 + (i % 10);
        return (
          <div key={i} className="absolute rounded-full" style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `${top}%`,
            background: ['#3B82F6', '#00E5FF', '#00FF88'][i % 3],
            opacity: 0.2 + (i % 5) * 0.08,
            boxShadow: `0 0 ${6 + (i % 3) * 4}px ${['rgba(59,130,246,0.4)', 'rgba(139,92,246,0.4)', 'rgba(0,255,136,0.3)'][i % 3]}`,
            animationName: 'bio-drift',
            animationDuration: `${dur}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${delay}s`,
          }} />
        );
      })}

      {/* Jellyfish rings via CSS */}
      {[1, 2, 3].map(i => (
        <div key={`jelly-${i}`} className="absolute rounded-full border" style={{
          width: `${80 + i * 40}px`,
          height: `${80 + i * 40}px`,
          left: `${15 + i * 25}%`,
          top: `${20 + i * 15}%`,
          borderColor: 'rgba(59,130,246,0.08)',
          opacity: 0.5,
          animationName: 'bio-drift',
          animationDuration: `${12 + i * 3}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
          animationDelay: `${i * 2}s`,
        }} />
      ))}

      {/* Scan line effect */}
      <div className="absolute left-0 right-0 h-px animate-scan" style={{
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent)',
      }} />
    </div>
  );
}

// ============================================================
// WebGL version (only loads when WebGL available)
// ============================================================
function WebGLOcean() {
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
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 300;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        // Reduced particle count for performance
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const offsets = new Float32Array(particleCount);
        const speeds = new Float32Array(particleCount);
        const bColors = [new THREE.Color('#3B82F6'), new THREE.Color('#00E5FF'), new THREE.Color('#00FF88')];

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 800;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
          const c = bColors[Math.floor(Math.random() * 3)];
          colors[i * 3] = c.r;
          colors[i * 3 + 1] = c.g;
          colors[i * 3 + 2] = c.b;
          offsets[i] = Math.random() * Math.PI * 2;
          speeds[i] = 0.1 + Math.random() * 0.3;
        }

        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const particleMat = new THREE.PointsMaterial({ size: 2.5, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // 3 jellyfish rings
        const jellies: InstanceType<typeof THREE.Mesh>[] = [];
        for (let i = 0; i < 3; i++) {
          const geo = new THREE.TorusGeometry(1.5 + Math.random(), 0.3, 8, 20);
          const mat = new THREE.MeshBasicMaterial({ color: '#3B82F6', transparent: true, opacity: 0.06, wireframe: true });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 200);
          mesh.scale.setScalar(8 + Math.random() * 12);
          scene.add(mesh);
          jellies.push(mesh);
        }

        let frame = 0;
        const animate = () => {
          animId = requestAnimationFrame(animate);
          frame++;
          const time = frame * 0.008;
          const posAttr = particleGeo.getAttribute('position') as InstanceType<typeof THREE.BufferAttribute>;
          for (let i = 0; i < particleCount; i++) {
            posAttr.array[i * 3] += Math.sin(time + offsets[i]) * 0.15;
            posAttr.array[i * 3 + 1] += speeds[i] * 0.5;
            if (posAttr.array[i * 3 + 1] > 400) posAttr.array[i * 3 + 1] = -400;
          }
          posAttr.needsUpdate = true;
          particles.position.x = mouseRef.current.x * 8;
          particles.position.y = -mouseRef.current.y * 5;
          jellies.forEach((j, i) => { j.position.y += 0.08 + i * 0.02; j.rotation.x += 0.002; if (j.position.y > 300) { j.position.y = -300; j.position.x = (Math.random() - 0.5) * 400; } });
          renderer.render(scene, camera);
        };
        animate();

        const onMouseMove = (e: MouseEvent) => { mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1; mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1; };
        const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', onResize);

        return () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('resize', onResize);
        };
      } catch (err) {
        console.warn('WebGL initialization failed, using CSS fallback:', err);
      }
    };

    init();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      try { renderer?.dispose(); if (container.firstChild) container.removeChild(container.firstChild); } catch {}
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

// ============================================================
// MAIN EXPORT — Auto-detects WebGL
// ============================================================
export default function OceanCanvas() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  if (webgl === null) return null; // SSR / loading
  if (!webgl) return <CSSFallbackOcean />;
  return <WebGLOcean />;
}
