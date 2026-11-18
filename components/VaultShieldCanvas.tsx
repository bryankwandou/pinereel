'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type SimMode = 'intercept' | 'clean' | 'vault';

interface Palette {
  signal: string;
  good: string;
  bad: string;
  warn: string;
  ink: string;
  rule: string;
}

const FALLBACK: Palette = {
  signal: '#0E5A3E',
  good: '#0F5E38',
  bad: '#A9221C',
  warn: '#844D06',
  ink: '#0E1311',
  rule: '#C8C2B3',
};

function readPalette(): Palette {
  if (typeof window === 'undefined') return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    signal: pick('--pr-signal', FALLBACK.signal),
    good: pick('--pr-good', FALLBACK.good),
    bad: pick('--pr-bad', FALLBACK.bad),
    warn: pick('--pr-warn', FALLBACK.warn),
    ink: pick('--pr-ink', FALLBACK.ink),
    rule: pick('--pr-rule-2', FALLBACK.rule),
  };
}

function useThemePalette() {
  const [palette, setPalette] = useState<Palette>(FALLBACK);
  useEffect(() => {
    const sync = () => setPalette(readPalette());
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', sync);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', sync);
    };
  }, []);
  return palette;
}

function MountainRidgeWire({ palette, active }: { palette: Palette; active: boolean }) {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(11, 6, 26, 14);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ridge =
        Math.exp(-Math.pow((x - 1.6) * 0.45, 2)) * 1.15 +
        Math.sin(x * 0.9) * Math.cos(z * 1.1) * 0.38;
      pos.setY(i, ridge - 2.25);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geom}>
      <meshBasicMaterial
        color={active ? palette.signal : palette.rule}
        wireframe
        transparent
        opacity={active ? 0.34 : 0.16}
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
}

