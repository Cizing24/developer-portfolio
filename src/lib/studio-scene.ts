import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  directIslandView,
  projectFacilities,
  type IslandId,
  type DayPhase,
} from './world-config';
import { phaseLight, pigments as art } from './studio-art';
import { createMovingShadows } from './studio-shadows';
import type { ProjectId } from './project-introductions';
import { createWander, rectangleArea } from './wander';
import { createNavigation, createPedestrian } from './navigation';
import {
  islandLayout,
  islandRadii,
  bridgePairs,
  bridgeDecks,
  isAccessLane,
  createWorldDomain,
  createSeaDomain,
  reefIslands,
  portfolioExhibits,
} from './world-map';

export interface StudioScene {
  firstFrame(): void;
  focusIsland(id: IslandId, animated?: boolean): Promise<void>;
  overview(animated?: boolean): Promise<void>;
  zoom(factor: number): void;
  focusAvatar(): Promise<void>;
  setPhase(phase: DayPhase, animated?: boolean): void;
  setVisible(value: boolean): void;
  setReducedMotion(value: boolean): void;
  setMotion(value: boolean): void;
  dispose(): void;
}

export function createStudioScene(
  container: HTMLElement,
  labels: HTMLButtonElement[],
  onSelect: (index: number) => void,
  onContextLost: () => void,
  onEnter: (id: IslandId) => void,
): StudioScene {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  try {
    return buildScene(
      renderer,
      container,
      labels,
      onSelect,
      onContextLost,
      onEnter,
    );
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    throw error;
  }
}

