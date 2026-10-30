const internationalDigits = /^\d{10,15}$/;

export function whatsappUrl(number: string, message: string): string {
  if (!internationalDigits.test(number))
    throw new Error(
      `WhatsApp numbers must be 10–15 digits starting with the country code: ${number}`,
    );
  const text = message.trim();
  if (!text) throw new Error('A WhatsApp message must not be empty.');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
