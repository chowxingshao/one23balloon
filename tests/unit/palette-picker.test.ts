import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { paletteChangeEvent } from '../../src/lib/landing/events.ts';
import {
  initPalettePicker,
  selectPalette,
} from '../../src/scripts/palette-picker.ts';

let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM(
    `<div data-landing data-palette="blush-champagne" data-whatsapp-number="60109017633">
      <div data-palette-picker hidden role="radiogroup">
        <button role="radio" aria-checked="true" tabindex="0" data-palette-option="blush-champagne" data-message="Blush please">Blush</button>
        <button role="radio" aria-checked="false" tabindex="-1" data-palette-option="rose-gold" data-message="Rose & gold please">Rose</button>
      </div>
      <a data-palette-link href="https://wa.me/60109017633?text=Hi">Hero</a>
    </div>
    <a data-palette-link href="https://wa.me/60109017633?text=Hi">Header</a>`,
    { url: 'https://local.example.test/' },
  );
  vi.stubGlobal('CustomEvent', dom.window.CustomEvent);
});
afterEach(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});
const document = () => dom.window.document;
const root = () => document().querySelector<HTMLElement>('[data-landing]')!;
const option = (id: string) =>
  document().querySelector<HTMLElement>(`[data-palette-option="${id}"]`)!;
const hrefs = () =>
  [...document().querySelectorAll('a[data-palette-link]')].map((link) =>
    link.getAttribute('href'),
  );
const key = (target: Element, name: string) =>
  target.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: name, bubbles: true }),
  );

describe('palette picker', () => {
  it('reveals the pickers and hides them again on dispose', () => {
    const picker = document().querySelector('[data-palette-picker]')!;
    const dispose = initPalettePicker(root());
    expect(picker.hasAttribute('hidden')).toBe(false);
    dispose();
    expect(picker.hasAttribute('hidden')).toBe(true);
  });

  it('selects on click, rewrites every palette link and announces the change', () => {
    initPalettePicker(root());
    const events: string[] = [];
    document().addEventListener(paletteChangeEvent, (event) =>
      events.push((event as CustomEvent<{ id: string }>).detail.id),
    );
    option('rose-gold').click();
    expect(root().dataset.palette).toBe('rose-gold');
    expect(option('rose-gold').getAttribute('aria-checked')).toBe('true');
    expect(option('blush-champagne').getAttribute('aria-checked')).toBe(
      'false',
    );
    expect(option('rose-gold').tabIndex).toBe(0);
    expect(option('blush-champagne').tabIndex).toBe(-1);
    expect(hrefs()).toEqual([
      'https://wa.me/60109017633?text=Rose%20%26%20gold%20please',
      'https://wa.me/60109017633?text=Rose%20%26%20gold%20please',
    ]);
    expect(events).toEqual(['rose-gold']);
  });

  it('moves the selection with arrow keys, wraps, and moves focus', () => {
    initPalettePicker(root());
    key(option('blush-champagne'), 'ArrowRight');
    expect(root().dataset.palette).toBe('rose-gold');
    expect(document().activeElement).toBe(option('rose-gold'));
    key(option('rose-gold'), 'ArrowRight');
    expect(root().dataset.palette).toBe('blush-champagne');
    key(option('blush-champagne'), 'End');
    expect(root().dataset.palette).toBe('rose-gold');
  });

  it('ignores clicks after dispose', () => {
    const dispose = initPalettePicker(root());
    dispose();
    option('rose-gold').click();
    expect(root().dataset.palette).toBe('blush-champagne');
  });

  it('leaves links untouched without a WhatsApp number', () => {
    root().removeAttribute('data-whatsapp-number');
    selectPalette(root(), 'rose-gold');
    expect(hrefs()[0]).toBe('https://wa.me/60109017633?text=Hi');
  });
});