function buildScene(
  renderer: THREE.WebGLRenderer,
  container: HTMLElement,
  labels: HTMLButtonElement[],
  onSelect: (index: number) => void,
  onContextLost: () => void,
  onEnter: (id: IslandId) => void,
): StudioScene {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const noon = phaseLight.noon;
  const skyColor = new THREE.Color(noon.sky);
  const fog = new THREE.FogExp2(noon.sky, noon.fog);
  let fogDensity = noon.fog;
  scene.background = skyColor;
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 220);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = 1.2;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  renderer.domElement.style.touchAction = 'none';
  const sun = new THREE.DirectionalLight(noon.sun, noon.power);
  sun.position.set(...noon.position);
  sun.shadow.intensity = noon.shade;
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -27,
    right: 27,
    top: 25,
    bottom: -25,
  });
  sun.shadow.bias = -0.001;
  const hemi = new THREE.HemisphereLight(
    noon.ambientSky,
    noon.ambientGround,
    noon.ambient,
  );
  scene.add(sun, hemi);
  const cream = art.limestone,
    wine = 0x982d36,
    sage = art.foliage[1],
    ink = art.ink,
    gold = art.brass,
    rose = 0xd9ad9b;
  const woodFinish = { roughness: 0.78, metalness: 0 };
  const steelFinish = { roughness: 0.46, metalness: 0.22 };
  const matteFinish = { roughness: 0.92, metalness: 0 };
  function finish(color: number) {
    if (color === art.timber || color === art.bark) return woodFinish;
    if (color === art.steel || color === gold) return steelFinish;
    return matteFinish;
  }
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  function material(color: number) {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          ...finish(color),
        }),
      );
    return materials.get(color)!;
  }
  function mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    color: number,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const object = new THREE.Mesh(geometry, material(color));
    object.position.set(x, y, z);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    color: number,
    x = 0,
    y = 0,
    z = 0,
  ) {
    return mesh(parent, new THREE.BoxGeometry(w, h, d), color, x, y, z);
  }
  function cylinder(
    parent: THREE.Object3D,
    r: number,
    h: number,
    color: number,
    x = 0,
    y = 0,
    z = 0,
    sides = 24,
  ) {
    return mesh(
      parent,
      new THREE.CylinderGeometry(r, r, h, sides),
      color,
      x,
      y,
      z,
    );
  }
  function turf(
    parent: THREE.Object3D,
    radius: number,
    height: number,
    y: number,
    sides: number,
    color: number = art.grass,
  ) {
    const lawn = cylinder(parent, radius, height, color, 0, y, 0, sides);
    const vertices = lawn.geometry.attributes.position!;
    const grass = new THREE.Color(color);
    const dry = new THREE.Color(art.dryGrass);
    const tint = new THREE.Color();
    const values = new Float32Array(vertices.count * 3);
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i) / radius;
      const z = vertices.getZ(i) / radius;
      const edge = Math.hypot(x, z);
      const variation =
        0.45 + 0.36 * Math.sin(5 * x + 2 * z) + 0.17 * Math.cos(6 * z - x);
      tint
        .copy(grass)
        .lerp(dry, edge * variation * 0.78)
        .toArray(values, i * 3);
    }
    lawn.geometry.setAttribute('color', new THREE.BufferAttribute(values, 3));
    return lawn;
  }
  const windows = new THREE.MeshStandardMaterial({
    color: 0xe9b76b,
    emissive: 0xffb753,
    emissiveIntensity: 0.08,
    roughness: 0.45,
  });
  const screens = new THREE.MeshStandardMaterial({
    color: 0x8fbbba,
    emissive: 0x73bbc5,
    emissiveIntensity: 0.14,
    roughness: 0.35,
  });
  const roots = new Map<IslandId, THREE.Group>();
  const facilities = { bookflow: [], assetflow: [] } as Record<
    ProjectId,
    THREE.Mesh[]
  >;
  const facilityGeometry = new THREE.BoxGeometry(1.85, 2, 1.45);
  const facilityMaterial = new THREE.MeshBasicMaterial();
  function createProject(id: ProjectId) {
    const world = new THREE.Group();
    const ground = new THREE.Group();
    world.add(ground);
    const bookflow = id === 'bookflow';
    const trim = bookflow ? art.coral : art.teal;
    cylinder(ground, 7.1, 0.45, art.stone, 0, -0.43, 0, 14).scale.z = 0.64;
    cylinder(ground, 6.9, 0.25, art.sand, 0, -0.1, 0, 14).scale.z = 0.64;
    turf(ground, 6.5, 0.1, 0.03, 14, bookflow ? art.olive : art.grass).scale.z =
      0.64;
    // Walkways connect the facilities to the island landings.
    box(ground, 8.4, 0.035, 0.38, cream, 0, 0.064, -1.65);
    box(ground, 8.4, 0.035, 0.38, cream, 0, 0.064, 1.7);
    box(ground, 0.38, 0.035, 3.35, cream, 4, 0.064, 0);
    box(ground, 0.38, 0.035, 3.35, cream, -4, 0.064, 0);
    for (const x of [-6, 6])
      for (const z of [-3.4, 3.4])
        cylinder(ground, 0.055, 0.04, gold, x, 0.03, z);
    function tree(x: number, z: number, size: number) {
      cylinder(ground, 0.07, 0.55 * size, art.bark, x, 0.27 * size, z, 8);
      const canopy = mesh(
        ground,
        new THREE.IcosahedronGeometry(0.38 * size, 0),
        art.foliage[Math.abs(Math.round(x * 7 + z * 13)) % art.foliage.length]!,
        x,
        0.7 * size,
        z,
      );
      canopy.userData.canopy = true;
      cylinder(ground, 0.27 * size, 0.18, art.sand, x, 0.08, z, 8);
    }
    [
      [-5.6, -2.4],
      [-4.9, -2.7],
      [4.9, -2.8],
      [5.5, -2.2],
      [-5.5, 2.5],
      [5.5, 2.5],
    ].forEach(([x, z], i) => tree(x!, z!, 0.8 + (i % 3) * 0.18));
    const screen = 0x8fbbba;
    function terminal(parent: THREE.Group, x: number, y: number, z: number) {
      box(parent, 0.57, 0.34, 0.09, ink, x, y, z);
      box(parent, 0.47, 0.24, 0.025, screen, x, y, z + 0.055).material =
        screens;
      box(parent, 0.55, 0.05, 0.33, ink, x, y - 0.18, z + 0.1);
    }
    const ringGeometry = new THREE.TorusGeometry(0.99, 0.041, 6, 24);
    const models = projectFacilities[id].map(({ x, z }, index) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      world.add(group);
      cylinder(group, 1.18, 0.22, art.sand, 0, 0.12, 0, 6);
      cylinder(group, 1.1, 0.07, cream, 0, 0.26, 0, 6);
      const ring = new THREE.Mesh(
        ringGeometry.clone(),
        new THREE.MeshStandardMaterial({
          color: trim,
          emissive: trim,
          emissiveIntensity: 0.17,
          roughness: 0.85,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.31;
      ring.userData.animated = true;
      group.add(ring);

      const proxy = new THREE.Mesh(facilityGeometry, facilityMaterial);
      proxy.name = `facility-${id}-${index}`;
      proxy.position.y = 1.28;
      proxy.visible = false;
      proxy.userData.ring = ring;
      group.add(proxy);
      facilities[id].push(proxy);

      const model = new THREE.Group();
      model.position.y = 0.31;
      group.add(model);
      return model;
    });
    ringGeometry.dispose();
    const [entry, counter, systems] = models as [
      THREE.Group,
      THREE.Group,
      THREE.Group,
    ];
    if (bookflow) {
      // Booking counter with a striped canopy and customer terminal.
      box(entry, 1.45, 0.66, 0.69, cream, 0, 0.35);
      box(entry, 1.62, 0.12, 0.82, trim, 0, 0.72);
      for (const x of [-0.68, 0.68])
        box(entry, 0.08, 1, 0.08, ink, x, 1.21, -0.28);
      for (let i = 0; i < 6; i++)
        box(
          entry,
          0.28,
          0.12,
          0.92,
          i % 2 ? cream : trim,
          (i - 2.5) * 0.28,
          1.74,
        );
      terminal(entry, 0.19, 0.97, 0.14);
      box(entry, 0.58, 0.12, 0.045, gold, -0.26, 0.45, 0.36);

      // A desk beneath a wall calendar. Color blocks mark bookings and time off.
      box(counter, 1.55, 0.13, 0.75, art.timber, 0, 0.65);
      for (const x of [-0.62, 0.62]) box(counter, 0.1, 0.67, 0.6, ink, x, 0.33);
      box(counter, 1.45, 1.04, 0.1, cream, 0, 1.22, -0.3);
      box(counter, 1.45, 0.21, 0.12, trim, 0, 1.7, -0.24);
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 4; col++)
          box(
            counter,
            0.24,
            0.18,
            0.045,
            (row + col) % 3 ? art.steel : trim,
            (col - 1.5) * 0.29,
            1.06 + row * 0.26,
            -0.22,
          );
      terminal(counter, -0.42, 0.9, 0.18);
    } else {
      // Equipment shelf with open laptops and upright desktop towers.
      for (const x of [-0.72, 0.72]) box(entry, 0.09, 1.68, 0.69, ink, x, 0.84);
      for (const y of [0.2, 0.77, 1.36])
        box(entry, 1.53, 0.085, 0.73, art.steel, 0, y);
      for (const x of [-0.37, 0.37]) {
        terminal(entry, x, 1.01, 0.08);
        box(entry, 0.38, 0.41, 0.42, x < 0 ? ink : art.steel, x, 0.45);
        box(entry, 0.11, 0.04, 0.035, gold, x, 0.54, 0.22);
      }

      // Two trays and a terminal give the handover desk distinct sides.
      box(counter, 1.64, 0.61, 0.69, art.steel, 0, 0.32);
      box(counter, 1.8, 0.14, 0.89, trim, 0, 0.68);
      terminal(counter, 0, 1.07, -0.23);
      for (const x of [-0.56, 0.56]) {
        box(counter, 0.47, 0.08, 0.4, x < 0 ? sage : rose, x, 0.8, 0.15);
        box(counter, 0.34, 0.05, 0.26, cream, x, 0.87, 0.15);
        box(counter, 0.49, 0.12, 0.05, x < 0 ? art.steel : gold, x, 0.42, 0.36);
      }
    }
    // Server bays and a service monitor distinguish both engineering rooms.
    box(systems, 1.55, 1.62, 0.76, trim, 0, 0.82);
    box(systems, 1.65, 0.08, 0.82, gold, 0, 1.65);
    for (let row = 0; row < 4; row++) {
      const y = 0.38 + row * 0.28;
      box(systems, 1.24, 0.17, 0.09, 0x465449, 0, y, 0.4);
      box(systems, 0.09, 0.06, 0.04, screen, 0.44, y, 0.46).material =
        row === 2 ? windows : screens;
    }
    if (!bookflow) terminal(systems, 0, 1.91, 0.04);
    // Forested ridges, small workshops and a harbor give the system a landscape.
    for (let i = 0; i < 22; i++) {
      if (i === 0 || i === 11) continue; // Clear landings on both sides.
      const angle = (i / 22) * Math.PI * 2;
      const x = Math.cos(angle) * 5.8;
      const z = Math.sin(angle) * 3.6;
      tree(x, z, 0.65 + (i % 4) * 0.15);
    }
    for (let i = 0; i < 5; i++) {
      const ridge = mesh(
        ground,
        new THREE.ConeGeometry(1.1 + i * 0.06, 1.2 + (i % 3) * 0.5, 5),
        sage,
        -3.5 + i * 1.7,
        0.5,
        -3.3,
      );
      ridge.rotation.y = i * 0.8;
    }
    const harbor = new THREE.Group();
    ground.add(harbor);
    box(harbor, 2.4, 0.12, 1.2, art.timber, 0, -0.01, 4.2);
    for (const x of [-0.95, 0.95])
      cylinder(harbor, 0.07, 0.7, ink, x, -0.2, 4.5, 8);
    cylinder(harbor, 0.28, 1.3, cream, 1.6, 0.6, 3.6, 12);
    cylinder(harbor, 0.3, 0.18, trim, 1.6, 1, 3.6, 12);
    mesh(harbor, new THREE.ConeGeometry(0.4, 0.32, 12), trim, 1.6, 1.43, 3.6);

    world.scale.setScalar(0.64);
    world.userData.island = id;
    scene.add(world);
    roots.set(id, world);
    return world;
  }
  createProject('bookflow');
  createProject('assetflow');
  function pane(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    glazing = windows,
  ) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glazing);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }
  function plant(parent: THREE.Object3D, x: number, z: number, size = 0.8) {
    cylinder(parent, 0.07, 0.55 * size, art.bark, x, 0.25 * size, z, 6);
    const leaf = mesh(
      parent,
      new THREE.IcosahedronGeometry(0.45 * size, 0),
      art.foliage[Math.abs(Math.round(x * 11 + z * 7)) % art.foliage.length]!,
      x,
      0.8 * size,
      z,
    );
    leaf.userData.canopy = true;
  }
  function utility(id: IslandId) {
    const group = new THREE.Group();
    group.userData.island = id;
    const extra = id === 'portfolio' ? 0.8 : id === 'journal' ? 0.65 : 0;
    cylinder(group, 3.3 + extra, 0.5, art.stone, 0, -0.55, 0, 10);
    cylinder(group, 3.15 + extra, 0.18, art.sand, 0, -0.23, 0, 10);
    turf(
      group,
      2.95 + extra,
      0.16,
      -0.06,
      10,
      id === 'zailongchang' ? art.olive : art.grass,
    );
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI / 4 + (i / 4) * Math.PI * 2;
      if (
        isAccessLane(
          id,
          Math.cos(angle) * (2.85 + extra),
          Math.sin(angle) * (2.85 + extra),
        )
      )
        continue;
      plant(
        group,
        Math.cos(angle) * (2.85 + extra),
        Math.sin(angle) * (2.85 + extra),
        0.65 + (i % 3) * 0.15,
      );
    }
    scene.add(group);
    roots.set(id, group);
    return group;
  }
  const portfolio = utility('portfolio');
  for (const z of [-1.35, 1.35])
    box(portfolio, 2.9, 0.012, 0.32, art.sand, 0, 0.017, z);
  for (const x of [-1.45, 1.45])
    box(portfolio, 0.32, 0.012, 2.38, art.sand, x, 0.017, 0);
  const pavilion = new THREE.Group();
  pavilion.userData.hotspot = 0;
  portfolio.add(pavilion);
  box(pavilion, 3.2, 0.2, 2.4, cream, 0, 0.18);
  for (const x of [-1.3, 1.3])
    for (const z of [-0.85, 0.85])
      box(pavilion, 0.13, 1.55, 0.13, art.teal, x, 0.95, z);
  const canopy = mesh(
    pavilion,
    new THREE.CylinderGeometry(0, 2.3, 0.8, 4),
    art.teal,
    0,
    1.9,
  );
  canopy.rotation.y = Math.PI / 4;
  canopy.scale.z = 0.8;
  box(pavilion, 2.6, 0.11, 1.74, cream, 0, 1.49);
  cylinder(pavilion, 0.085, 0.17, gold, 0, 2.33, 0, 8);
  for (const [i, { x, z }] of portfolioExhibits.entries()) {
    const display = new THREE.Group();
    display.userData.hotspot = i;
    display.position.set(x, 0, z);
    portfolio.add(display);
    box(display, 0.8, 0.12, 0.6, ink, 0, 0.5, 0);
    box(display, 0.12, 0.5, 0.12, ink, 0, 0.25, 0);
    box(display, 0.7, 0.55, 0.08, [wine, ink, gold, rose][i]!, 0, 0.83, -0.2);
    pane(display, 0.53, 0.35, 0.02, 0, 0.86, -0.15, screens);
  }
  const journal = utility('journal');
  for (const [i, x] of [-0.85, 0.85].entries()) {
    const library = new THREE.Group();
    library.userData.hotspot = i;
    journal.add(library);
    library.position.x = x;
    box(library, 1.25, 1.45, 1, cream, 0, 0.8);
    box(library, 1.4, 0.16, 1.15, art.violet, 0, 1.57);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 4; col++)
        box(
          library,
          0.15,
          0.24,
          0.08,
          [art.violet, ink, gold, rose][(row + col) % 4]!,
          -0.36 + col * 0.24,
          0.4 + row * 0.35,
          0.55,
        );
    pane(library, 0.28, 0.3, 0.03, 0, 1.24, -0.52);
  }
  const contact = utility('contact');
  const post = new THREE.Group();
  post.userData.hotspot = 0;
  contact.add(post);
  box(post, 2.2, 1.4, 1.6, cream, 0, 0.75);
  const postRoof = mesh(
    post,
    new THREE.CylinderGeometry(0, 1.8, 0.75, 4),
    art.ochre,
    0,
    1.8,
  );
  postRoof.rotation.y = Math.PI / 4;
  box(post, 1.08, 0.13, 0.045, art.ochre, 0, 1.27, 0.83);
  box(post, 0.5, 0.85, 0.05, ink, 0, 0.5, 0.83);
  for (const x of [-0.7, 0.7]) pane(post, 0.43, 0.48, 0.04, x, 1, 0.83);
  cylinder(post, 0.04, 2.4, ink, 1.8, 1.2, -0.5, 6);
  const aerial = mesh(
    post,
    new THREE.TorusGeometry(0.35, 0.025, 5, 24),
    gold,
    1.8,
    2.3,
    -0.5,
  );
  aerial.rotation.y = 0.3;
  const about = utility('about');
  const desk = new THREE.Group();
  about.add(desk);
  desk.position.set(1, 0, 0.7);
  box(desk, 1.8, 0.16, 0.95, gold, 0, 0.85);
  for (const x of [-0.7, 0.7]) box(desk, 0.12, 0.8, 0.6, ink, x, 0.4);
  const laptop = new THREE.Group();
  laptop.position.copy(desk.position);
  about.add(laptop);
  box(laptop, 0.8, 0.05, 0.6, art.steel, 0, 0.98);
  box(laptop, 0.8, 0.5, 0.05, ink, 0, 1.23, -0.2);
  pane(laptop, 0.65, 0.35, 0.02, 0, 1.25, -0.16, screens);
  const shirts = [0xb25253, 0x355e70, 0xcb8744, 0x6b6489];
  const skins = [0xe4b491, 0xc88e69, 0x996a53, 0xedc6a2];
  const hairColors = [0x362e2c, 0x242b34, 0x433127, 0x6e4836];
  const headGeometry = new THREE.SphereGeometry(0.215, 9, 6);
  const hairGeometry = new THREE.SphereGeometry(
    0.225,
    9,
    5,
    0,
    Math.PI * 2,
    0,
    1.75,
  );
  const glassesGeometry = new THREE.TorusGeometry(0.08, 0.014, 4, 10);
  const colorMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
  });
  function coloredParts(group: THREE.Group) {
    group.updateMatrixWorld(true);
    const origin = group.matrixWorld.clone().invert();
    const parts: THREE.BufferGeometry[] = [];
    group.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const part = child.geometry.index
        ? child.geometry.toNonIndexed()
        : child.geometry.clone();
      part.applyMatrix4(origin.clone().multiply(child.matrixWorld));
      const color = (child.material as THREE.MeshStandardMaterial).color;
      const values = new Float32Array(part.attributes.position!.count * 3);
      for (let i = 0; i < values.length; i += 3) color.toArray(values, i);
      part.setAttribute('color', new THREE.BufferAttribute(values, 3));
      parts.push(part);
    });
    const result = mergeGeometries(parts)!;
    parts.forEach((part) => part.dispose());
    group.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        ![headGeometry, hairGeometry, glassesGeometry].includes(child.geometry)
      )
        child.geometry.dispose();
    });
    group.clear();
    return result;
  }
  const torsos = new Map<number, THREE.BufferGeometry>();
  function person(variant: number, creator = false) {
    const shirt = creator ? 0x293f50 : shirts[variant]!;
    const group = new THREE.Group();
    group.userData.animated = true;
    scene.add(group);
    group.scale.setScalar(creator ? 0.93 : 0.56);
    const key = creator ? -1 : variant;
    if (!torsos.has(key)) {
      const upper = new THREE.Group();
      box(upper, 0.42, 0.44, 0.28, shirt, 0, 0.68);
      box(upper, 0.32, 0.11, 0.24, ink, 0, 0.46);
      mesh(upper, headGeometry, skins[variant]!, 0, 1.08);
      mesh(upper, hairGeometry, hairColors[variant]!, 0, 1.12, -0.025);
      box(upper, 0.12, 0.09, 0.025, creator ? gold : cream, 0.1, 0.78, 0.143);
      if (creator) {
        for (const x of [-0.096, 0.096])
          mesh(upper, glassesGeometry, 0x29383d, x, 1.1, 0.194);
        box(upper, 0.056, 0.023, 0.026, ink, 0, 1.11, 0.207);
        box(upper, 0.32, 0.37, 0.14, wine, 0, 0.7, -0.19);
      }
      torsos.set(key, coloredParts(upper));
    }
    const torso = new THREE.Mesh(torsos.get(key)!, colorMaterial);
    group.add(torso);
    const arms: THREE.Mesh[] = [];
    const legs: THREE.Mesh[] = [];
    const shoes: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const arm = box(group, 0.12, 0.36, 0.13, shirt, side * 0.265, 0.8);
      arm.geometry.translate(0, -0.13, 0);
      arms.push(arm);
      const leg = box(group, 0.135, 0.37, 0.15, ink, side * 0.115, 0.44);
      leg.geometry.translate(0, -0.19, 0);
      legs.push(leg);
      shoes.push(
        box(group, 0.16, 0.08, 0.24, 0x263638, side * 0.115, 0.04, 0.045),
      );
    }
    group.traverse((child) => {
      if (child instanceof THREE.Mesh)
        child.castShadow = child.receiveShadow = false;
    });
    return { group, arms, legs, shoes, torso, shirt, stride: 0 };
  }
  const creator = person(0, true);
  const walkers: {
    model: ReturnType<typeof person>;
    offset: number;
    home: IslandId;
    motion?: ReturnType<typeof createPedestrian>;
  }[] = [];
  const localIsland = utility('zailongchang');
  localIsland.scale.setScalar(1.35);
  const village = new THREE.Group();
  village.userData.hotspot = 0;
  localIsland.add(village);
  box(village, 2.2, 1.3, 1.5, cream, 0, 0.65, -0.5);
  box(village, 2.5, 0.12, 1.8, art.clay, 0, 1.38, -0.5);
  box(village, 2.16, 0.16, 1.43, art.copper, 0, 1.5, -0.5);
  box(village, 0.45, 0.85, 0.05, ink, 0, 0.45, 0.27);
  pane(village, 0.42, 0.5, 0.05, -0.7, 0.8, 0.28);
  pane(village, 0.42, 0.5, 0.05, 0.7, 0.8, 0.28);
  box(village, 0.8, 0.8, 1, art.clay, -1.7, 0.4, -1);
  // A shore-side pier with two arms leaves an open berth for boats.
  for (const z of [-0.7, 0.7]) {
    box(localIsland, 1.8, 0.12, 0.3, art.timber, 3.3, -0.35, z);
    for (const x of [2.65, 3.95])
      cylinder(localIsland, 0.06, 0.6, ink, x, -0.25, z, 6);
  }
  box(localIsland, 0.3, 0.12, 1.7, art.timber, 2.55, -0.35, 0);
  for (const [islandIndex, [id, island]] of [...roots].entries()) {
    for (let i = 0; i < (id === 'about' ? 2 : 4); i++) {
      const model = person((i + islandIndex) % shirts.length);
      walkers.push({
        model,
        offset: i * 1.6,
        home: id,
      });
    }
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const radius =
        id === 'bookflow' || id === 'assetflow'
          ? 5.5
          : id === 'portfolio'
            ? 3.85
            : id === 'journal'
              ? 3.7
              : 3.05;
      const x = Math.cos(angle) * radius,
        z =
          Math.sin(angle) *
          radius *
          (id === 'bookflow' || id === 'assetflow' ? 0.61 : 1);
      if (isAccessLane(id, x, z)) continue;
      cylinder(island, 0.035, 0.8, ink, x, 0.4, z, 6);
      const lamp = mesh(
        island,
        new THREE.SphereGeometry(0.1, 8, 6),
        gold,
        x,
        0.85,
        z,
      );
      lamp.material = windows;
      if (i === 0) {
        const glow = new THREE.PointLight(0xffca80, 0, 5, 2);
        glow.position.set(x, 1.2, z);
        island.add(glow);
      }
    }
  }
  const people = [...walkers.map(({ model }) => model), creator];
  const distantFigure = new THREE.Group();
  box(distantFigure, 0.55, 0.43, 0.27, 0xffffff, 0, 0.68);
  box(distantFigure, 0.28, 0.43, 0.19, 0x45595f, 0, 0.22);
  mesh(distantFigure, headGeometry, 0xf1dbc4, 0, 1.08);
  mesh(distantFigure, hairGeometry, 0x524742, 0, 1.12, -0.025);
  const distantPeople = new THREE.InstancedMesh(
    coloredParts(distantFigure),
    colorMaterial,
    people.length,
  );
  distantPeople.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  distantPeople.frustumCulled = false;
  people.forEach(({ shirt }, i) =>
    distantPeople.setColorAt(
      i,
      new THREE.Color(shirt).lerp(new THREE.Color(0xffffff), 0.48),
    ),
  );
  scene.add(distantPeople);
  const emptyFigure = new THREE.Matrix4().makeScale(0, 0, 0);

  // Bake opaque pigments into shared finishes without merging separate click targets.
  const paintedFinishes = new Map(
    [matteFinish, woodFinish, steelFinish].map((surface) => [
      surface,
      new THREE.MeshStandardMaterial({ ...surface, vertexColors: true }),
    ]),
  );
  for (const island of roots.values()) {
    island.updateMatrixWorld(true);
    const inverse = island.matrixWorld.clone().invert();
    const batches = new Map<
      string,
      {
        material: THREE.Material;
        hotspot?: number;
        parts: THREE.BufferGeometry[];
        originals: THREE.Mesh[];
      }
    >();
    island.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material))
        return;
      let parent: THREE.Object3D | null = object;
      let hotspot: number | undefined;
      while (parent && parent !== island) {
        if (
          !parent.visible ||
          parent.userData.canopy ||
          parent.userData.animated
        )
          return;
        if (parent.userData.hotspot !== undefined)
          hotspot = parent.userData.hotspot as number;
        parent = parent.parent;
      }
      const pigment =
        object.material instanceof THREE.MeshStandardMaterial &&
        object.material !== windows &&
        object.material !== screens
          ? object.material.color
          : undefined;
      const surface = pigment
        ? paintedFinishes.get(finish(pigment.getHex()))!
        : object.material;
      const key = `${surface.uuid}:${hotspot ?? 'island'}`;
      let batch = batches.get(key);
      if (!batch) {
        batch = {
          material: surface,
          hotspot,
          parts: [],
          originals: [],
        };
        batches.set(key, batch);
      }
      const transformed = object.geometry
        .clone()
        .applyMatrix4(inverse.clone().multiply(object.matrixWorld));
      const geometry = transformed.index
        ? transformed.toNonIndexed()
        : transformed;
      if (geometry !== transformed) transformed.dispose();
      if (pigment && !geometry.hasAttribute('color')) {
        const values = new Float32Array(
          geometry.attributes.position!.count * 3,
        );
        for (let i = 0; i < values.length; i += 3) pigment.toArray(values, i);
        geometry.setAttribute('color', new THREE.BufferAttribute(values, 3));
      }
      batch.parts.push(geometry);
      batch.originals.push(object);
    });
    for (const batch of batches.values()) {
      const geometry = mergeGeometries(batch.parts);
      batch.parts.forEach((part) => part.dispose());
      if (!geometry) continue;
      const combined = new THREE.Mesh(geometry, batch.material);
      combined.castShadow = combined.receiveShadow = true;
      if (batch.hotspot !== undefined)
        combined.userData.hotspot = batch.hotspot;
      island.add(combined);
      batch.originals.forEach((original) => {
        original.removeFromParent();
        original.geometry.dispose();
      });
    }
  }
  const bridgeRoot = new THREE.Group();
  scene.add(bridgeRoot);
  let creatorMotion: ReturnType<typeof createPedestrian>;
  let boatMotion: ReturnType<typeof createPedestrian>[] = [];
  let peerMotions: ReturnType<typeof createPedestrian>[] = [];
  let dock = -1,
    dockOutbound = false;
  let bridgeCrossings = 0,
    harborVisits = 0;
  const worldLayouts = new Map<boolean, ReturnType<typeof buildLayout>>();
  function buildLayout(portrait: boolean) {
    const map = islandLayout(portrait);
    const decks = bridgeDecks(map);
    const domain = createWorldDomain(map, decks);
    return {
      map,
      decks,
      domain,
      pedestrian: createNavigation(domain, 0.17),
      creator: createNavigation(domain, 0.4),
      sea: createNavigation(createSeaDomain(map), 0.55, 0.4),
    };
  }
  let currentLayout: ReturnType<typeof buildLayout>;
  let portraitLayout: boolean | undefined;
  function layout(portrait: boolean) {
    if (portraitLayout === portrait) return;
    portraitLayout = portrait;
    fog.density = fogDensity * (portrait ? 0.72 : 1);
    const world = worldLayouts.get(portrait) ?? buildLayout(portrait);
    worldLayouts.set(portrait, world);
    currentLayout = world;
    const {
      map,
      decks,
      domain,
      pedestrian: pedestrianNavigation,
      creator: creatorNavigation,
      sea: seaNavigation,
    } = world;
    updateCoast(map);
    for (const [id, island] of roots) {
      const { x, z } = map[id];
      island.position.set(
        x,
        id === 'bookflow' || id === 'assetflow' ? -0.18 : 0,
        z,
      );
    }
    bridgeRoot.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    bridgeRoot.clear();
    for (const { left, right, height } of decks) {
      for (let i = 1; i < left.length; i++) {
        const outline = [left[i - 1]!, left[i]!, right[i]!, right[i - 1]!];
        const shape = new THREE.Shape(
          outline.map((p) => new THREE.Vector2(p.x, -p.z)),
        );
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.12,
          bevelEnabled: false,
        })
          .rotateX(-Math.PI / 2)
          .translate(0, -0.12, 0);
        const positions = geometry.attributes.position!;
        for (let j = 0; j < positions.count; j++) {
          const p = { x: positions.getX(j), z: positions.getZ(j) };
          positions.setY(j, positions.getY(j) + height(p));
        }
        geometry.computeVertexNormals();
        mesh(bridgeRoot, geometry, art.timber);
      }
      for (const edge of [left, right]) {
        for (let i = 1; i < edge.length; i++) {
          const from = edge[i - 1]!,
            to = edge[i]!;
          const length = Math.hypot(to.x - from.x, to.z - from.z);
          const rail = new THREE.Group();
          bridgeRoot.add(rail);
          rail.position.set((from.x + to.x) / 2, 0, (from.z + to.z) / 2);
          rail.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
          const bar = box(
            rail,
            0.035,
            0.035,
            Math.hypot(length, height(to) - height(from)),
            cream,
            0,
            (height(from) + height(to)) / 2 + 0.45,
          );
          bar.rotation.x = Math.atan2(height(from) - height(to), length);
          const posts = Math.max(1, Math.ceil(length / 1.25));
          for (let j = 0; j <= posts; j++) {
            const t = j / posts;
            const z = length * (t - 0.5);
            const y = THREE.MathUtils.lerp(height(from), height(to), t);
            box(rail, 0.045, 0.45, 0.045, ink, 0, y + 0.22, z);
            pane(rail, 0.045, 0.04, 0.16, 0, y + 0.45, z);
          }
        }
      }
    }
    bridgeRoot.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    bridgeRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material))
        return;
      const part = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone();
      part.applyMatrix4(object.matrixWorld);
      object.geometry.dispose();
      const list = batches.get(object.material) ?? [];
      list.push(part);
      batches.set(object.material, list);
    });
    bridgeRoot.clear();
    for (const [material, parts] of batches) {
      const geometry = mergeGeometries(parts)!;
      parts.forEach((part) => part.dispose());
      const batch = new THREE.Mesh(geometry, material);
      batch.castShadow = batch.receiveShadow = true;
      bridgeRoot.add(batch);
    }
    movingShadows.setSurface(domain);
    const occupied: { position: { x: number; z: number }; radius: number }[] =
      [];
    for (const walker of walkers) {
      const center = map[walker.home];
      const [rx, rz] = islandRadii(walker.home);
      const start = pedestrianNavigation.nearest(
        {
          x: center.x + Math.cos(walker.offset) * rx * 0.55,
          z: center.z + Math.sin(walker.offset) * rz * 0.55,
        },
        (node) =>
          Math.hypot(node.x - center.x, node.z - center.z) <
            Math.max(...islandRadii(walker.home)) &&
          !occupied.some(
            (other) =>
              Math.hypot(node.x - other.position.x, node.z - other.position.z) <
              0.55,
          ),
      );
      walker.motion = createPedestrian(
        pedestrianNavigation,
        start,
        0.4 + Math.random() * 0.2,
        Math.random,
        pedestrianNavigation.nodes.flatMap((node, index) =>
          Math.hypot((node.x - center.x) / rx, (node.z - center.z) / rz) < 0.85
            ? [index]
            : [],
        ),
      );
      occupied.push(walker.motion);
      const p = walker.motion.position;
      walker.model.group.position.set(p.x, walker.motion.height, p.z);
    }
    creatorMotion = createPedestrian(
      creatorNavigation,
      creatorNavigation.nearest(
        map.about,
        (node) =>
          !occupied.some(
            (other) =>
              Math.hypot(node.x - other.position.x, node.z - other.position.z) <
              0.7,
          ),
      ),
      0.55,
    );
    creator.group.position.set(
      creatorMotion.position.x,
      creatorMotion.height,
      creatorMotion.position.z,
    );
    // Start a real cross-island trip; later trips choose destinations freely.
    creatorMotion.goTo(creatorNavigation.nearest(map.portfolio));
    const guide = walkers.find((walker) => walker.home === 'about')!;
    guide.motion!.goTo(pedestrianNavigation.nearest(map.contact));
    boatMotion = boats.map((boat, i) => {
      const start = seaNavigation.nearest({ x: -18 + i * 5, z: -12 });
      const motion = createPedestrian(seaNavigation, start, 0.75);
      boat.position.set(motion.position.x, -0.74, motion.position.z);
      return motion;
    });
    dock = seaNavigation.nearest({
      x: map.zailongchang.x + 6.5,
      z: map.zailongchang.z,
    });
    const nearDock = seaNavigation.nearest({
      x: map.zailongchang.x + 6.5,
      z: map.zailongchang.z - 3,
    });
    boatMotion[0] = createPedestrian(seaNavigation, nearDock, 0.75);
    boatMotion[0].goTo(dock);
    boats[0]!.position.set(
      boatMotion[0].position.x,
      -0.74,
      boatMotion[0].position.z,
    );
    dockOutbound = false;
    peerMotions = [...walkers.map(({ motion }) => motion!), creatorMotion];
    ambientAccumulator = 0;
    previousPeople = peerMotions.map(snapshot);
    previousBoats = boatMotion.map(snapshot);
    container.dataset.navigation = 'ready';
    container.dataset.bridgeCount = String(bridgePairs.length);
    container.dataset.shadowMode = 'tracked';
    renderer.shadowMap.needsUpdate = true;
  }
  const waterRadius = 34;
  const coastSize = 128;
  const shallowsWidth = 1.75;
  const coastPixels = new Uint8Array(coastSize * coastSize * 2);
  const coast = new THREE.DataTexture(
    coastPixels,
    coastSize,
    coastSize,
    THREE.RGFormat,
  );
  coast.magFilter = coast.minFilter = THREE.LinearFilter;
  function updateCoast(map: ReturnType<typeof islandLayout>) {
    const shorelines = [
      ...Array.from(roots.keys(), (id) => {
        const [rx, rz] = islandRadii(id);
        return { ...map[id], rx: rx + 0.24, rz: rz + 0.24 };
      }),
      ...reefIslands.map(({ x, z, r }) => ({ x, z, rx: r, rz: r * 0.8 })),
    ];
    for (let row = 0; row < coastSize; row++) {
      const z = ((row + 0.5) / coastSize - 0.5) * waterRadius * 2;
      for (let col = 0; col < coastSize; col++) {
        const x = ((col + 0.5) / coastSize - 0.5) * waterRadius * 2;
        let distance = shallowsWidth;
        for (const shore of shorelines) {
          const edge = Math.hypot(
            (x - shore.x) / shore.rx,
            (z - shore.z) / shore.rz,
          );
          distance = Math.min(
            distance,
            (edge - 1) * Math.min(shore.rx, shore.rz),
          );
        }
        const index = (row * coastSize + col) * 2;
        coastPixels[index] =
          255 * (1 - THREE.MathUtils.smoothstep(distance, 0.04, shallowsWidth));
        // Bake static water bands with the coast so both use a single texture read.
        const band =
          Math.sin(x * 0.37 + z * 0.83) * Math.cos(x * 0.14 - z * 0.12);
        coastPixels[index + 1] = (band * 0.5 + 0.5) * 255;
      }
    }
    coast.needsUpdate = true;
  }
  const waterClock = { value: 0 };
  const waterMat = new THREE.MeshStandardMaterial({
    color: art.seaDeep,
    roughness: 0.68,
  });
  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWorldTime = waterClock;
    shader.uniforms.uCoast = { value: coast };
    shader.uniforms.uShallows = { value: new THREE.Color(art.seaShallow) };
    shader.uniforms.uHorizon = { value: skyColor };
    shader.vertexShader =
      'uniform float uWorldTime; varying vec2 waterPosition;\n' +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nwaterPosition = position.xz;\ntransformed.y += sin(position.x * 1.1 + uWorldTime * 0.7) * cos(position.z * 0.8 + uWorldTime * 0.4) * 0.055;',
    );
    shader.fragmentShader = `
      uniform sampler2D uCoast;
      uniform vec3 uShallows;
      uniform vec3 uHorizon;
      varying vec2 waterPosition;
      ${shader.fragmentShader}
    `
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec2 waterTint = texture2D(uCoast, waterPosition / ${waterRadius * 2}.0 + 0.5).rg;
        diffuseColor.rgb = mix(diffuseColor.rgb, uShallows, waterTint.r * 0.58) *
          mix(0.947, 1.053, waterTint.g);`,
      )
      .replace(
        '#include <fog_fragment>',
        `#include <fog_fragment>
        vec3 horizon = linearToOutputTexel(vec4(uHorizon, 1.0)).rgb;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, horizon,
          smoothstep(576.0, ${((waterRadius - 0.3) ** 2).toFixed(2)}, dot(waterPosition, waterPosition)));`,
      );
  };
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(waterRadius, 96).rotateX(-Math.PI / 2),
    waterMat,
  );
  water.position.y = -0.88;
  water.receiveShadow = true;
  scene.add(water);
  // A finite sea basin closes against a low archipelago; these are scenery.
  const scenery = [
    ...reefIslands,
    ...Array.from({ length: 38 }, (_, i) => {
      const angle = (i / 38) * Math.PI * 2;
      return {
        x: Math.cos(angle) * 30,
        z: Math.sin(angle) * 30,
        r: 2.8 + (i % 4) * 0.3,
      };
    }),
  ];
  const shoreGeometry = new THREE.CylinderGeometry(1, 1.12, 0.6, 9);
  const shoreMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
  });
  const shores = new THREE.InstancedMesh(
    shoreGeometry,
    shoreMaterial,
    scenery.length,
  );
  const hills = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.82, 1.6, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }),
    scenery.length,
  );
  const sceneryTransform = new THREE.Object3D();
  const reefShore = new THREE.Color(art.sand);
  const farShore = new THREE.Color(art.reef);
  const tint = new THREE.Color();
  scenery.forEach(({ x, z, r }, i) => {
    const distant = i >= reefIslands.length;
    sceneryTransform.position.set(x, distant ? -0.68 : -0.55, z);
    sceneryTransform.scale.set(r, 1, r * 0.8);
    sceneryTransform.rotation.y = i * 0.7;
    sceneryTransform.updateMatrix();
    shores.setMatrixAt(i, sceneryTransform.matrix);
    shores.setColorAt(i, distant ? farShore : reefShore);
    sceneryTransform.position.y = distant ? -0.3 : 0.25;
    sceneryTransform.scale.y = distant ? 0.44 + (i % 5) * 0.09 : 1;
    sceneryTransform.updateMatrix();
    hills.setMatrixAt(i, sceneryTransform.matrix);
    hills.setColorAt(
      i,
      tint
        .setHex(distant ? art.reef : art.foliage[i % art.foliage.length]!)
        .multiplyScalar(0.83 + (i % 4) * 0.06),
    );
  });
  shores.castShadow =
    shores.receiveShadow =
    hills.castShadow =
    hills.receiveShadow =
      true;
  scene.add(shores, hills);
  container.dataset.sceneryIslands = String(scenery.length);
  const ripples = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.26, 0.008, 4, 20),
    material(art.seaShallow),
    24,
  );
  ripples.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  ripples.receiveShadow = true;
  ripples.frustumCulled = false;
  scene.add(ripples);
  const rippleTransform = new THREE.Object3D();
  rippleTransform.rotation.x = -Math.PI / 2;
  function shapeRipples(time: number) {
    for (let i = 0; i < ripples.count; i++) {
      const radius = 0.78 + (i % 3) * 0.3;
      rippleTransform.position.set(
        Math.sin(i * 7.1) * 20,
        -0.82,
        Math.cos(i * 3.9) * 16,
      );
      rippleTransform.scale.set(
        1.9 * radius,
        radius * (1 + Math.sin(time * 0.7 + i) * 0.16),
        1,
      );
      rippleTransform.updateMatrix();
      ripples.setMatrixAt(i, rippleTransform.matrix);
    }
    ripples.instanceMatrix.needsUpdate = true;
  }
  shapeRipples(0);
  const boats: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const boat = new THREE.Group();
    scene.add(boat);
    box(boat, 0.45, 0.16, 1, i % 2 ? wine : ink);
    box(boat, 0.3, 0.35, 0.35, cream, 0, 0.23, 0.2);
    cylinder(boat, 0.025, 0.8, gold, 0, 0.4, -0.2, 6);
    boat.position.set(Math.cos(i * 1.6) * 18, -0.76, Math.sin(i * 1.6) * 15);
    boats.push(boat);
  }
  const birds: { group: THREE.Group; wings: THREE.Mesh[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const group = new THREE.Group();
    scene.add(group);
    const wings = [
      box(group, 0.24, 0.025, 0.08, cream, -0.1),
      box(group, 0.24, 0.025, 0.08, cream, 0.1),
    ];
    wings[0]!.rotation.z = -0.35;
    wings[1]!.rotation.z = 0.35;
    box(group, 0.06, 0.06, 0.18, cream);
    group.position.set(-10 + i * 3, 4.5, -8);
    birds.push({ group, wings });
  }
  const fireflies: THREE.Mesh[] = [];
  const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xffe9a4 });
  for (let i = 0; i < 18; i++) {
    const point = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 5, 4),
      fireflyMat,
    );
    point.position.set(
      Math.sin(i * 2.3) * 12,
      0.7 + (i % 4) * 0.4,
      Math.cos(i * 1.6) * 11,
    );
    point.visible = false;
    scene.add(point);
    fireflies.push(point);
  }
  const leaves: THREE.Object3D[] = [];
  const birdMotion = birds.map(({ group }) => {
    const motion = createWander(rectangleArea(18, 14), {
      speed: 1.5,
      pause: 0,
      maxDistance: 18,
    });
    group.position.set(motion.position.x, 4.5, motion.position.z);
    group.rotation.y = motion.heading;
    return motion;
  });
  const fireflyMotion = fireflies.map((fly) => ({
    origin: fly.position.clone(),
    motion: createWander(rectangleArea(1.2, 1.2), {
      speed: 0.18,
      pause: 1,
      maxDistance: 1.4,
    }),
  }));
  const pointLights: THREE.PointLight[] = [];
  for (const actor of [...boats, ...birds.map(({ group }) => group)]) {
    actor.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
  }
  const movingShadows = createMovingShadows(
    people.map(({ group }) => group),
    boats,
  );
  scene.add(movingShadows.mesh);
  scene.traverse((object) => {
    if (object.userData.canopy) leaves.push(object);
    if (object instanceof THREE.PointLight) pointLights.push(object);
  });
  let phase: DayPhase = 'noon',
    nightLevel = 0;
  let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches,
    visible = false,
    disposed = false,
    ambientEnabled = !reduced;
  let active: IslandId | null = null,
    width = 1,
    height = 1,
    ambientTime = 0,
    ambientLast = 0,
    ambientFrame = 0;
  let cameraFrame = 0,
    lightingFrame = 0,
    cameraStarted = 0;
  let completeMove: (() => void) | undefined;
  const targetCamera = new THREE.Vector3(),
    targetLook = new THREE.Vector3(),
    startCamera = new THREE.Vector3(),
    startLook = new THREE.Vector3();
  const portals = [
    ...container.querySelectorAll<HTMLButtonElement>('[data-portal]'),
  ].map((button) => ({
    button,
    id: button.dataset.portal as IslandId,
    width: 90,
  }));
  const anchors = {
    bookflow: projectFacilities.bookflow.map(({ x, z, labelY }) => [
      x,
      labelY,
      z,
    ]),
    assetflow: projectFacilities.assetflow.map(({ x, z, labelY }) => [
      x,
      labelY,
      z,
    ]),
    journal: [[0, 2.2, 1.1]],
    zailongchang: [
      [0, 2, -0.5],
      [-1.5, 2, 1],
      [1.5, 2, 1],
    ],
  } satisfies Partial<Record<IslandId, number[][]>>;
  const point = new THREE.Vector3();
  let paintFrame = 0;
  let labelsDirty = true;
  let shadowsDirty = true;
  let shadowLightAt = -Infinity;
  let ambientAccumulator = 0;
  let poseDelta = 0;
  type Motion = ReturnType<typeof createPedestrian>;
  function snapshot(motion: Motion) {
    return {
      x: motion.position.x,
      z: motion.position.z,
      heading: motion.heading,
      distance: motion.distance,
    };
  }
  let previousPeople: ReturnType<typeof snapshot>[] = [];
  let previousBoats: ReturnType<typeof snapshot>[] = [];
  function savePose(target: ReturnType<typeof snapshot>, motion: Motion) {
    target.x = motion.position.x;
    target.z = motion.position.z;
    target.heading = motion.heading;
    target.distance = motion.distance;
  }
  function posePeople(alpha: number, delta: number) {
    const domain = currentLayout.domain;
    people.forEach((model, i) => {
      const { group } = model;
      const before = previousPeople[i]!;
      const motion = peerMotions[i]!;
      group.position.x = THREE.MathUtils.lerp(
        before.x,
        motion.position.x,
        alpha,
      );
      group.position.z = THREE.MathUtils.lerp(
        before.z,
        motion.position.z,
        alpha,
      );
      group.position.y = domain.height(group.position);
      group.rotation.y = THREE.MathUtils.lerp(
        before.heading,
        motion.heading,
        alpha,
      );
      model.stride = THREE.MathUtils.damp(
        model.stride,
        Number(motion.moving),
        11,
        delta,
      );
      const distance = camera.position.distanceToSquared(group.position);
      group.visible = distance < (group.visible ? 33 ** 2 : 29 ** 2);
      group.updateMatrix();
      distantPeople.setMatrixAt(i, group.visible ? emptyFigure : group.matrix);
      if (!group.visible) return;
      const progress =
        THREE.MathUtils.lerp(before.distance, motion.distance, alpha) /
        (0.64 * group.scale.x);
      model.torso.rotation.z =
        Math.sin(progress * 2 * Math.PI) * 0.035 * model.stride;
      model.torso.position.y =
        0.006 * Math.sin(4 * Math.PI * progress) * model.stride;
      for (let foot = 0; foot < 2; foot++) {
        const cycle = (progress + foot * 0.5) % 1;
        const forward =
          (cycle < 0.5 ? 0.16 - cycle * 0.64 : -0.16 + (cycle - 0.5) * 0.64) *
          model.stride;
        const lift =
          cycle < 0.5
            ? 0
            : 0.1 * Math.sin((cycle - 0.5) * 2 * Math.PI) * model.stride;
        const leg = model.legs[foot]!,
          shoe = model.shoes[foot]!;
        leg.rotation.x = -Math.atan2(forward, 0.4 - lift);
        leg.scale.y = Math.hypot(0.4 - lift, forward) / 0.4;
        shoe.position.setZ(forward + 0.045);
        shoe.position.y = 0.04 + lift;
        model.arms[foot]!.rotation.x =
          -Math.cos(cycle * 2 * Math.PI) * 0.36 * model.stride;
      }
    });
    distantPeople.instanceMatrix.needsUpdate = true;
  }
  function paint(force = false) {
    if ((!visible && !force) || disposed) return;
    camera.updateMatrixWorld();
    const project = labelsDirty;
    if (project || poseDelta) {
      posePeople(ambientAccumulator / simulationStep, poseDelta);
      poseDelta = 0;
    }
    if (project || shadowsDirty) {
      movingShadows.update(camera, sun, nightLevel, ambientTime, width < 600);
      shadowsDirty = false;
    }
    renderer.render(scene, camera);
    if (project) {
      projectLabels();
      labelsDirty = false;
    }
  }
  function requestPaint() {
    if (paintFrame || !visible || disposed) return;
    paintFrame = requestAnimationFrame(() => {
      paintFrame = 0;
      paint();
    });
  }
  function projectLabels() {
    const used: { x: number; y: number; w: number }[] = [];
    for (const { button, id, width: w } of portals) {
      point.copy(roots.get(id)!.position);
      point.y += id === 'about' ? 2.5 : 2.1;
      point.project(camera);
      const x = id === active ? width / 2 : ((point.x + 1) * width) / 2;
      let y = ((1 - point.y) * height) / 2;
      if (id === active) y = width < 540 ? 146 : 106;
      for (const previous of used) {
        if (
          Math.abs(x - previous.x) < (w + previous.w) / 2 + 6 &&
          Math.abs(y - previous.y) < 34
        )
          y = previous.y + 35;
      }
      const show =
        point.z < 1 &&
        point.z > -1 &&
        x >= w / 2 + 4 &&
        x <= width - w / 2 - 4 &&
        y > 100 &&
        y < height - 72;
      button.style.visibility = show ? 'visible' : 'hidden';
      if (!show) continue;
      used.push({ x, y, w });
      button.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    }
    const positions = active && anchors[active as keyof typeof anchors];
    if (!active || !positions) return;
    const island = roots.get(active)!;
    labels.forEach((button, index) => {
      const position = positions[index];
      if (button.hidden || !position) return;
      point
        .set(position[0]!, position[1]!, position[2]!)
        .multiply(island.scale)
        .add(island.position)
        .project(camera);
      let x = ((point.x + 1) * width) / 2;
      let y = ((1 - point.y) * height) / 2;
      if (width < 900 && active === 'zailongchang') {
        x = index === 0 ? width / 2 : width * (index === 1 ? 0.25 : 0.75);
        y = height * 0.36 + (index === 0 ? 0 : 90);
      }
      if (height < 500 && active === 'zailongchang') {
        x = (width * (index + 0.5)) / positions.length;
        y = height * 0.55;
      }
      button.style.transform = `translate(${Math.max(64, Math.min(width - 64, x))}px,${Math.max(130, Math.min(height - 100, y))}px) translate(-50%,-50%)`;
    });
  }
  function home() {
    const aspect = width / height;
    camera.clearViewOffset();
    if (active) {
      const island = roots.get(active)!;
      const large = active === 'bookflow' || active === 'assetflow';
      const d =
        large || active === 'zailongchang' || active === 'journal' ? 12 : 10;
      const distance =
        aspect < 1 ? d / Math.max(0.55, aspect) : height < 500 ? d * 1.2 : d;
      targetLook.copy(island.position);
      targetLook.y = 0.3;
      targetCamera
        .copy(targetLook)
        .add(new THREE.Vector3(2, distance * 0.95, distance));
    } else {
      const distance =
        width < 900 && height > width ? 30 / aspect : height < 500 ? 44 : 39;
      targetLook.set(
        width < 900 && height > width ? 0 : 3,
        0,
        width < 900 && height > width ? 5.5 : 3,
      );
      targetCamera
        .copy(targetLook)
        .add(new THREE.Vector3(3, distance * 1.15, distance * 0.8));
    }
  }
  function stopCamera(finish = false) {
    cancelAnimationFrame(cameraFrame);
    cameraFrame = 0;
    if (finish) {
      camera.position.copy(targetCamera);
      controls.target.copy(targetLook);
      controls.update();
    }
    completeMove?.();
    completeMove = undefined;
  }
  function cameraTick(now: number) {
    cameraFrame = 0;
    if (disposed || !visible) {
      stopCamera(true);
      return;
    }
    const t = Math.min(1, (now - cameraStarted) / 1350);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(startCamera, targetCamera, e);
    controls.target.lerpVectors(startLook, targetLook, e);
    controls.update();
    requestPaint();
    if (t < 1) cameraFrame = requestAnimationFrame(cameraTick);
    else {
      completeMove?.();
      completeMove = undefined;
    }
  }
  function move(animated = true) {
    stopCamera();
    if (reduced || !visible || !animated) {
      camera.position.copy(targetCamera);
      controls.target.copy(targetLook);
      controls.update();
      requestPaint();
      return Promise.resolve();
    }
    startCamera.copy(camera.position);
    startLook.copy(controls.target);
    cameraStarted = performance.now();
    return new Promise<void>((resolve) => {
      completeMove = resolve;
      cameraFrame = requestAnimationFrame(cameraTick);
    });
  }
  function setPhase(value: DayPhase, animated = true) {
    cancelAnimationFrame(lightingFrame);
    phase = value;
    const config = phaseLight[value];
    const from = {
      sky: skyColor.clone(),
      haze: fog.color.clone(),
      fog: fogDensity,
      sun: sun.color.clone(),
      power: sun.intensity,
      ambient: hemi.intensity,
      ambientSky: hemi.color.clone(),
      ambientGround: hemi.groundColor.clone(),
      shade: sun.shadow.intensity,
      night: nightLevel,
      position: sun.position.clone(),
    };
    const sky = new THREE.Color(config.sky),
      haze = new THREE.Color('haze' in config ? config.haze : config.sky),
      color = new THREE.Color(config.sun),
      ambientSky = new THREE.Color(config.ambientSky),
      ambientGround = new THREE.Color(config.ambientGround),
      position = new THREE.Vector3(...config.position);
    const start = performance.now();
    const update = (now: number) => {
      lightingFrame = 0;
      const t = !animated || reduced ? 1 : Math.min(1, (now - start) / 1100);
      const e = t * t * (3 - 2 * t);
      skyColor.lerpColors(from.sky, sky, e);
      fog.color.lerpColors(from.haze, haze, e);
      fogDensity = THREE.MathUtils.lerp(from.fog, config.fog, e);
      fog.density = fogDensity * (portraitLayout ? 0.72 : 1);
      sun.color.lerpColors(from.sun, color, e);
      sun.position.lerpVectors(from.position, position, e);
      sun.intensity = THREE.MathUtils.lerp(from.power, config.power, e);
      sun.shadow.intensity = THREE.MathUtils.lerp(from.shade, config.shade, e);
      hemi.color.lerpColors(from.ambientSky, ambientSky, e);
      hemi.groundColor.lerpColors(from.ambientGround, ambientGround, e);
      hemi.intensity = THREE.MathUtils.lerp(from.ambient, config.ambient, e);
      nightLevel = THREE.MathUtils.lerp(from.night, config.night, e);
      windows.emissiveIntensity = 0.08 + nightLevel * 1.42;
      screens.emissiveIntensity = 0.14 + nightLevel * 0.41;
      pointLights.forEach((light) => (light.intensity = nightLevel * 1.9));
      fireflies.forEach((fly) => (fly.visible = nightLevel > 0.5));
      if (t === 1 || now - shadowLightAt >= 1000 / 12) {
        renderer.shadowMap.needsUpdate = true;
        shadowLightAt = now;
      }
      shadowsDirty = true;
      requestPaint();
      if (t < 1 && !disposed && visible)
        lightingFrame = requestAnimationFrame(update);
    };
    update(start);
  }
  const simulationStep = 1 / 30;
  function simulate() {
    const { domain, map, sea } = currentLayout;
    peerMotions.forEach((motion, i) => {
      savePose(previousPeople[i]!, motion);
      motion.update(simulationStep, peerMotions);
    });
    if (peerMotions.some(({ position }) => domain.onBridge(position)))
      bridgeCrossings++;
    boatMotion.forEach((motion, i) => {
      savePose(previousBoats[i]!, motion);
      motion.update(simulationStep, boatMotion);
      if (i !== 0 || !motion.arrived) return;
      if (!dockOutbound) {
        harborVisits++;
        motion.goTo(
          sea.nearest({ x: map.zailongchang.x - 7, z: map.zailongchang.z + 2 }),
        );
      } else motion.goTo(dock);
      dockOutbound = !dockOutbound;
    });
  }
  let lastStatusAt = -Infinity;
  function ambient(now: number) {
    ambientFrame = 0;
    if (!visible || disposed || reduced || !ambientEnabled) return;
    const delta = ambientLast ? Math.min((now - ambientLast) / 1000, 0.1) : 0;
    ambientLast = now;
    ambientTime += delta;
    ambientAccumulator += delta;
    while (ambientAccumulator >= simulationStep) {
      simulate();
      ambientAccumulator -= simulationStep;
    }
    const alpha = ambientAccumulator / simulationStep;
    poseDelta += delta;
    boats.forEach((boat, i) => {
      const motion = boatMotion[i]!,
        before = previousBoats[i]!;
      boat.position.set(
        THREE.MathUtils.lerp(before.x, motion.position.x, alpha),
        -0.73 + Math.sin(ambientTime + i) * 0.04,
        THREE.MathUtils.lerp(before.z, motion.position.z, alpha),
      );
      boat.rotation.y = THREE.MathUtils.lerp(
        before.heading,
        motion.heading,
        alpha,
      );
    });
    birds.forEach(({ group, wings }, i) => {
      const motion = birdMotion[i]!;
      motion.update(delta);
      group.position.set(
        motion.position.x,
        4.5 + Math.sin(ambientTime * 0.3 + i) * 0.8,
        motion.position.z,
      );
      group.rotation.y = motion.heading;
      wings.forEach(
        (wing, j) =>
          (wing.rotation.z =
            Math.sin(ambientTime * 3 + i) * (j ? -0.35 : 0.35)),
      );
    });
    leaves.forEach(
      (leaf, i) => (leaf.rotation.z = Math.sin(ambientTime * 0.8 + i) * 0.025),
    );
    waterClock.value = ambientTime;
    shapeRipples(ambientTime);
    if (nightLevel > 0.5) {
      fireflies.forEach((fly, i) => {
        const { motion, origin } = fireflyMotion[i]!;
        motion.update(delta);
        fly.position.set(
          origin.x + motion.position.x,
          0.9 + Math.sin(ambientTime + i) * 0.4,
          origin.z + motion.position.z,
        );
        fly.scale.setScalar(0.6 + Math.sin(ambientTime * 2 + i) * 0.35);
      });
    }
    if (now - lastStatusAt >= 250) {
      lastStatusAt = now;
      container.dataset.avatarDistance = creatorMotion.distance.toFixed(2);
      container.dataset.bridgeCrossings = String(bridgeCrossings);
      container.dataset.harborVisits = String(harborVisits);
      container.dataset.shadowFrame = String(Math.round(ambientTime * 30));
    }
    shadowsDirty = true;
    requestPaint();
    ambientFrame = requestAnimationFrame(ambient);
  }
  function schedule() {
    cancelAnimationFrame(ambientFrame);
    ambientFrame = 0;
    ambientLast = 0;
    if (visible && !disposed && !reduced && ambientEnabled)
      ambientFrame = requestAnimationFrame(ambient);
  }
  function resize() {
    const nextWidth = Math.max(1, container.clientWidth);
    const nextHeight = Math.max(1, container.clientHeight);
    if (
      portraitLayout !== undefined &&
      width === nextWidth &&
      height === nextHeight
    )
      return;
    width = nextWidth;
    height = nextHeight;
    const portrait = width < 900 && height > width;
    const arrangementChanged = portraitLayout !== portrait;
    layout(portrait);
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, width < 600 ? 1.25 : 1.65),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (arrangementChanged) {
      home();
      stopCamera(true);
    }
    labelsDirty = true;
    requestPaint();
  }
  resize();
  const observer = new ResizeObserver((entries) => {
    if (entries.some(({ target }) => target === container)) resize();
    for (const entry of entries) {
      const portal = portals.find(({ button }) => button === entry.target);
      if (portal)
        portal.width =
          entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width;
    }
    labelsDirty = true;
    requestPaint();
  });
  observer.observe(container);
  portals.forEach(({ button }) => observer.observe(button));
  const redraw = () => {
    labelsDirty = true;
    requestPaint();
  };
  const interrupt = () => stopCamera();
  controls.addEventListener('change', redraw);
  controls.addEventListener('start', interrupt);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const canvas = renderer.domElement;
  const interactions = new AbortController();
  const listener = { signal: interactions.signal };
  const projectProxies = () =>
    active === 'bookflow' || active === 'assetflow' ? facilities[active] : [];
  let hovered = -1;
  let lit: THREE.Mesh | undefined;
  function highlight() {
    const next =
      projectProxies()[
        hovered >= 0
          ? hovered
          : labels.indexOf(document.activeElement as HTMLButtonElement)
      ];
    if (next === lit) return;
    if (lit) {
      const ring = lit.userData.ring as THREE.Mesh<
        THREE.TorusGeometry,
        THREE.MeshStandardMaterial
      >;
      const tint = lit.name.includes('bookflow') ? art.coral : art.teal;
      ring.material.color.set(tint);
      ring.material.emissive.set(tint);
      ring.material.emissiveIntensity = 0.17;
    }
    lit = next;
    if (lit) {
      const ring = lit.userData.ring as THREE.Mesh<
        THREE.TorusGeometry,
        THREE.MeshStandardMaterial
      >;
      ring.material.color.set(0xf0bb63);
      ring.material.emissive.set(0xffac50);
      ring.material.emissiveIntensity = 0.45;
    }
    requestPaint();
  }
  function aim(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  }
  function facilityAtPointer() {
    const proxies = projectProxies();
    const hit = raycaster.intersectObjects(proxies, false)[0];
    return hit ? proxies.indexOf(hit.object as THREE.Mesh) : -1;
  }
  const pointDown = new THREE.Vector2();
  let tap: number | undefined;
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      tap = event.isPrimary && event.button === 0 ? event.pointerId : undefined;
      pointDown.set(event.clientX, event.clientY);
    },
    listener,
  );
  canvas.addEventListener(
    'pointercancel',
    () => {
      tap = undefined;
    },
    listener,
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (
        event.buttons ||
        event.pointerType === 'touch' ||
        !projectProxies().length
      )
        return;
      aim(event);
      hovered = facilityAtPointer();
      canvas.style.cursor = hovered >= 0 ? 'pointer' : '';
      highlight();
    },
    listener,
  );
  function clearHover() {
    hovered = -1;
    canvas.style.cursor = '';
    highlight();
  }
  canvas.addEventListener('pointerleave', clearHover, listener);
  labels.forEach((label) => {
    label.addEventListener('focus', highlight, listener);
    label.addEventListener('blur', () => queueMicrotask(highlight), listener);
  });
  canvas.addEventListener(
    'pointerup',
    (event) => {
      const select =
        tap === event.pointerId &&
        Math.hypot(event.clientX - pointDown.x, event.clientY - pointDown.y) <=
          6;
      tap = undefined;
      if (!select) return;
      aim(event);
      const facility = facilityAtPointer();
      if (facility >= 0) {
        onSelect(facility);
        return;
      }
      const hit = raycaster.intersectObjects([...roots.values()], true)[0];
      if (!hit) return;
      let object: THREE.Object3D | null = hit.object;
      let hotspot: number | undefined;
      while (object && object.userData.island === undefined) {
        if (object.userData.hotspot !== undefined)
          hotspot = object.userData.hotspot as number;
        object = object.parent;
      }
      if (!object) return;
      const id = object.userData.island as IslandId;
      if (active === id && hotspot !== undefined && !directIslandView(id))
        onSelect(hotspot);
      else onEnter(id);
    },
    listener,
  );
  const contextLost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  return {
    firstFrame() {
      portals.forEach(
        (portal) => (portal.width = portal.button.offsetWidth || portal.width),
      );
      container.prepend(renderer.domElement);
      paint(true);
      if (renderer.getContext().isContextLost())
        throw new Error('3D context lost before first frame');
    },
    focusAvatar() {
      active = 'about';
      clearHover();
      labelsDirty = true;
      targetLook.copy(creator.group.position);
      targetCamera.copy(targetLook).add(new THREE.Vector3(2, 10, 10));
      return move();
    },
    focusIsland(id, animated = true) {
      active = id;
      clearHover();
      labelsDirty = true;
      home();
      return move(animated);
    },
    overview(animated = true) {
      active = null;
      clearHover();
      labelsDirty = true;
      home();
      return move(animated);
    },
    zoom(factor) {
      const offset = camera.position
        .clone()
        .sub(controls.target)
        .multiplyScalar(factor)
        .clampLength(8, 110);
      targetLook.copy(controls.target);
      targetCamera.copy(targetLook).add(offset);
      void move();
    },
    setPhase,
    setVisible(value) {
      if (visible === value) return;
      visible = value;
      schedule();
      if (!value) {
        if (completeMove) stopCamera(true);
        cancelAnimationFrame(paintFrame);
        paintFrame = 0;
        if (lightingFrame) setPhase(phase, false);
      } else {
        requestPaint();
      }
    },
    setReducedMotion(value) {
      reduced = value;
      if (value) {
        if (completeMove) stopCamera(true);
        setPhase(phase, false);
      }
      schedule();
    },
    setMotion(value) {
      ambientEnabled = value;
      schedule();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopCamera();
      cancelAnimationFrame(ambientFrame);
      cancelAnimationFrame(lightingFrame);
      cancelAnimationFrame(paintFrame);
      observer.disconnect();
      controls.dispose();
      interactions.abort();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set<THREE.BufferGeometry>(),
        mats = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((m) => mats.add(m));
        }
      });
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      materials.forEach((m) => m.dispose());
      movingShadows.ground.dispose();
      distantPeople.dispose();
      ripples.dispose();
      shores.dispose();
      hills.dispose();
      coast.dispose();
      movingShadows.mesh.dispose();
      headGeometry.dispose();
      hairGeometry.dispose();
      glassesGeometry.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
