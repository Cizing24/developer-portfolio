import type { Locale } from './i18n';
import {
  projectTopics,
  topicTitle,
  type ProjectId,
} from './project-introductions';
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
export interface IslandItem {
  title: string;
  view?: string;
  island?: IslandId;
}
export function islandItems(id: IslandId, locale: Locale): IslandItem[] {
  if (id === 'bookflow' || id === 'assetflow')
    return projectTopics.map((topic) => ({
      title: topicTitle(topic, locale),
      view: `project-${id}-${topic}`,
    }));
  if (id === 'portfolio')
    return [
      { title: 'BookFlow', island: 'bookflow' },
      { title: 'AssetFlow', island: 'assetflow' },
    ];
  if (id === 'journal')
    return locale === 'en'
      ? [
          { title: 'Booking consistency', view: 'note-booking-consistency' },
          { title: 'Date contracts', view: 'note-date-contracts' },
          {
            title: 'Zailongchang development',
            view: 'note-zailongchang-development',
          },
          {
            title: 'Cotton booking · client work',
            view: 'note-cotton-booking',
          },
          {
            title: 'Youth Village Cultural Action · application',
            view: 'note-youth-village-action',
          },
        ]
      : [
          { title: '預約一致性', view: 'note-booking-consistency' },
          { title: '日期處理', view: 'note-date-contracts' },
          { title: '在隆昌網站開發', view: 'note-zailongchang-development' },
          { title: '棉麻屋預約・接案紀錄', view: 'note-cotton-booking' },
          {
            title: '政府計畫・青年村落文化行動計畫',
            view: 'note-youth-village-action',
          },
        ];
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
  return [
    {
      title:
        id === 'about'
          ? locale === 'en'
            ? 'About CIZING'
            : '關於 CIZING'
          : locale === 'en'
            ? 'Contact details'
            : '聯絡方式',
      view: id,
    },
  ];
}
