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

interface DriftSphereProps {
  driftData?: number[];
}

// ============================================================
// CSS FALLBACK — SVG based drift visualization
// ============================================================
function CSSFallbackDrift({ driftData = [] }: DriftSphereProps) {
  const segments = 24;
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.42;

  return (
    <div className="w-[300px] h-[300px] flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(r => (
          <circle key={r} cx={cx} cy={cy} r={maxR * r} fill="none" stroke="rgba(59,130,246,0.06)" strokeWidth="0.5" />
        ))}

        {/* Drift polygon */}
        <polygon
          points={Array.from({ length: segments }).map((_, i) => {
            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
            const dv = driftData.length > 0 ? driftData[i % driftData.length] : Math.random() * 0.4;
            const r = (0.6 + dv * 0.4) * maxR;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          }).join(' ')}
          fill="rgba(59,130,246,0.08)"
          stroke="#3B82F6"
          strokeWidth="1"
          opacity="0.7"
        >
          <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="20s" repeatCount="indefinite" />
        </polygon>

        {/* Danger zones */}
        {driftData.filter(d => d > 0.5).length > 0 && (
          <polygon
            points={Array.from({ length: segments }).map((_, i) => {
              const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
              const dv = driftData.length > 0 ? driftData[i % driftData.length] : 0;
              const r = dv > 0.5 ? (0.6 + dv * 0.4) * maxR : 0;
              return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
            }).join(' ')}
            fill="rgba(255,61,107,0.1)"
            stroke="rgba(255,61,107,0.3)"
            strokeWidth="0.8"
          >
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="20s" repeatCount="indefinite" />
          </polygon>
        )}

        {/* Data points */}
        {Array.from({ length: segments }).map((_, i) => {
          const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
          const dv = driftData.length > 0 ? driftData[i % driftData.length] : Math.random() * 0.4;
          const r = (0.6 + dv * 0.4) * maxR;
          const color = dv > 0.6 ? '#EF4444' : dv > 0.3 ? '#F59E0B' : '#3B82F6';
          return <circle key={i} cx={cx + Math.cos(angle) * r} cy={cy + Math.sin(angle) * r} r={2} fill={color} opacity="0.8" />;
        })}

        {/* Center label */}
        <text x={cx} y={cy + 4} fill="#4A8F8A" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">DRIFT</text>
      </svg>
    </div>
  );
}

// ============================================================
// WebGL version
// ============================================================
function WebGLDrift({ driftData = [] }: DriftSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
        camera.position.z = 4;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(300, 300);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        const geo = new THREE.SphereGeometry(1.5, 24, 24);
        const posCount = geo.attributes.position.count;
        const vertColors = new Float32Array(posCount * 3);
        const tealC = new THREE.Color('#3B82F6');
        const warnC = new THREE.Color('#F59E0B');
        const dangerC = new THREE.Color('#EF4444');

        for (let i = 0; i < posCount; i++) {
          const dv = driftData.length > 0 ? driftData[i % driftData.length] : Math.random() * 0.3;
          const color = new THREE.Color();
          if (dv < 0.3) color.copy(tealC);
          else if (dv < 0.6) color.lerpColors(tealC, warnC, (dv - 0.3) / 0.3);
          else color.lerpColors(warnC, dangerC, (dv - 0.6) / 0.4);
          vertColors[i * 3] = color.r;
          vertColors[i * 3 + 1] = color.g;
          vertColors[i * 3 + 2] = color.b;
        }

        geo.setAttribute('color', new THREE.BufferAttribute(vertColors, 3));
        const mat = new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: true, transparent: true, opacity: 0.6 });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        const animate = () => {
          animId = requestAnimationFrame(animate);
          mesh.rotation.y += 0.005;
          mesh.rotation.x += 0.001;
          renderer.render(scene, camera);
        };
        animate();
      } catch (err) {
        console.warn('DriftSphere WebGL failed:', err);
      }
    };
    init();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      try { renderer?.dispose(); if (container.firstChild) container.removeChild(container.firstChild); } catch {}
    };
  }, [driftData]);

  return <div ref={containerRef} className="w-[300px] h-[300px]" />;
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default function DriftSphere({ driftData = [] }: DriftSphereProps) {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  if (webgl === null) return null;
  if (!webgl) return <CSSFallbackDrift driftData={driftData} />;
  return <WebGLDrift driftData={driftData} />;
}
