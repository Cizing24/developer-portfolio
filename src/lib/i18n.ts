export const locales = ['zh-tw', 'en'] as const;
export type Locale = (typeof locales)[number];
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
export function localeFromPath(path: string): Locale {
  const first = path.split('/')[1] ?? '';
  return isLocale(first) ? first : 'zh-tw';
}
export function localizedPath(locale: Locale, path = '') {
  return `/${locale}/${path.replace(/^\/+|\/+$/g, '')}${path ? '/' : ''}`;
}
export function entrySlug(id: string) {
  return id.split('/').slice(1).join('/');
}
export const dictionaries = {
  'zh-tw': {
    home: '首頁',
    projects: '作品',
    notes: '技術筆記',
    about: '關於我',
    contact: '聯絡',
    skip: '跳到主要內容',
    menu: '選單',
    navigation: '主要導覽',
    description:
      '從使用者流程到資料一致性，以完整專案呈現軟體工程的思考與實踐。',
    workTitle: '讓作品說明，\n我如何思考。',
    allProjects: '所有作品',
    case: '閱讀完整案例',
    notDeployed: '已實作・隔離展示・未公開部署',
    private: '私人來源',
    public: '公開來源',
    toc: '文章目錄',
    quick: '快速概覽',
    deep: '工程深入閱讀',
    evidence: '證據與驗證',
    screenshot: '實際產品畫面 · 所有店家、人員與設備均為合成展示資料。',
    source: '原始碼',
    review: '資料核對',
    status: '開發狀態',
    deployment: '部署狀態',
    back: '返回作品列表',
    allNotes: '所有筆記',
    minutes: '分鐘閱讀',
    filter: '依技術篩選',
    allTech: '所有技術',
    category: '分類',
    tag: '標籤',
    allCategories: '所有分類',
    allTags: '所有標籤',
    empty: '目前沒有符合條件的內容。',
    footer: '把思考寫進設計，把可靠留在細節。',
    ctaTitle: '讓下一個問題，\n成為一起完成的作品。',
    ctaCopy: '歡迎交流專案、技術選擇與軟體工程機會。',
    ctaLink: '開始對話',
    github: '前往 GitHub',
  },
  en: {
    home: 'Home',
    projects: 'Projects',
    notes: 'Notes',
    about: 'About',
    contact: 'Contact',
    skip: 'Skip to main content',
    menu: 'Menu',
    navigation: 'Main navigation',
    description:
      'From user journeys to data consistency: software engineering explained through complete, verifiable projects.',
    workTitle: 'The work explains\nthe thinking.',
    allProjects: 'All projects',
    case: 'Read the case study',
    notDeployed: 'Implemented · isolated showcase · not publicly deployed',
    private: 'Private source',
    public: 'Public source',
    toc: 'On this page',
    quick: 'Quick overview',
    deep: 'Engineering deep dive',
    evidence: 'Evidence & verification',
    screenshot:
      'Actual product interface · all businesses, people and assets are synthetic showcase data.',
    source: 'Source',
    review: 'Reviewed',
    status: 'Development',
    deployment: 'Deployment',
    back: 'Back to projects',
    allNotes: 'All notes',
    minutes: 'min read',
    filter: 'Filter by technology',
    allTech: 'All technologies',
    category: 'Category',
    tag: 'Tag',
    allCategories: 'All categories',
    allTags: 'All tags',
    empty: 'No matching content. Try another filter.',
    footer: 'Thoughtful decisions. Reliability in the details.',
    ctaTitle: 'A new question.\nSomething worth building.',
    ctaCopy:
      'Open to conversations about projects, technical decisions and software engineering opportunities.',
    ctaLink: 'Start a conversation',
    github: 'Visit GitHub',
  },
} as const;
export function t(locale: Locale) {
  return dictionaries[locale];
}
