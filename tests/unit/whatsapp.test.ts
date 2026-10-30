import { describe, expect, it } from 'vitest';
import { whatsappUrl } from '../../src/lib/contact/whatsapp.ts';

describe('whatsappUrl', () => {
  it('builds a wa.me link with an encoded message', () => {
    expect(whatsappUrl('60109017633', 'Hi, a setup in Rose & gold?')).toBe(
      'https://wa.me/60109017633?text=Hi%2C%20a%20setup%20in%20Rose%20%26%20gold%3F',
    );
  });

  it('encodes Chinese text and trims whitespace', () => {
    expect(whatsappUrl('60109017633', '  你好  ')).toBe(
      'https://wa.me/60109017633?text=%E4%BD%A0%E5%A5%BD',
    );
  });

  it.each(['+60109017633', '010-9017633', '601090', '6010901763312345'])(
    'rejects the number %s',
    (number) => {
      expect(() => whatsappUrl(number, 'Hi')).toThrow(/digits/);
    },
  );

  it('rejects an empty message', () => {
    expect(() => whatsappUrl('60109017633', '   ')).toThrow(/empty/);
  });
});
