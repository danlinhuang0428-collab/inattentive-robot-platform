import * as THREE from "three";

const DEG = Math.PI / 180;

export function directionFromYawPitch(yawDegrees, pitchDegrees) {
  const yaw = yawDegrees * DEG;
  const pitch = pitchDegrees * DEG;
  return new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );
}

export function buildHemisphere({ radius = 200, segments = 128 } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let row = 0; row <= segments; row += 1) {
    const pitch = -90 + (180 * row) / segments;
    for (let column = 0; column <= segments; column += 1) {
      const yaw = -90 + (180 * column) / segments;
      const direction = directionFromYawPitch(yaw, pitch);
      positions.push(direction.x * radius, direction.y * radius, direction.z * radius);
      uvs.push(column / segments, row / segments);
    }
  }

  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const a = row * (segments + 1) + column;
      const b = a + 1;
      const d = a + segments + 1;
      const e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

