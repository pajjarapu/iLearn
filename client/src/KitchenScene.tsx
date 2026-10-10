import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group, type Mesh } from "three";
import { COOK_STATUS_LABEL, type Cook, type CookStatus, type Station } from "@kitchen/shared";

const APRON: Record<Station, string> = {
  head_chef: "#f4f1ea",
  prep: "#2f6b45",
  grill: "#8d1d14",
  sauce: "#c46a1a",
};

export function KitchenScene({
  cooks,
  readyCount,
  servedCount,
  onSelectStation,
}: {
  cooks: Cook[];
  readyCount: number;
  servedCount: number;
  onSelectStation: (station: Station) => void;
}) {
  return (
    <div className="viewport" role="region" aria-label="Kitchen, drag to look around">
      <Canvas
        shadows
        camera={{ position: [3.4, 2.5, 4.6], fov: 48 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#c8d0d6"]} />
        <hemisphereLight args={["#f4efe4", "#6d5844", 0.55]} />
        <directionalLight
          position={[4, 7, 3]}
          intensity={1.35}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0.4, 2.2, -1.8]} intensity={8} distance={6} color="#ffd2a1" />
        <Room />
        <Staff cooks={cooks} onSelectStation={onSelectStation} />
        <Pass readyCount={readyCount} servedCount={servedCount} />
        <OrbitControls
          makeDefault
          enableDamping
          target={[0.1, 1.05, -0.4]}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={0.25}
          minDistance={2.4}
          maxDistance={9}
        />
      </Canvas>
      <p className="drag-hint">Drag to look around. Scroll to zoom.</p>
    </div>
  );
}

function Room() {
  const wood = useMemo(() => paintWood(), []);
  const tile = useMemo(() => paintTile(), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8.4, 6.4]} />
        <meshStandardMaterial map={wood} roughness={0.9} />
      </mesh>
      <Wall position={[0, 1.45, -3.15]} args={[8.4, 2.9, 0.12]} />
      <Wall position={[-4.15, 1.45, 0]} args={[0.12, 2.9, 6.4]} />
      <Wall position={[4.15, 1.45, -1.55]} args={[0.12, 2.9, 3.2]} />
      <Wall position={[4.15, 2.35, 1.35]} args={[0.12, 1.1, 2.2]} />
      <Wall position={[4.15, 0.45, 1.35]} args={[0.12, 0.9, 2.2]} />
      <mesh position={[0, 1.55, -3.08]}>
        <planeGeometry args={[7.6, 1.15]} />
        <meshStandardMaterial map={tile} roughness={0.4} />
      </mesh>
      <Cabinets />
      <Stove />
      <Sink />
      <Fridge />
      <Island />
      <Hood />
      <mesh position={[-2.3, 1.7, -3.02]}>
        <planeGeometry args={[1.3, 0.9]} />
        <meshStandardMaterial color="#d7e7f2" emissive="#9ec4de" emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

function Wall({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#efe8df" roughness={0.85} />
    </mesh>
  );
}

function Cabinets() {
  return (
    <group>
      <Cabinet position={[-2.55, 0.44, -2.55]} size={[1.7, 0.88, 0.7]} />
      <Cabinet position={[1.55, 0.44, -2.55]} size={[1.9, 0.88, 0.7]} />
      <mesh position={[-2.55, 0.92, -2.55]} castShadow receiveShadow>
        <boxGeometry args={[1.78, 0.08, 0.78]} />
        <meshStandardMaterial color="#d9dde2" roughness={0.25} metalness={0.45} />
      </mesh>
      <mesh position={[1.15, 0.92, -2.55]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.08, 0.78]} />
        <meshStandardMaterial color="#d9dde2" roughness={0.25} metalness={0.45} />
      </mesh>
      <Cabinet position={[-2.55, 2.15, -2.95]} size={[1.7, 0.7, 0.38]} />
      <Cabinet position={[1.4, 2.15, -2.95]} size={[2.2, 0.7, 0.38]} />
    </group>
  );
}

