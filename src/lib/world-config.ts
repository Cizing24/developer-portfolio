import type { Locale } from './i18n';
import type { ProjectId } from './project-introductions';
export type IslandId =
  'portfolio' | ProjectId | 'journal' | 'contact' | 'about' | 'zailongchang';
export type DayPhase = 'dawn' | 'noon' | 'sunset' | 'night';
export const dayPhases: DayPhase[] = ['dawn', 'noon', 'sunset', 'night'];
export const islands: { id: IslandId; zh: string; en: string; view: string }[] =
  [
    { id: 'portfolio', zh: '作品集', en: 'Portfolio', view: 'projects' },
    {
      id: 'bookflow',
      zh: 'BookFlow',
      en: 'BookFlow',
      view: 'project-bookflow',
    },
    {
      id: 'assetflow',
      zh: 'AssetFlow',
      en: 'AssetFlow',
      view: 'project-assetflow',
    },
    { id: 'journal', zh: '筆記', en: 'Notes', view: 'journal' },
    { id: 'contact', zh: '聯絡', en: 'Contact', view: 'contact' },
    { id: 'about', zh: 'CIZING', en: 'CIZING', view: 'about' },
    {
      id: 'zailongchang',
      zh: '在隆昌',
      en: 'Zailongchang',
      view: 'zailongchang',
    },
  ];
// Island activation is separate from restoring a camera position from a URL.
export function directIslandView(id: IslandId) {
  if (
    id === 'portfolio' ||
    id === 'about' ||
    id === 'contact' ||
    id === 'journal'
  )
    return islands.find((island) => island.id === id)!.view;
}
export function isIsland(value: string | null): value is IslandId {
  return islands.some((island) => island.id === value);
}
export function islandName(id: IslandId, locale: Locale) {
  const island = islands.find((item) => item.id === id)!;
  return locale === 'en' ? island.en : island.zh;
}
export function phaseName(phase: DayPhase, locale: Locale) {
  return (
    locale === 'en'
      ? { dawn: 'Dawn', noon: 'Noon', sunset: 'Sunset', night: 'Night' }
      : { dawn: '清晨', noon: '中午', sunset: '夕陽', night: '晚上' }
  )[phase];
}
export const projectFacilities = {
  bookflow: [
    {
      zh: '預約流程',
      en: 'Book an appointment',
      suffix: '',
      x: -4,
      z: -1.65,
      labelY: 2.55,
    },
    {
      zh: '店家行事曆',
      en: 'Business calendar',
      suffix: '-calendar',
      x: 4,
      z: -1.65,
      labelY: 2.65,
    },
    {
      zh: '系統原理',
      en: 'System architecture',
      suffix: '-architecture',
      x: 0,
      z: 1.7,
      labelY: 2.45,
    },
  ],
  assetflow: [
    {
      zh: '設備清冊',
      en: 'Equipment register',
      suffix: '',
      x: -4,
      z: -1.65,
      labelY: 2.5,
    },
    {
      zh: '操作交接',
      en: 'Run a handover',
      suffix: '-handover',
      x: 4,
      z: -1.65,
      labelY: 2.45,
    },
    {
      zh: '系統原理',
      en: 'System architecture',
      suffix: '-architecture',
      x: 0,
      z: 1.7,
      labelY: 2.45,
    },
  ],
} as const;

export function projectView(id: ProjectId, suffix = '') {
  return `project-${id}${suffix}`;
}

export function projectShowcaseView(view: string) {
  const match = /^project-(bookflow|assetflow)(.*)$/.exec(view);
  if (!match) return;
  const id = match[1] as ProjectId;
  const suffix = match[2];
  const secondary = projectFacilities[id][1].suffix;
  if (suffix === '' || suffix === '-purpose') return { id, area: 'demo' };
  if (suffix === secondary || suffix === '-features')
    return { id, area: 'secondary' };
  if (suffix === '-architecture') return { id, area: 'architecture' };
  if (suffix === '-evidence') return { id, area: 'evidence' };
}

export interface IslandItem {
  title: string;
  view: string;
}
export function islandItems(id: IslandId, locale: Locale): IslandItem[] {
  if (id === 'bookflow' || id === 'assetflow')
    return projectFacilities[id].map((facility) => ({
      title: locale === 'en' ? facility.en : facility.zh,
      view: projectView(id, facility.suffix),
    }));
  if (id === 'journal') return [{ title: 'Engineering Lab', view: 'journal' }];
  if (id === 'zailongchang')
    return [
      {
        title: locale === 'en' ? 'About the website' : '網站與地方',
        view: 'zailongchang',
      },
      {
        title: locale === 'en' ? 'Development notes' : '開發筆記',
        view: 'note-zailongchang-development',
      },
      {
        title:
          locale === 'en'
            ? 'Government plan · application'
            : '政府計畫・申請紀錄',
        view: 'note-youth-village-action',
      },
    ];
  return [];
}
