const cjk = /[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uFF00-\uFFEF]/gu;

export const cjkUnicodeRange =
  'U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+FF00-FFEF';

// Every file whose Chinese text renders with the subset fonts.
export const zhCharsetSources = [
  'src/content/landing/zh.yaml',
  'src/content/pages/zh/home.md',
  'src/i18n/zh.json',
];

export function collectCjk(text: string): string[] {
  return [...new Set(text.match(cjk) ?? [])].sort();
}