function Cabinet({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#f7f4ef" roughness={0.55} />
    </mesh>
  );
}

function Stove() {
  return (
    <group position={[-0.15, 0, -2.5]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.84, 0.7]} />
        <meshStandardMaterial color="#2a2d31" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.86, 0]} receiveShadow>
        <boxGeometry args={[1.05, 0.04, 0.6]} />
        <meshStandardMaterial color="#1a1c1f" roughness={0.3} metalness={0.6} />
      </mesh>
      <Burner position={[-0.24, 0.9, -0.12]} />
      <Burner position={[0.24, 0.9, -0.12]} />
      <Burner position={[-0.24, 0.9, 0.16]} />
      <Burner position={[0.24, 0.9, 0.16]} />
    </group>
  );
}

function Burner({ position }: { position: [number, number, number] }) {
  const flame = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!flame.current) return;
    const flick = 0.75 + Math.sin(clock.elapsedTime * 16 + position[0] * 8) * 0.2;
    flame.current.scale.set(flick, 0.7 + flick * 0.4, flick);
  });
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.13, 20]} />
        <meshStandardMaterial color="#4a4e54" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={flame} position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#ffb15a" emissive="#ff6a1a" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

function Sink() {
  return (
    <group position={[-2.55, 0.96, -2.55]}>
      <mesh receiveShadow>
        <boxGeometry args={[0.7, 0.08, 0.42]} />
        <meshStandardMaterial color="#b9c2c8" metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[0.22, 0.16, -0.05]}>
        <cylinderGeometry args={[0.015, 0.015, 0.28, 8]} />
        <meshStandardMaterial color="#c5ced4" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Fridge() {
  return (
    <group position={[3.2, 1.05, -2.35]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.85, 2.1, 0.75]} />
        <meshStandardMaterial color="#f3f5f6" metalness={0.35} roughness={0.28} />
      </mesh>
      <mesh position={[0.38, 0.35, 0.38]}>
        <boxGeometry args={[0.04, 0.7, 0.05]} />
        <meshStandardMaterial color="#9aa3aa" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Island() {
  return (
    <group position={[-0.35, 0, 0.55]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.84, 1.05]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.08, 1.16]} />
        <meshStandardMaterial color="#d7dbe0" metalness={0.4} roughness={0.25} />
      </mesh>
      <mesh position={[0.15, 0.94, 0]} receiveShadow>
        <boxGeometry args={[0.7, 0.03, 0.48]} />
        <meshStandardMaterial color="#c4a15a" roughness={0.7} />
      </mesh>
      <mesh position={[0.28, 0.97, 0.08]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#c23b22" />
      </mesh>
    </group>
  );
}

function Hood() {
  return (
    <mesh position={[-0.15, 2.15, -2.7]} castShadow>
      <boxGeometry args={[1.3, 0.42, 0.55]} />
      <meshStandardMaterial color="#e6eaee" metalness={0.55} roughness={0.3} />
    </mesh>
  );
}

function Pass({ readyCount, servedCount }: { readyCount: number; servedCount: number }) {
  return (
    <group position={[3.55, 0, 1.35]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 1.1, 1.5]} />
        <meshStandardMaterial color="#d5dadf" metalness={0.35} roughness={0.3} />
      </mesh>
      {Array.from({ length: Math.min(readyCount, 3) }, (_, index) => (
        <mesh key={index} position={[-0.2, 1.14, -0.35 + index * 0.32]} receiveShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 20]} />
          <meshStandardMaterial color="#f7f1e6" roughness={0.4} />
        </mesh>
      ))}
      <Html position={[0, 1.7, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
        <div className="cook-tag">
          Expo
          <small>
            {servedCount} served · {readyCount} waiting
          </small>
        </div>
      </Html>
    </group>
  );
}

