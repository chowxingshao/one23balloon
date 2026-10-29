import { whatsappUrl } from '../lib/contact/whatsapp.ts';
import { paletteChangeEvent } from '../lib/landing/events.ts';
import { isPaletteId, type PaletteId } from '../lib/landing/palettes.ts';

const optionSelector = '[data-palette-option]';
const moves: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

function options(scope: ParentNode): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(optionSelector)];
}

export function selectPalette(root: HTMLElement, id: PaletteId): void {
  root.dataset.palette = id;
  let message: string | undefined;
  for (const option of options(root)) {
    const selected = option.dataset.paletteOption === id;
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
    if (selected) message ??= option.dataset.message;
  }
  const number = root.dataset.whatsappNumber;
  if (number && message) {
    const href = whatsappUrl(number, message);
    // The header CTA sits outside the landing root, so search the document.
    for (const link of root.ownerDocument.querySelectorAll<HTMLAnchorElement>(
      'a[data-palette-link]',
    ))
      link.href = href;
  }
  root.dispatchEvent(
    new CustomEvent(paletteChangeEvent, { bubbles: true, detail: { id } }),
  );
}

export function initPalettePicker(root: HTMLElement): () => void {
  const pickers = [
    ...root.querySelectorAll<HTMLElement>('[data-palette-picker]'),
  ];
  if (!pickers.length) return () => undefined;
  for (const picker of pickers) picker.hidden = false;

  const onClick = (event: Event) => {
    const option = (event.target as Element | null)?.closest<HTMLElement>(
      optionSelector,
    );
    const id = option?.dataset.paletteOption;
    if (id && isPaletteId(id)) selectPalette(root, id);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const move = moves[event.key];
    const option = (event.target as Element | null)?.closest<HTMLElement>(
      optionSelector,
    );
    const picker = option?.closest<HTMLElement>('[data-palette-picker]');
    if (!move || !option || !picker) return;
    const group = options(picker);
    const next = group[move(group.indexOf(option), group.length)];
    const id = next?.dataset.paletteOption;
    if (!id || !isPaletteId(id)) return;
    event.preventDefault();
    selectPalette(root, id);
    next.focus();
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    for (const picker of pickers) picker.hidden = true;
  };
}