function StreamPackets({
  palette,
  still,
  mode,
}: {
  palette: Palette;
  still: boolean;
  mode: SimMode;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const scanGateRef = useRef<THREE.Mesh>(null);
  const { invalidate, pointer } = useThree();

  const packets = useMemo<PacketSpec[]>(() => {
    const out: PacketSpec[] = [];
    for (let i = 0; i < 64; i++) {
      const h1 = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
      const h2 = Math.abs(Math.sin((i + 1) * 78.233) * 19341.123) % 1;
      const kind: PacketSpec['kind'] =
        i % 4 === 0 ? 'threat' : i % 4 === 1 ? 'tracker' : 'safe';
      out.push({
        phase: i / 64,
        laneY: (h1 - 0.5) * 3.0,
        laneZ: (h2 - 0.5) * 2.5,
        kind,
        speed: 0.13 + (i % 5) * 0.02,
      });
    }
    return out;
  }, []);

  const geometry = useMemo(() => new RoundedBoxGeometry(0.42, 0.28, 0.28, 3, 0.05), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const cSafe = new THREE.Color(palette.signal);
    const cGood = new THREE.Color(palette.good);
    const cThreat = new THREE.Color(palette.bad);
    const cWarn = new THREE.Color(palette.warn);

    packets.forEach((p, idx) => {
      if (mode === 'clean') {
        mesh.setColorAt(idx, idx % 2 === 0 ? cSafe : cGood);
      } else if (mode === 'vault') {
        mesh.setColorAt(idx, p.kind === 'threat' ? cWarn : cSafe);
      } else {
        mesh.setColorAt(
          idx,
          p.kind === 'threat' ? cThreat : p.kind === 'tracker' ? cWarn : cSafe
        );
      }
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    invalidate();
  }, [palette, packets, mode, invalidate]);

  const placeAt = (elapsed: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    packets.forEach((p, idx) => {
      if (mode === 'vault') {
        // Organized 4x4x4 offline Alpine Vault cube floating cleanly above mountain ridge
        const col = idx % 4;
        const row = Math.floor(idx / 4) % 4;
        const layer = Math.floor(idx / 16);
        const bob = still ? 0 : Math.sin(elapsed * 1.4 + idx * 0.25) * 0.06;
        dummy.position.set(
          1.1 + (col - 1.5) * 0.62,
          -0.25 + (row - 1.5) * 0.46 + bob,
          (layer - 1.5) * 0.54
        );
        dummy.rotation.set(0, 0.06, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        return;
      }

      const t = (p.phase + elapsed * p.speed) % 1;
      const x = -4.6 + t * 9.2;
      let y = p.laneY;
      let z = p.laneZ;
      let scale = 1;

      const blocked = mode === 'intercept' && p.kind !== 'safe';
      if (blocked && x > -0.6) {
        const drop = Math.min(1, (x + 0.6) / 1.4);
        y -= drop * 2.4;
        z += (p.kind === 'threat' ? 1 : -1) * drop * 0.8;
        scale = Math.max(0.001, 1 - drop * 0.9);
      } else if (x > 0.5) {
        const snap = Math.min(1, (x - 0.5) / 1.9);
        const gridY = ((idx % 3) - 1) * 0.66;
        const gridZ = (((idx >> 1) % 3) - 1) * 0.64;
        y = THREE.MathUtils.lerp(p.laneY, gridY, snap);
        z = THREE.MathUtils.lerp(p.laneZ, gridZ, snap);
      }

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        blocked && x > -0.6 ? x * 1.8 : 0,
        blocked ? x * 1.1 : 0.14,
        0
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;

    if (scanGateRef.current) {
      scanGateRef.current.position.x = still ? 0 : Math.sin(elapsed * 1.6) * 0.55;
    }
  };

  useEffect(() => {
    if (still) {
      placeAt(2.8);
      invalidate();
    }
  });

  useFrame((state) => {
    if (still) return;
    placeAt(state.clock.getElapsedTime());
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        pointer.x * 0.16,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -pointer.y * 0.07,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef}>
      <MountainRidgeWire palette={palette} active={mode === 'vault'} />

      {/* Five vertical isolation gates */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0, 0]}>
          <boxGeometry args={[0.02, 3.4, 2.8]} />
          <meshStandardMaterial
            color={palette.rule}
            transparent
            opacity={mode === 'vault' ? 0.12 : 0.3}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Active scanning beam across gates */}
      <mesh ref={scanGateRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 3.55, 2.9]} />
        <meshStandardMaterial
          color={palette.signal}
          transparent
          opacity={mode === 'vault' ? 0.08 : 0.42}
        />
      </mesh>

      <instancedMesh ref={meshRef} args={[geometry, undefined, packets.length]}>
        <meshStandardMaterial roughness={0.35} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}

export default function VaultShieldCanvas({ mode }: { mode: SimMode }) {
  const palette = useThemePalette();
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
      className="w-full h-full relative rounded-[var(--pr-r-lg)] border border-[var(--pr-rule)] bg-[var(--pr-raised)] overflow-hidden"
    >
      <Canvas
        orthographic
        dpr={[1, 1.75]}
        frameloop={still ? 'demand' : visible ? 'always' : 'never'}
        camera={{ position: [5.8, 3.9, 7.8], zoom: 48, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ invalidate }) => {
          invalidate();
        }}
      >
        <ambientLight intensity={0.95} />
        <directionalLight position={[-6, 10, 8]} intensity={1.5} />
        <directionalLight position={[7, 3, -6]} intensity={0.5} />
        <StreamPackets palette={palette} still={still} mode={mode} />
      </Canvas>
      <div className="absolute top-3 inset-x-3 flex items-center justify-between text-[10px] pr-mono text-[var(--pr-ink-3)] pointer-events-none">
        <span>GATES 01..05</span>
        <span>
          {mode === 'intercept'
            ? 'DEFLECTING TRACKERS + LURES'
            : mode === 'vault'
            ? '0-SIGNAL VAULT GRID'
            : 'VERIFIED PASS-THROUGH'}
        </span>
      </div>
    </div>
  );
}
