import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';

type Created = {
  trigger: Element;
  onToggle: (self: { isActive: boolean }) => void;
};

afterEach(() => {
  vi.doUnmock('gsap/ScrollTrigger');
  vi.resetModules();
});

describe('initFormationTriggers', () => {
  it('announces each chapter and each service card, and kills its triggers', async () => {
    const created: Created[] = [];
    const kill = vi.fn();
    vi.doMock('gsap/ScrollTrigger', () => ({
      ScrollTrigger: {
        create: (options: Created) => {
          created.push(options);
          return { kill };
        },
      },
    }));
    const { initFormationTriggers } =
      await import('../../src/scripts/formation-triggers.ts');
    const { document } = new JSDOM(`<div data-landing data-formation="hero">
      <section data-chapter="hero"></section>
      <section data-chapter="statement"></section>
      <section data-chapter="services">
        <div data-service-card></div><div data-service-card></div>
      </section>
      <section data-chapter="celebrations"></section>
      <section data-chapter="closing"></section>
    </div>`).window;
    const root = document.querySelector<HTMLElement>('[data-landing]')!;
    const dispose = initFormationTriggers(root);
    expect(created).toHaveLength(6);
    const toggle = (selector: string, index = 0) => {
      const matches = created.filter((entry) =>
        entry.trigger.matches(selector),
      );
      matches[index]!.onToggle({ isActive: true });
    };
    toggle('[data-service-card]', 1);
    expect(root.dataset.formation).toBe('service-1');
    toggle('[data-chapter="closing"]');
    expect(root.dataset.formation).toBe('release');
    created[0]!.onToggle({ isActive: false });
    expect(root.dataset.formation).toBe('release');
    dispose();
    expect(kill).toHaveBeenCalledTimes(6);
  });
});
