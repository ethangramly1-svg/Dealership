<script lang="ts">
  import { T } from '@threlte/core';

  // Stylized full-size SUV silhouette built from primitives.
  // Front of vehicle faces +Z. Length along Z (4.8m), width along X (1.95m).
  //
  // Replace this whole component with a single <GLTF url="..." /> if you
  // get a real Denali .glb — e.g. download from Sketchfab and drop in
  // static/models/denali.glb, then point at /Dealership/models/denali.glb.

  // Medium slate body so the SUV reads against the dark fog instead of
  // disappearing into it. Slight emissive lift keeps it present even when
  // mood lights are between peaks.
  const BODY = {
    color: '#5a6275',
    roughness: 0.32,
    metalness: 0.78,
    emissive: '#1a1f2c',
    emissiveIntensity: 0.35
  };
  const CHROME = { color: '#c8c8d0', roughness: 0.05, metalness: 1.0 };
  const TIRE = { color: '#181820', roughness: 0.7, metalness: 0.25 };
</script>

<!-- Lower body (between wheels) -->
<T.Mesh position={[0, 0.55, 0]}>
  <T.BoxGeometry args={[1.95, 0.7, 4.8]} />
  <T.MeshStandardMaterial {...BODY} />
</T.Mesh>

<!-- Cabin (taller, set back slightly) -->
<T.Mesh position={[0, 1.45, -0.3]}>
  <T.BoxGeometry args={[1.85, 0.95, 3.0]} />
  <T.MeshStandardMaterial {...BODY} />
</T.Mesh>

<!-- Tinted glass band (sits inside the cabin profile) -->
<T.Mesh position={[0, 1.45, -0.3]}>
  <T.BoxGeometry args={[1.97, 0.7, 2.92]} />
  <T.MeshStandardMaterial color="#020208" roughness={0.05} metalness={0.15} transparent opacity={0.92} />
</T.Mesh>

<!-- Raised hood -->
<T.Mesh position={[0, 0.95, 1.55]}>
  <T.BoxGeometry args={[1.88, 0.18, 1.55]} />
  <T.MeshStandardMaterial {...BODY} />
</T.Mesh>

<!-- Chrome belt-line — the single most "Denali" detail -->
<T.Mesh position={[0, 0.97, 0]}>
  <T.BoxGeometry args={[1.98, 0.04, 4.82]} />
  <T.MeshStandardMaterial {...CHROME} />
</T.Mesh>

<!-- Front grille (chrome bars across the nose) -->
{#each [0.35, 0.5, 0.65] as gy}
  <T.Mesh position={[0, gy, 2.41]}>
    <T.BoxGeometry args={[1.35, 0.04, 0.06]} />
    <T.MeshStandardMaterial {...CHROME} />
  </T.Mesh>
{/each}

<!-- Grille frame -->
<T.Mesh position={[0, 0.5, 2.4]}>
  <T.BoxGeometry args={[1.42, 0.45, 0.04]} />
  <T.MeshStandardMaterial color="#1a1a22" roughness={0.3} metalness={0.6} />
</T.Mesh>

<!-- Bumper -->
<T.Mesh position={[0, 0.3, 2.42]}>
  <T.BoxGeometry args={[1.75, 0.2, 0.06]} />
  <T.MeshStandardMaterial color="#222228" roughness={0.4} metalness={0.7} />
</T.Mesh>

<!-- Headlights — cyan emissive for the neon theme -->
<T.Mesh position={[0.75, 0.72, 2.41]}>
  <T.BoxGeometry args={[0.3, 0.16, 0.07]} />
  <T.MeshStandardMaterial color="#ffffff" emissive="#00f0ff" emissiveIntensity={3.5} />
</T.Mesh>
<T.Mesh position={[-0.75, 0.72, 2.41]}>
  <T.BoxGeometry args={[0.3, 0.16, 0.07]} />
  <T.MeshStandardMaterial color="#ffffff" emissive="#00f0ff" emissiveIntensity={3.5} />
</T.Mesh>

<!-- Taillights — pink emissive -->
<T.Mesh position={[0.75, 0.72, -2.41]}>
  <T.BoxGeometry args={[0.28, 0.14, 0.06]} />
  <T.MeshStandardMaterial color="#ffffff" emissive="#ff006e" emissiveIntensity={2.5} />
</T.Mesh>
<T.Mesh position={[-0.75, 0.72, -2.41]}>
  <T.BoxGeometry args={[0.28, 0.14, 0.06]} />
  <T.MeshStandardMaterial color="#ffffff" emissive="#ff006e" emissiveIntensity={2.5} />
</T.Mesh>

<!-- 4 wheels (tires, rotated so cylinder axis runs along X) -->
{#each [[0.95, 1.55], [-0.95, 1.55], [0.95, -1.55], [-0.95, -1.55]] as [wx, wz]}
  <T.Mesh position={[wx, 0.45, wz]} rotation={[0, 0, Math.PI / 2]}>
    <T.CylinderGeometry args={[0.48, 0.48, 0.32, 28]} />
    <T.MeshStandardMaterial {...TIRE} />
  </T.Mesh>
  <!-- Chrome rim disc (just inboard of the tire) -->
  <T.Mesh position={[wx * 0.96, 0.45, wz]} rotation={[0, 0, Math.PI / 2]}>
    <T.CylinderGeometry args={[0.3, 0.3, 0.04, 24]} />
    <T.MeshStandardMaterial {...CHROME} />
  </T.Mesh>
{/each}
