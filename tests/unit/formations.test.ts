import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import {
  announceFormation,
  chapterIds,
  formationEvent,
  formationFor,
  isFormationId,
  resolveFormation,
} from '../../src/lib/landing/formations.ts';

describe('formationFor', () => {
  it('maps every chapter to its formation', () => {
    expect(chapterIds.map((id) => formationFor(id))).toEqual([
      'hero',
      'drift',
      'service-0',
      'drift',
      'hidden',
      'release',
    ]);
    expect(formationFor('services', 4)).toBe('service-4');
  });
});

describe('resolveFormation', () => {
  it('hides the drift on the low tier, where there is no back canvas', () => {
    expect(resolveFormation('drift', 'low')).toBe('hidden');
    expect(resolveFormation('drift', 'high')).toBe('drift');
    expect(resolveFormation('service-2', 'low')).toBe('service-2');
  });
});

describe('isFormationId', () => {
  it('accepts known formations and service indices only', () => {
    for (const id of ['hero', 'drift', 'hidden', 'release', 'service-5'])
      expect(isFormationId(id)).toBe(true);
    for (const id of ['service-', 'service-x', 'garland', ''])
      expect(isFormationId(id)).toBe(false);
  });
});

describe('announceFormation', () => {
  it('records the formation and dispatches one bubbling event per change', () => {
    const { document } = new JSDOM('<div data-landing></div>').window;
    const root = document.querySelector<HTMLElement>('[data-landing]')!;
    const seen: string[] = [];
    document.addEventListener(formationEvent, (event) =>
      seen.push((event as CustomEvent<{ id: string }>).detail.id),
    );
    announceFormation(root, 'drift');
    announceFormation(root, 'drift');
    announceFormation(root, 'service-1');
    expect(root.dataset.formation).toBe('service-1');
    expect(seen).toEqual(['drift', 'service-1']);
  });
});
