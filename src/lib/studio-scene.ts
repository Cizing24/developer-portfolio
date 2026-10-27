import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { type IslandId, type DayPhase } from './world-config';
import type { ProjectId } from './project-introductions';
import { createWander, rectangleArea } from './wander';
import {
  createNavigation,
  createPedestrian,
  type Navigation,
} from './navigation';
import {
  islandLayout,
  islandRadii,
  bridgePairs,
  bridgeRoutes,
  isAccessLane,
  createWorldDomain,
  createSeaDomain,
  reefIslands,
} from './world-map';

export interface StudioScene {
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
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, container.clientWidth < 600 ? 1.5 : 2),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9dadd);
  scene.fog = new THREE.FogExp2(0xb9dadd, 0.003);
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
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.6);
  sun.position.set(-6, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -27,
    right: 27,
    top: 25,
    bottom: -25,
  });
  sun.shadow.bias = -0.001;
  const hemi = new THREE.HemisphereLight(0xfffaf0, 0x657e78, 2.2);
  scene.add(sun, hemi);
  const cream = 0xf5eedc,
    wine = 0x982d36,
    sage = 0x6d8268,
    ink = 0x314e49,
    gold = 0xc59c52,
    rose = 0xd9ad9b;
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  function material(color: number) {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.82,
          metalness: 0.04,
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
  const roots = new Map<IslandId, THREE.Group>();
  function createProject(id: ProjectId) {
    const world = new THREE.Group();
    const ground = new THREE.Group();
    world.add(ground);
    cylinder(ground, 7.1, 0.45, 0xb6b396, 0, -0.43, 0, 14).scale.z = 0.64;
    cylinder(ground, 6.9, 0.25, 0xe8d8b1, 0, -0.1, 0, 14).scale.z = 0.64;
    cylinder(ground, 6.5, 0.1, 0xb5c49b, 0, 0.03, 0, 14).scale.z = 0.64;
    // Paths link the six stations across the island.
    box(ground, 8.4, 0.035, 0.38, 0xe3dbc1, 0, 0.1, -1.65);
    box(ground, 8.4, 0.035, 0.38, 0xe3dbc1, 0, 0.1, 1.7);
    box(ground, 0.38, 0.035, 3.35, 0xe3dbc1, 4, 0.1, 0);
    box(ground, 0.38, 0.035, 3.35, 0xe3dbc1, -4, 0.1, 0);
    for (const x of [-6, 6])
      for (const z of [-3.4, 3.4])
        cylinder(ground, 0.055, 0.04, gold, x, 0.03, z);
    function tree(x: number, z: number, size: number) {
      cylinder(ground, 0.07, 0.55 * size, 0x8f7356, x, 0.27 * size, z, 8);
      const canopy = mesh(
        ground,
        new THREE.IcosahedronGeometry(0.38 * size, 0),
        sage,
        x,
        0.7 * size,
        z,
      );
      canopy.userData.canopy = true;
      cylinder(ground, 0.27 * size, 0.18, 0xd2c7ac, x, 0.08, z, 8);
    }
    [
      [-5.6, -2.4],
      [-4.9, -2.7],
      [4.9, -2.8],
      [5.5, -2.2],
      [-5.5, 2.5],
      [5.5, 2.5],
    ].forEach(([x, z], i) => tree(x!, z!, 0.8 + (i % 3) * 0.18));
    const positions = [
      new THREE.Vector3(-4, 0, -1.65),
      new THREE.Vector3(0, 0, -1.65),
      new THREE.Vector3(4, 0, -1.65),
      new THREE.Vector3(4, 0, 1.7),
      new THREE.Vector3(0, 0, 1.7),
      new THREE.Vector3(-4, 0, 1.7),
    ];
    const buildings: THREE.Group[] = [];
    positions.forEach((position, index) => {
      const group = new THREE.Group();
      group.position.copy(position);
      group.userData.station = index;
      world.add(group);
      cylinder(group, 1.18, 0.22, 0xc5c7af, 0, 0.12, 0, 6);
      cylinder(group, 1.1, 0.07, cream, 0, 0.26, 0, 6);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.99, 0.035, 6, 48),
        material(wine).clone(),
      );
      ring.name = `station-ring-${index}`;
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.32;
      group.add(ring);
      const model = new THREE.Group();
      model.position.y = 0.3;
      group.add(model);
      buildings.push(model);
    });
    // 01: a booking kiosk with a calendar, or an inventory shelf.
    const bookingModel = new THREE.Group();
    bookingModel.name = 'booking-kiosk';
    buildings[0]!.add(bookingModel);
    box(bookingModel, 1.3, 1.4, 0.65, cream, 0, 0.72);
    box(bookingModel, 1.5, 0.18, 0.88, wine, 0, 1.5);
    box(bookingModel, 1.02, 0.8, 0.04, 0xe3d5bf, 0, 0.88, 0.35);
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 3; col++)
        box(
          bookingModel,
          0.2,
          0.2,
          0.04,
          col === 1 && row === 1 ? wine : sage,
          -0.3 + col * 0.3,
          0.7 + row * 0.3,
          0.39,
        );
    box(bookingModel, 0.7, 0.08, 0.4, rose, 0, 0.06, 0.65);
    const assetModel = new THREE.Group();
    assetModel.name = 'asset-shelf';
    buildings[0]!.add(assetModel);
    assetModel.visible = false;
    for (const x of [-0.6, 0.6]) box(assetModel, 0.08, 1.5, 0.7, ink, x, 0.8);
    for (const y of [0.2, 0.8, 1.4]) {
      box(assetModel, 1.3, 0.08, 0.75, cream, 0, y);
      for (const x of [-0.3, 0.3]) {
        box(assetModel, 0.4, 0.32, 0.4, y === 0.8 ? wine : gold, x, y + 0.2);
      }
    }
    // 02: an API relay station, with a slate roof and visible terminals.
    box(buildings[1]!, 1.25, 0.95, 0.9, cream, 0, 0.5);
    const roof = mesh(
      buildings[1]!,
      new THREE.CylinderGeometry(0, 1, 0.7, 4),
      ink,
      0,
      1.3,
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.8;
    box(buildings[1]!, 0.45, 0.62, 0.06, wine, 0, 0.4, 0.48);
    for (const x of [-0.44, 0.44])
      box(buildings[1]!, 0.23, 0.25, 0.04, gold, x, 0.65, 0.48);
    cylinder(buildings[1]!, 0.035, 0.55, gold, 0.4, 1.75);
    mesh(buildings[1]!, new THREE.SphereGeometry(0.1, 12, 8), wine, 0.4, 2.03);
    // 03: the gate makes waiting and authorization a physical boundary.
    for (const x of [-0.65, 0.65]) {
      box(buildings[2]!, 0.24, 1.4, 0.4, ink, x, 0.7);
      box(buildings[2]!, 0.32, 0.12, 0.5, gold, x, 1.43);
    }
    box(buildings[2]!, 1.55, 0.2, 0.45, cream, 0, 1.55);
    box(buildings[2]!, 1.1, 0.15, 0.12, wine, 0, 0.75, 0.1);
    for (const x of [-0.4, 0, 0.4])
      box(buildings[2]!, 0.06, 0.9, 0.06, gold, x, 0.5, 0.1);
    // 04: a validation desk with a magnifying ring.
    box(buildings[3]!, 1.4, 0.2, 0.9, ink, 0, 0.75);
    for (const x of [-0.5, 0.5])
      box(buildings[3]!, 0.12, 0.7, 0.6, cream, x, 0.35);
    box(buildings[3]!, 0.6, 0.06, 0.6, cream, -0.2, 0.9);
    for (let i = 0; i < 3; i++)
      box(buildings[3]!, 0.35, 0.02, 0.035, sage, -0.2, 0.94, -0.16 + i * 0.15);
    const lens = mesh(
      buildings[3]!,
      new THREE.TorusGeometry(0.3, 0.065, 8, 24),
      gold,
      0.4,
      1.3,
      0.1,
    );
    lens.rotation.y = -0.2;
    box(buildings[3]!, 0.07, 0.45, 0.07, gold, 0.65, 0.97, 0.1).rotation.z =
      -0.6;
    // 05: a database stack with three porcelain drums and a burgundy core.
    for (let i = 0; i < 3; i++) {
      cylinder(
        buildings[4]!,
        0.65,
        0.35,
        i === 1 ? wine : cream,
        0,
        0.25 + i * 0.43,
      );
      cylinder(buildings[4]!, 0.66, 0.045, gold, 0, 0.44 + i * 0.43);
      box(
        buildings[4]!,
        0.13,
        0.055,
        0.06,
        i === 1 ? gold : sage,
        0.17,
        0.25 + i * 0.43,
        0.64,
      );
    }
    // 06: an archive of committed events, with two distinct result lanes.
    for (const x of [-0.4, 0.4]) {
      box(buildings[5]!, 0.6, 1.1, 0.7, x < 0 ? ink : cream, x, 0.57);
      for (let i = 0; i < 3; i++) {
        box(
          buildings[5]!,
          0.45,
          0.22,
          0.05,
          x < 0 ? sage : rose,
          x,
          0.27 + i * 0.3,
          0.38,
        );
        box(buildings[5]!, 0.13, 0.025, 0.04, gold, x, 0.28 + i * 0.3, 0.42);
      }
    }
    box(buildings[5]!, 1.6, 0.08, 1, gold, 0, 1.17);

    const route = positions.map((p) => p.clone().setY(0.34));
    const routeMaterial = new THREE.LineDashedMaterial({
      color: 0x8a9378,
      dashSize: 0.13,
      gapSize: 0.12,
    });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route),
      routeMaterial,
    );
    line.computeLineDistances();
    world.add(line);
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
        0x8c9f79,
        -3.5 + i * 1.7,
        0.5,
        -3.3,
      );
      ridge.rotation.y = i * 0.8;
    }
    const harbor = new THREE.Group();
    ground.add(harbor);
    box(harbor, 2.4, 0.12, 1.2, 0xaa8966, 0, -0.01, 4.2);
    for (const x of [-0.95, 0.95])
      cylinder(harbor, 0.07, 0.7, ink, x, -0.2, 4.5, 8);
    cylinder(harbor, 0.28, 1.3, cream, 1.6, 0.6, 3.6, 12);
    cylinder(harbor, 0.3, 0.18, wine, 1.6, 1, 3.6, 12);
    mesh(harbor, new THREE.ConeGeometry(0.4, 0.32, 12), wine, 1.6, 1.43, 3.6);

    bookingModel.visible = id === 'bookflow';
    assetModel.visible = id === 'assetflow';
    world.scale.setScalar(0.64);
    world.userData.island = id;
    scene.add(world);
    roots.set(id, world);
    return world;
  }
  createProject('bookflow');
  createProject('assetflow');
  const windows = new THREE.MeshStandardMaterial({
    color: 0xf3cd80,
    emissive: 0xffc46a,
    emissiveIntensity: 0,
    roughness: 0.5,
  });
  const lamps: THREE.Mesh[] = [];
  function pane(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
  ) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), windows);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }
  function plant(parent: THREE.Object3D, x: number, z: number, size = 0.8) {
    cylinder(parent, 0.07, 0.55 * size, 0x8f7356, x, 0.25 * size, z, 6);
    const leaf = mesh(
      parent,
      new THREE.IcosahedronGeometry(0.45 * size, 0),
      sage,
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
    cylinder(group, 3.3 + extra, 0.5, 0xb8b69d, 0, -0.55, 0, 10);
    cylinder(group, 3.15 + extra, 0.18, 0xe3d4b3, 0, -0.23, 0, 10);
    cylinder(group, 2.95 + extra, 0.16, 0xb4c297, 0, -0.06, 0, 10);
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
  const pavilion = new THREE.Group();
  pavilion.userData.hotspot = 0;
  portfolio.add(pavilion);
  box(pavilion, 3.2, 0.2, 2.4, cream, 0, 0.18);
  for (const x of [-1.3, 1.3])
    for (const z of [-0.85, 0.85])
      box(pavilion, 0.13, 1.55, 0.13, ink, x, 0.95, z);
  const canopy = mesh(
    pavilion,
    new THREE.CylinderGeometry(0, 2.3, 0.8, 4),
    wine,
    0,
    1.9,
  );
  canopy.rotation.y = Math.PI / 4;
  canopy.scale.z = 0.8;
  for (const [i, x] of [-0.8, 0.8].entries()) {
    const display = new THREE.Group();
    display.userData.hotspot = i;
    portfolio.add(display);
    box(display, 0.8, 0.12, 0.6, ink, x, 0.5, 0.8);
    box(display, 0.7, 0.55, 0.08, i ? ink : wine, x, 0.83, 0.6);
    pane(display, 0.53, 0.35, 0.02, x, 0.86, 0.65);
  }
  const journal = utility('journal');
  for (const [i, x] of [-0.85, 0.85].entries()) {
    const library = new THREE.Group();
    library.userData.hotspot = i;
    journal.add(library);
    library.position.x = x;
    box(library, 1.25, 1.45, 1, cream, 0, 0.8);
    box(library, 1.4, 0.16, 1.15, ink, 0, 1.57);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 4; col++)
        box(
          library,
          0.15,
          0.24,
          0.08,
          [wine, ink, gold, rose][(row + col) % 4]!,
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
    wine,
    0,
    1.8,
  );
  postRoof.rotation.y = Math.PI / 4;
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
  desk.userData.hotspot = 0;
  about.add(desk);
  desk.position.set(1, 0, 0.7);
  box(desk, 1.8, 0.16, 0.95, ink, 0, 0.85);
  for (const x of [-0.7, 0.7]) box(desk, 0.12, 0.8, 0.6, cream, x, 0.4);
  box(desk, 0.8, 0.05, 0.6, 0xb9b8ad, 0, 0.98);
  box(desk, 0.8, 0.5, 0.05, ink, 0, 1.23, -0.2);
  pane(desk, 0.65, 0.35, 0.02, 0, 1.25, -0.16);
  function person(parent: THREE.Object3D, creator = false) {
    const group = new THREE.Group();
    group.userData.animated = true;
    parent.add(group);
    const skin = creator ? 0xe3b894 : cream;
    box(
      group,
      creator ? 0.47 : 0.2,
      creator ? 0.65 : 0.28,
      creator ? 0.3 : 0.18,
      creator ? 0x293f50 : rose,
      0,
      creator ? 0.75 : 0.35,
    );
    mesh(
      group,
      new THREE.SphereGeometry(creator ? 0.25 : 0.1, creator ? 12 : 8, 8),
      skin,
      0,
      creator ? 1.35 : 0.6,
    );
    const arms: THREE.Group[] = [];
    const legs: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      group.add(arm);
      arm.position.set(side * (creator ? 0.31 : 0.16), creator ? 1 : 0.45, 0);
      box(
        arm,
        creator ? 0.14 : 0.065,
        creator ? 0.5 : 0.24,
        creator ? 0.16 : 0.08,
        creator ? 0x293f50 : rose,
        0,
        creator ? -0.18 : -0.08,
      );
      arms.push(arm);
      const leg = new THREE.Group();
      group.add(leg);
      leg.position.set(
        side * (creator ? 0.14 : 0.06),
        creator ? 0.43 : 0.22,
        0,
      );
      box(
        leg,
        creator ? 0.17 : 0.065,
        creator ? 0.43 : 0.2,
        creator ? 0.18 : 0.08,
        ink,
        0,
        creator ? -0.2 : -0.1,
      );
      legs.push(leg);
    }
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
    if (creator) {
      const hair = mesh(
        group,
        new THREE.SphereGeometry(
          0.265,
          12,
          8,
          0,
          Math.PI * 2,
          0,
          Math.PI * 0.48,
        ),
        0x292c30,
        0,
        1.44,
      );
      hair.rotation.x = -0.1;
      for (const x of [-0.12, 0.12])
        mesh(
          group,
          new THREE.TorusGeometry(0.095, 0.018, 5, 16),
          0x29383d,
          x,
          1.36,
          0.225,
        );
      box(group, 0.08, 0.025, 0.025, ink, 0, 1.36, 0.23);
      box(group, 0.35, 0.4, 0.15, wine, 0, 0.85, -0.23);
      box(group, 0.15, 0.15, 0.025, gold, 0, 0.9, 0.165);
      group.scale.setScalar(1.25);
      group.userData.hotspot = 0;
    }
    return { group, arms, legs };
  }
  const creator = person(about, true);
  creator.group.scale.setScalar(0.9);
  creator.group.position.set(-0.9, 0.08, 0.6);
  creator.group.rotation.y = 0.2;
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
  box(village, 2.5, 0.12, 1.8, wine, 0, 1.38, -0.5);
  box(village, 0.45, 0.85, 0.05, ink, 0, 0.45, 0.27);
  pane(village, 0.42, 0.5, 0.05, -0.7, 0.8, 0.28);
  pane(village, 0.42, 0.5, 0.05, 0.7, 0.8, 0.28);
  box(village, 0.8, 0.8, 1, 0xb59a75, -1.7, 0.4, -1);
  // A shore-side pier with two arms leaves an open berth for boats.
  for (const z of [-0.7, 0.7]) {
    box(localIsland, 1.8, 0.12, 0.3, 0xb69874, 3.3, -0.35, z);
    for (const x of [2.65, 3.95])
      cylinder(localIsland, 0.06, 0.6, ink, x, -0.25, z, 6);
  }
  box(localIsland, 0.3, 0.12, 1.7, 0xb69874, 2.55, -0.35, 0);
  for (const [id, island] of roots) {
    for (let i = 0; i < (id === 'about' ? 2 : 4); i++) {
      const model = person(island);
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
      lamps.push(lamp);
      if (i === 0) {
        const glow = new THREE.PointLight(0xffca80, 0, 5, 2);
        glow.position.set(x, 1.2, z);
        island.add(glow);
      }
    }
    // Warm light also reaches the project windows at night.
    island.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.material === materials.get(gold) &&
        object.geometry instanceof THREE.BoxGeometry
      )
        object.material = windows;
    });
  }
  // Merge stationary pieces while preserving clickable topics and moving branches.
  // This keeps six islands from multiplying hundreds of individual draw calls.
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
        else if (
          parent.userData.station !== undefined &&
          [0, 2, 4].includes(parent.userData.station as number)
        )
          hotspot = [0, 2, 4].indexOf(parent.userData.station as number);
        parent = parent.parent;
      }
      const key = `${object.material.uuid}:${hotspot ?? 'island'}`;
      let batch = batches.get(key);
      if (!batch) {
        batch = {
          material: object.material,
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
  let pedestrianNavigation: Navigation;
  let creatorMotion: ReturnType<typeof createPedestrian>;
  let seaNavigation: Navigation;
  let boatMotion: ReturnType<typeof createPedestrian>[] = [];
  let dock = -1,
    dockOutbound = false;
  let bridgeCrossings = 0,
    harborVisits = 0;
  function disposeGeometry(group: THREE.Group) {
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    group.clear();
  }
  function layout(width: number, height: number) {
    const map = islandLayout(width < 900 && height > width);
    for (const [id, island] of roots) {
      const { x, z } = map[id];
      island.position.set(
        x,
        id === 'bookflow' || id === 'assetflow' ? -0.18 : 0,
        z,
      );
    }
    disposeGeometry(bridgeRoot);
    for (const { from, to, fromIsland: a, toIsland: b } of bridgeRoutes(map)) {
      const start = new THREE.Vector3(from.x, 0, from.z),
        end = new THREE.Vector3(to.x, 0, to.z);
      const delta = end.clone().sub(start);
      const direction = delta.clone().normalize();
      const reach = (id: IslandId | undefined) => {
        if (!id) return 0;
        const [rx, rz] = islandRadii(id);
        return 1 / Math.hypot(direction.x / rx, direction.z / rz) - 0.25;
      };
      const bankA = start.clone().addScaledVector(direction, reach(a));
      const bankB = end.clone().addScaledVector(direction, -reach(b));
      const length = bankA.distanceTo(bankB);
      if (length < 0.2) continue;
      const bridge = new THREE.Group();
      bridgeRoot.add(bridge);
      bridge.position.copy(bankA.add(bankB).multiplyScalar(0.5));
      bridge.position.y = -0.05;
      bridge.rotation.y = Math.atan2(delta.x, delta.z);
      box(bridge, 1.6, 0.12, length, 0xb69874);
      for (const x of [-0.83, 0.83])
        box(bridge, 0.035, 0.035, length, cream, x, 0.5);
      for (const z of [-length * 0.4, 0, length * 0.4])
        for (const x of [-0.83, 0.83]) {
          box(bridge, 0.045, 0.55, 0.045, ink, x, 0.22, z);
          pane(bridge, 0.045, 0.04, 0.16, x, 0.53, z);
        }
    }
    const domain = createWorldDomain(map);
    pedestrianNavigation = createNavigation(domain, 0.17);
    const occupied: { position: { x: number; z: number }; radius: number }[] =
      [];
    for (const walker of walkers) {
      scene.attach(walker.model.group);
      walker.model.group.scale.setScalar(0.85);
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
      );
      occupied.push(walker.motion);
      const p = walker.motion.position;
      walker.model.group.position.set(p.x, walker.motion.height, p.z);
    }
    scene.attach(creator.group);
    const creatorNavigation = createNavigation(domain, 0.4);
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
    seaNavigation = createNavigation(createSeaDomain(map), 0.55, 0.4);
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
    container.dataset.navigation = 'ready';
    container.dataset.bridgeCount = String(bridgePairs.length);
    container.dataset.shadowMode = 'tracked';
    renderer.shadowMap.needsUpdate = true;
  }
  const waterClock = { value: 0 };
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x5d9fa5,
    roughness: 0.56,
    metalness: 0.16,
  });
  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWorldTime = waterClock;
    shader.vertexShader = 'uniform float uWorldTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\ntransformed.y += sin(position.x * 1.1 + uWorldTime * 0.7) * cos(position.z * 0.8 + uWorldTime * 0.4) * 0.055;',
    );
  };
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(34, 96).rotateX(-Math.PI / 2),
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
    color: 0xc5bca0,
    roughness: 0.95,
  });
  const shores = new THREE.InstancedMesh(
    shoreGeometry,
    shoreMaterial,
    scenery.length,
  );
  const hills = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.82, 1.6, 7),
    new THREE.MeshStandardMaterial({ color: sage, roughness: 0.95 }),
    scenery.length,
  );
  const sceneryTransform = new THREE.Object3D();
  scenery.forEach(({ x, z, r }, i) => {
    sceneryTransform.position.set(x, -0.55, z);
    sceneryTransform.scale.set(r, 1, r * 0.8);
    sceneryTransform.rotation.y = i * 0.7;
    sceneryTransform.updateMatrix();
    shores.setMatrixAt(i, sceneryTransform.matrix);
    sceneryTransform.position.y = 0.25;
    sceneryTransform.updateMatrix();
    hills.setMatrixAt(i, sceneryTransform.matrix);
  });
  shores.castShadow =
    shores.receiveShadow =
    hills.castShadow =
    hills.receiveShadow =
      true;
  scene.add(shores, hills);
  container.dataset.sceneryIslands = String(scenery.length);
  const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 24; i++) {
    const ripple = mesh(
      scene,
      new THREE.TorusGeometry(0.2 + (i % 3) * 0.08, 0.012, 4, 20),
      0xa4c9c6,
      Math.sin(i * 7.1) * 20,
      -0.82,
      Math.cos(i * 3.9) * 16,
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.scale.x = 1.9;
    ripple.castShadow = false;
    ripples.push(ripple);
  }
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
  const shadowSubjects = [
    ...walkers.map(({ model }) => ({
      group: model.group,
      radius: 0.22,
      lift: 0.25,
      sea: false,
    })),
    { group: creator.group, radius: 0.42, lift: 0.65, sea: false },
    ...boats.map((group) => ({ group, radius: 0.42, lift: 0.2, sea: true })),
    ...birds.map(({ group }) => ({
      group,
      radius: 0.23,
      lift: 4.5,
      sea: true,
    })),
  ];
  shadowSubjects.forEach(({ group }) =>
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    }),
  );
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x233f44,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const movingShadows = new THREE.InstancedMesh(
    new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2),
    shadowMaterial,
    shadowSubjects.length,
  );
  movingShadows.frustumCulled = false;
  scene.add(movingShadows);
  const shadowTransform = new THREE.Object3D();
  function updateMovingShadows() {
    const projection = Math.max(5, sun.position.y);
    shadowSubjects.forEach(({ group, radius, lift, sea }, index) => {
      shadowTransform.position.set(
        group.position.x - (sun.position.x / projection) * lift,
        sea ? -0.79 : group.position.y + 0.028,
        group.position.z - (sun.position.z / projection) * lift,
      );
      shadowTransform.scale.set(
        radius * (1 + lift / projection),
        1,
        radius * 0.65,
      );
      shadowTransform.rotation.y = group.rotation.y;
      shadowTransform.updateMatrix();
      movingShadows.setMatrixAt(index, shadowTransform.matrix);
    });
    movingShadows.instanceMatrix.needsUpdate = true;
    shadowMaterial.opacity = 0.2 - nightLevel * 0.12;
    container.dataset.shadowFrame = String(Math.round(ambientTime * 30));
  }
  scene.traverse((object) => {
    if (object.userData.canopy) leaves.push(object);
    if (object instanceof THREE.PointLight) pointLights.push(object);
  });
  const phaseConfigs = {
    dawn: {
      sky: 0xd5d4e1,
      water: 0x809caf,
      sun: 0xffc49b,
      power: 1.7,
      ambient: 1.8,
      night: 0.1,
      position: new THREE.Vector3(-12, 6, 9),
    },
    noon: {
      sky: 0xb9dadd,
      water: 0x5d9fa5,
      sun: 0xfff2d6,
      power: 2.6,
      ambient: 2.2,
      night: 0,
      position: new THREE.Vector3(-6, 18, 10),
    },
    sunset: {
      sky: 0xe7b3a5,
      water: 0x826d93,
      sun: 0xffa469,
      power: 1.8,
      ambient: 1.5,
      night: 0.3,
      position: new THREE.Vector3(-17, 5, 5),
    },
    night: {
      sky: 0x142440,
      water: 0x1b3d61,
      sun: 0xa9c8ff,
      power: 0.7,
      ambient: 0.8,
      night: 1,
      position: new THREE.Vector3(4, 16, -7),
    },
  };
  let phase: DayPhase = 'noon',
    nightLevel = 0;
  let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches,
    visible = true,
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
    moving = false,
    cameraStarted = 0;
  let completeMove: (() => void) | undefined;
  const targetCamera = new THREE.Vector3(),
    targetLook = new THREE.Vector3(),
    startCamera = new THREE.Vector3(),
    startLook = new THREE.Vector3();
  function paint() {
    if (!visible || disposed) return;
    camera.updateMatrixWorld();
    updateMovingShadows();
    renderer.render(scene, camera);
    projectLabels();
  }
  function projectLabels() {
    scene.updateMatrixWorld(true);
    const used: { x: number; y: number; w: number }[] = [];
    container
      .querySelectorAll<HTMLButtonElement>('[data-portal]')
      .forEach((button) => {
        const id = button.dataset.portal as IslandId;
        const island = roots.get(id)!;
        const point = island
          .localToWorld(new THREE.Vector3(0, id === 'about' ? 2.5 : 2.1, 0))
          .project(camera);
        const x = id === active ? width / 2 : ((point.x + 1) * width) / 2;
        let y = ((1 - point.y) * height) / 2;
        if (id === active) y = width < 540 ? 146 : 106;
        const show =
          point.z < 1 &&
          point.z > -1 &&
          x > 32 &&
          x < width - 32 &&
          y > 100 &&
          y < height - 72;
        button.style.visibility = show ? 'visible' : 'hidden';
        const w = button.offsetWidth || 90;
        for (const previous of used)
          if (
            Math.abs(x - previous.x) < (w + previous.w) / 2 + 6 &&
            Math.abs(y - previous.y) < 34
          )
            y = previous.y + 35;
        used.push({ x, y, w });
        button.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
        button.setAttribute('aria-pressed', String(id === active));
      });
    if (!active) return;
    const island = roots.get(active)!;
    const anchors =
      active === 'bookflow' || active === 'assetflow'
        ? [
            new THREE.Vector3(-4, 2.6, -1.65),
            new THREE.Vector3(4, 2.6, -1.65),
            new THREE.Vector3(0, 2.6, 1.7),
          ]
        : active === 'journal'
          ? [
              new THREE.Vector3(-1.5, 2, -1.8),
              new THREE.Vector3(1.5, 2, -1.8),
              new THREE.Vector3(-1.5, 2, 1.5),
              new THREE.Vector3(1.5, 2, 1.5),
              new THREE.Vector3(0, 2, 2.8),
            ]
          : active === 'zailongchang'
            ? [
                new THREE.Vector3(0, 2, -0.5),
                new THREE.Vector3(-1.5, 2, 1),
                new THREE.Vector3(1.5, 2, 1),
              ]
            : active === 'portfolio'
              ? [new THREE.Vector3(-1, 2, 0.5), new THREE.Vector3(1, 2, 0.5)]
              : [new THREE.Vector3(0, 2.6, 1)];
    labels.forEach((button, index) => {
      if (button.hidden || !anchors[index]) return;
      const point = (
        active === 'about'
          ? creator.group.position.clone().add(new THREE.Vector3(0, 1.8, 0))
          : island.localToWorld(anchors[index]!.clone())
      ).project(camera);
      let x = ((point.x + 1) * width) / 2;
      let y = ((1 - point.y) * height) / 2;
      // Keep the reading target stable while its character continues walking.
      if (active === 'about') {
        x = width / 2;
        y = height * 0.42;
      }
      if (width < 600 && anchors.length === 2) x += index === 0 ? -22 : 22;
      if (width < 900 && active === 'journal') {
        x = width * (index % 2 === 0 ? 0.25 : 0.75);
        y = height * 0.36 + Math.floor(index / 2) * 78;
      }
      if (width < 900 && active === 'zailongchang') {
        x = index === 0 ? width / 2 : width * (index === 1 ? 0.25 : 0.75);
        y = height * 0.36 + (index === 0 ? 0 : 90);
      }
      if (height < 500 && (active === 'journal' || active === 'zailongchang')) {
        x = (width * (index + 0.5)) / anchors.length;
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
    moving = false;
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
    paint();
    if (t < 1) cameraFrame = requestAnimationFrame(cameraTick);
    else {
      moving = false;
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
      paint();
      return Promise.resolve();
    }
    startCamera.copy(camera.position);
    startLook.copy(controls.target);
    cameraStarted = performance.now();
    moving = true;
    return new Promise<void>((resolve) => {
      completeMove = resolve;
      cameraFrame = requestAnimationFrame(cameraTick);
    });
  }
  function setPhase(value: DayPhase, animated = true) {
    cancelAnimationFrame(lightingFrame);
    phase = value;
    const config = phaseConfigs[value];
    const from = {
      sky: (scene.background as THREE.Color).clone(),
      water: waterMat.color.clone(),
      sun: sun.color.clone(),
      power: sun.intensity,
      ambient: hemi.intensity,
      night: nightLevel,
      position: sun.position.clone(),
    };
    const sky = new THREE.Color(config.sky),
      sea = new THREE.Color(config.water),
      color = new THREE.Color(config.sun);
    const start = performance.now();
    const update = (now: number) => {
      lightingFrame = 0;
      const t = !animated || reduced ? 1 : Math.min(1, (now - start) / 1100);
      const e = t * t * (3 - 2 * t);
      (scene.background as THREE.Color).lerpColors(from.sky, sky, e);
      (scene.fog as THREE.FogExp2).color.copy(scene.background as THREE.Color);
      waterMat.color.lerpColors(from.water, sea, e);
      sun.color.lerpColors(from.sun, color, e);
      sun.position.lerpVectors(from.position, config.position, e);
      sun.intensity = THREE.MathUtils.lerp(from.power, config.power, e);
      hemi.intensity = THREE.MathUtils.lerp(from.ambient, config.ambient, e);
      nightLevel = THREE.MathUtils.lerp(from.night, config.night, e);
      windows.emissiveIntensity = nightLevel * 2.4;
      pointLights.forEach((light) => (light.intensity = nightLevel * 2.5));
      fireflies.forEach((fly) => (fly.visible = nightLevel > 0.5));
      renderer.shadowMap.needsUpdate = true;
      paint();
      if (t < 1 && !disposed && visible)
        lightingFrame = requestAnimationFrame(update);
    };
    update(start);
  }
  function ambient(now: number) {
    ambientFrame = 0;
    if (!visible || disposed || reduced || !ambientEnabled) {
      ambientLast = 0;
      return;
    }
    if (!ambientLast) ambientLast = now;
    const elapsed = now - ambientLast;
    if (elapsed >= 1000 / 30) {
      const delta = Math.min(elapsed, 70) / 1000;
      ambientTime += delta;
      ambientLast = now;
      const peers = [...walkers.map(({ motion }) => motion!), creatorMotion];
      walkers.forEach(({ model, offset, motion: walkerMotion }) => {
        const motion = walkerMotion!;
        motion.update(delta, peers);
        const stride = motion.moving ? 1 : 0;
        model.group.position.set(
          motion.position.x,
          motion.height +
            Math.abs(Math.sin(ambientTime * 5 + offset)) * 0.015 * stride,
          motion.position.z,
        );
        model.group.rotation.y = motion.heading;
        model.legs.forEach(
          (leg, i) =>
            (leg.rotation.x =
              Math.sin(ambientTime * 5 + offset + i * Math.PI) * 0.38 * stride),
        );
        model.arms.forEach(
          (arm, i) =>
            (arm.rotation.x =
              -Math.sin(ambientTime * 5 + offset + i * Math.PI) *
              0.28 *
              stride),
        );
      });
      creatorMotion.update(delta, peers);
      creator.group.position.set(
        creatorMotion.position.x,
        creatorMotion.height,
        creatorMotion.position.z,
      );
      creator.group.rotation.y = creatorMotion.heading;
      const creatorStride = creatorMotion.moving ? 1 : 0;
      creator.legs.forEach(
        (leg, i) =>
          (leg.rotation.x =
            Math.sin(ambientTime * 4 + i * Math.PI) * 0.3 * creatorStride),
      );
      creator.arms.forEach((arm, i) => {
        arm.rotation.z = 0;
        arm.rotation.x =
          -Math.sin(ambientTime * 4 + i * Math.PI) * 0.22 * creatorStride;
      });
      container.dataset.avatarDistance = creatorMotion.distance.toFixed(2);
      const centers = islandLayout(width < 900 && height > width);
      const onBridge = peers.some(
        ({ position }) =>
          !Object.entries(centers).some(([id, c]) => {
            const [rx, rz] = islandRadii(id as IslandId);
            return (
              Math.hypot((position.x - c.x) / rx, (position.z - c.z) / rz) <= 1
            );
          }),
      );
      if (onBridge) bridgeCrossings++;
      container.dataset.bridgeCrossings = String(bridgeCrossings);
      boats.forEach((boat, i) => {
        const motion = boatMotion[i]!;
        motion.update(delta, boatMotion);
        if (i === 0 && motion.arrived) {
          if (!dockOutbound) {
            harborVisits++;
            motion.goTo(
              seaNavigation.nearest({
                x: centers.zailongchang.x - 7,
                z: centers.zailongchang.z + 2,
              }),
            );
          } else motion.goTo(dock);
          dockOutbound = !dockOutbound;
        }
        boat.position.set(
          motion.position.x,
          -0.73 + Math.sin(ambientTime + i) * 0.04,
          motion.position.z,
        );
        boat.rotation.y = motion.heading;
      });
      container.dataset.harborVisits = String(harborVisits);
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
        (leaf, i) =>
          (leaf.rotation.z = Math.sin(ambientTime * 0.8 + i) * 0.025),
      );
      waterClock.value = ambientTime;
      ripples.forEach(
        (ripple, i) =>
          (ripple.scale.y = 1 + Math.sin(ambientTime * 0.7 + i) * 0.16),
      );
      fireflies.forEach((fly, i) => {
        const { motion, origin } = fireflyMotion[i]!;
        motion.update(delta);
        fly.position.x = origin.x + motion.position.x;
        fly.position.z = origin.z + motion.position.z;
        fly.position.y = 0.9 + Math.sin(ambientTime + i) * 0.4;
        fly.scale.setScalar(0.6 + Math.sin(ambientTime * 2 + i) * 0.35);
      });
      if (!moving) paint();
    }
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
    width = container.clientWidth;
    height = container.clientHeight;
    layout(width, height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    home();
    stopCamera(true);
    paint();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const redraw = () => {
    if (!moving) paint();
  };
  const interrupt = () => stopCamera();
  controls.addEventListener('change', redraw);
  controls.addEventListener('start', interrupt);
  const raycaster = new THREE.Raycaster();
  let downX = 0,
    downY = 0;
  const pointerDown = (event: PointerEvent) => {
    downX = event.clientX;
    downY = event.clientY;
  };
  const pointerUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects([...roots.values()], true)[0];
    if (!hit) return;
    let object: THREE.Object3D | null = hit.object;
    let hotspot: number | undefined;
    while (object && object.userData.island === undefined) {
      if (object.userData.hotspot !== undefined)
        hotspot = object.userData.hotspot as number;
      else if (
        object.userData.station !== undefined &&
        [0, 2, 4].includes(object.userData.station as number)
      )
        hotspot = [0, 2, 4].indexOf(object.userData.station as number);
      object = object.parent;
    }
    if (!object) return;
    const id = object.userData.island as IslandId;
    if (active === id && hotspot !== undefined) onSelect(hotspot);
    else onEnter(id);
  };
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  const contextLost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  return {
    focusAvatar() {
      targetLook.copy(creator.group.position);
      targetCamera.copy(targetLook).add(new THREE.Vector3(2, 10, 10));
      return move();
    },
    focusIsland(id, animated = true) {
      active = id;
      home();
      renderer.shadowMap.needsUpdate = true;
      return move(animated);
    },
    overview(animated = true) {
      active = null;
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
      visible = value;
      schedule();
      if (!value) {
        stopCamera(true);
        cancelAnimationFrame(lightingFrame);
      } else {
        setPhase(phase, false);
        paint();
      }
    },
    setReducedMotion(value) {
      reduced = value;
      if (value) {
        stopCamera(true);
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
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
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
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
