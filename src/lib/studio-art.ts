import type { DayPhase } from './world-config';

// Shared material pigments stay in sRGB. Three.js converts them to its linear working space.
export const pigments = {
  limestone: 0xe9dbbf,
  sand: 0xcdb28b,
  stone: 0x887b68,
  grass: 0x889f76,
  dryGrass: 0xb2b783,
  timber: 0xa57752,
  bark: 0x76553f,
  foliage: [0x55795d, 0x789159, 0x9b9a57],
  ink: 0x293e46,
  brass: 0xc59952,
  copper: 0xb95f46,
  coral: 0xbe634c,
  teal: 0x397475,
  steel: 0x6b8494,
  violet: 0x756981,
  clay: 0xa3523b,
  olive: 0x8e985e,
  ochre: 0xba7639,
  seaDeep: 0x397589,
  seaShallow: 0x81bfb0,
  reef: 0x728a85,
} as const;

export const phaseLight = {
  dawn: {
    sky: 0xc3ccd8,
    fog: 0.013,
    sun: 0xffc495,
    power: 2.1,
    ambientSky: 0xc8e3ff,
    ambientGround: 0x899397,
    ambient: 1.95,
    shade: 0.76,
    night: 0.14,
    position: [-13, 8, 11],
  },
  noon: {
    sky: 0xb1d0d3,
    fog: 0.009,
    sun: 0xfff4de,
    power: 2.55,
    ambientSky: 0xe7f3fb,
    ambientGround: 0x829385,
    ambient: 2.05,
    shade: 0.89,
    night: 0,
    position: [-6, 22, 9],
  },
  sunset: {
    sky: 0xd69e80,
    fog: 0.01,
    haze: 0xb0a9af,
    sun: 0xffb476,
    power: 2.65,
    ambientSky: 0xbbd9f0,
    ambientGround: 0xa27c68,
    ambient: 1.83,
    shade: 0.73,
    night: 0.29,
    position: [-18, 6, 6],
  },
  night: {
    sky: 0x243750,
    fog: 0.014,
    sun: 0xb1cbff,
    power: 0.56,
    ambientSky: 0xa9c4e7,
    ambientGround: 0x606d89,
    ambient: 1.55,
    shade: 0.16,
    night: 1,
    position: [6, 16, -10],
  },
} satisfies Record<
  DayPhase,
  {
    sky: number;
    fog: number;
    haze?: number;
    sun: number;
    power: number;
    ambientSky: number;
    ambientGround: number;
    ambient: number;
    shade: number;
    night: number;
    position: [number, number, number];
  }
>;
