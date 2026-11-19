'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type SimMode = 'intercept' | 'clean' | 'vault';

const STAGE_PALETTE = {
  signal: '#33C288',
  good: '#5FE09E',
  bad: '#F88A84',
  warn: '#F5B952',
  ridge: '#2B4A3E',
  ring: '#3E5E52',
};

function MountainRidgeWire({ active }: { active: boolean }) {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(13, 6.5, 28, 16);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ridge =
        Math.exp(-Math.pow((x - 1.2) * 0.42, 2)) * 1.15 +
        Math.sin(x * 0.85) * Math.cos(z * 1.05) * 0.34;
      pos.setY(i, ridge - 2.15);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geom}>
      <meshBasicMaterial
        color={active ? STAGE_PALETTE.signal : STAGE_PALETTE.ridge}
        wireframe
        transparent
        opacity={active ? 0.52 : 0.28}
      />
    </mesh>
  );
}

interface PacketSpec {
  phase: number;
  laneY: number;
  laneZ: number;
  kind: 'safe' | 'threat' | 'tracker';
  speed: number;
  phi: number;
  theta: number;
}

function StreamPackets({
  still,
  mode,
}: {
  still: boolean;
  mode: SimMode;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const gateGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const { invalidate, pointer } = useThree();

  const packets = useMemo<PacketSpec[]>(() => {
    const out: PacketSpec[] = [];
    const count = 72;
    for (let i = 0; i < count; i++) {
      const h1 = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
      const h2 = Math.abs(Math.sin((i + 1) * 78.233) * 19341.123) % 1;
      const kind: PacketSpec['kind'] =
        i % 5 === 0 ? 'threat' : i % 5 === 1 ? 'tracker' : 'safe';
      out.push({
        phase: i / count,
        laneY: (h1 - 0.5) * 2.2,
        laneZ: (h2 - 0.5) * 2.1,
        kind,
        speed: 0.14 + (i % 5) * 0.022,
        phi: Math.acos(1 - (2 * (i + 0.5)) / count),
        theta: Math.PI * (1 + Math.sqrt(5)) * i,
      });
    }
    return out;
  }, []);

  const geometry = useMemo(() => new THREE.SphereGeometry(0.115, 16, 16), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const cSafe = new THREE.Color(STAGE_PALETTE.signal);
    const cGood = new THREE.Color(STAGE_PALETTE.good);
    const cThreat = new THREE.Color(STAGE_PALETTE.bad);
    const cWarn = new THREE.Color(STAGE_PALETTE.warn);

    packets.forEach((p, idx) => {
      if (mode === 'clean') {
        mesh.setColorAt(idx, idx % 2 === 0 ? cSafe : cGood);
      } else if (mode === 'vault') {
        mesh.setColorAt(idx, idx % 3 === 0 ? cGood : cSafe);
      } else {
        mesh.setColorAt(
          idx,
          p.kind === 'threat' ? cThreat : p.kind === 'tracker' ? cWarn : cGood
        );
      }
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    invalidate();
  }, [packets, mode, invalidate]);

  const placeAt = (elapsed: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    packets.forEach((p, idx) => {
      if (mode === 'vault') {
        // Geodesic encrypted vault sphere orbiting above alpine ridge
        const r = 1.65;
        const spin = still ? 0.35 : elapsed * 0.42;
        const a = p.theta + spin;
        const x = 1.25 + r * Math.sin(p.phi) * Math.cos(a);
        const y = 0.08 + r * Math.cos(p.phi);
        const z = r * Math.sin(p.phi) * Math.sin(a);
        const pulse = still ? 1 : 0.92 + Math.sin(elapsed * 2 + idx * 0.3) * 0.12;
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(pulse);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        return;
      }

      const t = (p.phase + elapsed * p.speed) % 1;
      const x = -4.2 + t * 8.4;
      let y = p.laneY + (still ? 0 : Math.sin(elapsed * 1.3 + p.phase * 12) * 0.14);
      let z = p.laneZ;
      let scale = 1;

      const blocked = mode === 'intercept' && p.kind !== 'safe';
      if (blocked && x > -0.75) {
        const drop = Math.min(1, (x + 0.75) / 1.15);
        y -= drop * 2.25;
        z += (p.kind === 'threat' ? 1.1 : -1.1) * drop;
        scale = Math.max(0.001, 1 - drop * 0.92);
      } else if (x > 0.25) {
        const focus = Math.min(1, (x - 0.25) / 1.8);
        const angle = idx * 0.55 + (still ? 0 : elapsed * 0.8);
        const helixR = (1 - focus * 0.6) * 0.9;
        y = THREE.MathUtils.lerp(y, Math.sin(angle) * helixR, focus);
        z = THREE.MathUtils.lerp(z, Math.cos(angle) * helixR, focus);
        scale = 1 + focus * 0.25;
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;

    if (gateGroupRef.current && !still) {
      gateGroupRef.current.children.forEach((child, idx) => {
        child.rotation.x = 0;
        child.rotation.y = Math.PI / 2;
        child.rotation.z = elapsed * (idx % 2 === 0 ? 0.35 : -0.28) + idx * 0.5;
      });
    }
    if (coreRef.current && !still) {
      coreRef.current.rotation.y = elapsed * 0.5;
      coreRef.current.rotation.x = Math.sin(elapsed * 0.6) * 0.2;
    }
  };

  useEffect(() => {
    if (still) {
      placeAt(2.4);
      invalidate();
    }
  });

  useFrame((state) => {
    if (still) return;
    placeAt(state.clock.getElapsedTime());
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        pointer.x * 0.2,
        0.06
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -pointer.y * 0.09,
        0.06
      );
    }
  });

  return (
    <group ref={groupRef}>
      <MountainRidgeWire active={mode === 'vault'} />

      {/* Three hexagonal geometric filter gates rotated orthogonal to stream axis */}
      <group ref={gateGroupRef} position={[-0.25, 0, 0]}>
        {[-0.55, 0, 0.55].map((xPos, idx) => (
          <mesh key={idx} position={[xPos, 0, 0]} rotation={[0, Math.PI / 2, idx * 0.4]}>
            <torusGeometry args={[1.45 - idx * 0.14, 0.03, 12, 6]} />
            <meshStandardMaterial
              color={idx === 0 && mode === 'intercept' ? STAGE_PALETTE.warn : STAGE_PALETTE.signal}
              emissive={idx === 0 && mode === 'intercept' ? STAGE_PALETTE.warn : STAGE_PALETTE.signal}
              emissiveIntensity={0.4}
              roughness={0.25}
              metalness={0.5}
              transparent
              opacity={mode === 'vault' ? 0.2 : 0.85}
            />
          </mesh>
        ))}
      </group>

      {/* Alpine crystal core representing verified stream or offline encrypted bundle */}
      <mesh ref={coreRef} position={[1.45, 0.06, 0]}>
        <icosahedronGeometry args={[mode === 'vault' ? 0.72 : 0.5, 0]} />
        <meshStandardMaterial
          color={STAGE_PALETTE.signal}
          emissive={STAGE_PALETTE.signal}
          emissiveIntensity={0.35}
          wireframe={mode !== 'vault'}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      <instancedMesh ref={meshRef} args={[geometry, undefined, packets.length]}>
        <meshStandardMaterial roughness={0.22} metalness={0.25} />
      </instancedMesh>
    </group>
  );
}

export default function VaultShieldCanvas({ mode }: { mode: SimMode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const auditMode =
      typeof window !== 'undefined' &&
      Boolean((window as { __audit?: boolean }).__audit);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setStill(auditMode || mq.matches);
    updateMotion();
    mq.addEventListener('change', updateMotion);

    const el = wrapRef.current;
    let onScreen = true;
    const syncVis = () => setVisible(onScreen && !document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncVis();
    });
    if (el) io.observe(el);
    document.addEventListener('visibilitychange', syncVis);

    return () => {
      mq.removeEventListener('change', updateMotion);
      io.disconnect();
      document.removeEventListener('visibilitychange', syncVis);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-allow-dark="true"
      className="w-full h-full flex flex-col pr-stage-dark overflow-hidden"
    >
      {/* Dedicated HUD header strip outside the WebGL canvas so 3D geometry never overlaps text */}
      <div className="px-4 py-2.5 border-b border-[#243830] bg-[#101c18] flex items-center justify-between text-[11px] pr-mono text-[#c5ccc8]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#33c288]" />
          <span>GATES 01..05</span>
        </span>
        <span className="text-[#5fe09e]">
          {mode === 'intercept'
            ? 'DEFLECTING TRACKERS + LURES'
            : mode === 'vault'
            ? '0-SIGNAL VAULT GEOMETRY'
            : 'AD-FREE STREAM TUNNEL'}
        </span>
      </div>

      <div className="relative flex-1 min-h-[250px]">
        <Canvas
          orthographic
          dpr={[1, 1.75]}
          frameloop={still ? 'demand' : visible ? 'always' : 'never'}
          camera={{ position: [5.4, 3.6, 7.6], zoom: 50, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ invalidate }) => {
            invalidate();
          }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[-6, 10, 8]} intensity={1.8} />
          <directionalLight position={[7, 3, -6]} intensity={0.75} color="#5fe09e" />
          <StreamPackets still={still} mode={mode} />
        </Canvas>
      </div>

      <div className="px-4 py-2 border-t border-[#243830] bg-[#101c18] flex items-center justify-between text-[11px] pr-mono text-[#929e98]">
        <span>72 STREAM NODES · POINTER TILT</span>
        <span className="text-[#f2f1ec]">
          {mode === 'intercept' ? 'AD WRAPPERS ISOLATED' : mode === 'vault' ? 'INDEXEDDB SHA-256' : 'HTTPS RANGE PROXY'}
        </span>
      </div>
    </div>
  );
}
