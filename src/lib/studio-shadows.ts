import * as THREE from 'three';
import type { createWorldDomain } from './world-map';

const extent = 26;
const size = 256;
const water = -0.88;

export function createMovingShadows(
  people: THREE.Object3D[],
  boats: THREE.Object3D[],
) {
  const count = people.length * 2 + boats.length;
  const elevations = new Float32Array(size * size);
  const ground = new THREE.DataTexture(
    elevations,
    size,
    size,
    THREE.RedFormat,
    THREE.FloatType,
  );
  const style = new THREE.InstancedBufferAttribute(
    new Float32Array(count * 3),
    3,
  );
  style.setUsage(THREE.DynamicDrawUsage);
  const geometry = new THREE.PlaneGeometry(2, 2, 6, 10).rotateX(-Math.PI / 2);
  geometry.setAttribute('shadowStyle', style);
  const material = new THREE.ShaderMaterial({
    uniforms: { ground: { value: ground }, time: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec3 shadowStyle;
      uniform sampler2D ground;
      uniform float time;
      varying vec2 mark;
      varying vec3 style;
      varying vec3 world;
      void main() {
        mark = uv * 2.0 - 1.0;
        style = shadowStyle;
        world = (instanceMatrix * vec4(position, 1.0)).xyz;
        float height = texture2D(ground, world.xz / ${extent * 2}.0 + 0.5).r;
        if (style.x > 1.5) {
          world.y = ${water} + 0.012 + sin(world.x * 1.1 + time * 0.7)
            * cos(world.z * 0.8 + time * 0.4) * 0.055;
        } else {
          world.y = (height < -0.5 ? world.y : height) + 0.012;
        }
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D ground;
      varying vec2 mark;
      varying vec3 style;
      varying vec3 world;
      float shape(vec2 p, vec2 halfSize) {
        vec2 d = abs(p) - halfSize;
        return 1.0 - smoothstep(0.0, 0.13, length(max(d, 0.0)));
      }
      void main() {
        float height = texture2D(ground, world.xz / ${extent * 2}.0 + 0.5).r;
        bool sea = style.x > 1.5;
        if (style.y < 0.001 || (sea && height > -0.5) ||
            (!sea && (height < -0.5 || abs(world.y - height) > 0.07))) discard;
        float alpha = 1.0 - smoothstep(0.16, 1.0, length(mark));
        if (style.x > 0.5 && !sea) {
          float body = shape(mark - vec2(0.0, 0.09), vec2(0.45, 0.32));
          float head = 1.0 - smoothstep(0.87, 1.05,
            length((mark - vec2(0.0, 0.59)) / vec2(0.39, 0.28)));
          float legs = shape(vec2(abs(mark.x) - 0.23, mark.y + 0.5), vec2(0.15, 0.30));
          alpha = mix(alpha, max(body, max(head, legs)), style.z);
        }
        gl_FragColor = vec4(0.075, 0.13, 0.15, alpha * style.y);
      }
    `,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const transform = new THREE.Object3D();
  function place(
    index: number,
    x: number,
    y: number,
    z: number,
    w: number,
    l: number,
    angle: number,
  ) {
    transform.position.set(x, y, z);
    transform.scale.set(w, 1, l);
    transform.rotation.y = angle;
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  }
  return {
    mesh,
    ground,
    setSurface(domain: ReturnType<typeof createWorldDomain>) {
      const point = { x: 0, z: 0 };
      for (let z = 0; z < size; z++) {
        point.z = ((z + 0.5) / size - 0.5) * extent * 2;
        for (let x = 0; x < size; x++) {
          point.x = ((x + 0.5) / size - 0.5) * extent * 2;
          elevations[z * size + x] = domain.surface(point) ?? water;
        }
      }
      ground.needsUpdate = true;
    },
    update(
      camera: THREE.Camera,
      sun: THREE.DirectionalLight,
      night: number,
      time: number,
      mobile: boolean,
    ) {
      material.uniforms.time!.value = time;
      const horizontal = Math.hypot(sun.position.x, sun.position.z);
      const dx = -sun.position.x / horizontal;
      const dz = -sun.position.z / horizontal;
      const angle = Math.atan2(-dx, -dz);
      people.forEach(({ position, scale }, i) => {
        place(
          i,
          position.x,
          position.y,
          position.z,
          0.23 * scale.x,
          0.17 * scale.x,
          0,
        );
        style.setXYZ(i, 0, 0.31 - night * 0.13, 0);
        const length = Math.min(
          2.6,
          (1.5 * scale.y * horizontal) / Math.max(5, sun.position.y),
        );
        const distance = camera.position.distanceTo(position);
        const detail = mobile
          ? 0
          : 1 - THREE.MathUtils.smoothstep(distance, 15, 26);
        place(
          people.length + i,
          position.x + dx * length * 0.43,
          position.y,
          position.z + dz * length * 0.43,
          0.27 * scale.x,
          length * 0.59,
          angle,
        );
        style.setXYZ(
          people.length + i,
          1,
          (0.17 + detail * 0.08) * (1 - night) ** 2,
          detail,
        );
      });
      boats.forEach(({ position, rotation }, i) => {
        const index = people.length * 2 + i;
        place(
          index,
          position.x,
          position.y,
          position.z,
          0.31,
          0.61,
          rotation.y,
        );
        style.setXYZ(index, 2, 0.27 - night * 0.13, 0);
      });
      style.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