function Staff({
  cooks,
  onSelectStation,
}: {
  cooks: Cook[];
  onSelectStation: (station: Station) => void;
}) {
  const spots: Record<Station, [number, number, number]> = {
    prep: [-0.2, 0, 1.35],
    grill: [-0.15, 0, -1.7],
    sauce: [-2.55, 0, -1.7],
    head_chef: [2.55, 0, 1.35],
  };
  const face: Record<Station, number> = {
    prep: Math.PI,
    grill: 0,
    sauce: 0,
    head_chef: -Math.PI / 2,
  };
  return (
    <group>
      {(Object.keys(spots) as Station[]).map((station) => {
        const cook = cooks.find((item) => item.station === station);
        return (
          <CookFigure
            key={station}
            name={cook?.name ?? station}
            status={cook?.status ?? "idle"}
            apron={APRON[station]}
            position={spots[station]}
            rotation={face[station]}
            tall={station === "head_chef"}
            onClick={() => onSelectStation(station)}
          />
        );
      })}
    </group>
  );
}

function CookFigure({
  name,
  status,
  apron,
  position,
  rotation,
  tall,
  onClick,
}: {
  name: string;
  status: CookStatus;
  apron: string;
  position: [number, number, number];
  rotation: number;
  tall: boolean;
  onClick: () => void;
}) {
  const ref = useRef<Group>(null);
  const arm = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      const bob = status === "working" ? Math.sin(t * 8) * 0.035 : Math.sin(t * 2) * 0.012;
      const sway = status === "waiting" ? Math.sin(t * 2.2) * 0.06 : 0;
      ref.current.position.set(position[0] + sway, bob, position[2]);
    }
    if (arm.current) {
      arm.current.rotation.x = status === "working" ? Math.sin(t * 8) * 0.7 : 0.15;
    }
  });
  return (
    <group
      ref={ref}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <mesh position={[-0.07, 0.38, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.28, 4, 8]} />
        <meshStandardMaterial color="#2c3036" />
      </mesh>
      <mesh position={[0.07, 0.38, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.28, 4, 8]} />
        <meshStandardMaterial color="#2c3036" />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.28, 6, 12]} />
        <meshStandardMaterial color={apron} roughness={0.7} />
      </mesh>
      <group ref={arm} position={[0.18, 0.95, 0.05]}>
        <mesh position={[0, -0.12, 0.08]} castShadow>
          <capsuleGeometry args={[0.035, 0.18, 4, 8]} />
          <meshStandardMaterial color="#e7c2a4" />
        </mesh>
      </group>
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#e7c2a4" roughness={0.6} />
      </mesh>
      <mesh position={[0, tall ? 1.42 : 1.34, 0]} castShadow>
        <cylinderGeometry args={[tall ? 0.11 : 0.14, tall ? 0.13 : 0.15, tall ? 0.22 : 0.1, 16]} />
        <meshStandardMaterial color="#f7f7f7" roughness={0.45} />
      </mesh>
      <Html position={[0, 1.72, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div className="cook-tag">
          {name}
          <small>{COOK_STATUS_LABEL[status]}</small>
        </div>
      </Html>
    </group>
  );
}

function paintWood(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  for (let x = 0; x < 8; x += 1) {
    const tone = 118 + (x % 3) * 14;
    ctx.fillStyle = `rgb(${tone + 40}, ${tone - 10}, ${tone - 50})`;
    ctx.fillRect(x * 64, 0, 62, 512);
    ctx.strokeStyle = "rgba(70, 40, 18, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x * 64 + 18, 0);
    ctx.bezierCurveTo(x * 64 + 30, 160, x * 64 + 8, 300, x * 64 + 22, 512);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2.5, 2);
  return texture;
}

function paintTile(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  ctx.fillStyle = "#d9d3c8";
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "#f4f0e8";
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      const offset = y % 2 === 0 ? 0 : 22;
      ctx.fillRect(x * 44 + offset, y * 32 + 2, 40, 26);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}
