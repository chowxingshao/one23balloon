# Project brief

## Client and purpose

one23balloon (KL Event & Party Decoration, SSM CT0152510-K) is a balloon decoration studio based in Kepong, Kuala Lumpur, serving KL and Selangor. The site is a single landing page that presents their work as premium event styling and turns visitors into WhatsApp enquiries.

## Site type

Landing.

## Audience

- Couples and partners planning surprises, proposals, weddings and milestone birthdays (hotel rooms, Airbnbs, KTV rooms, restaurants).
- Parents planning baby celebrations (满月, 百日宴, 周岁宴) and gender reveals.
- Businesses planning grand openings, anniversaries, annual dinners, product launches and live-stream room backdrops.
- New car owners and dealers planning handover moments.

Visitors are bilingual (English and Simplified Chinese). The one action they should take is to start a WhatsApp conversation, ideally with the occasion and preferred colour palette already in the message.

## Pages and sections

One page, at `/` (English) and `/zh/` (Simplified Chinese):

0. Intro: 3D balloon wall that pops to reveal the hero (script-only, once per session).
1. Header: wordmark, EN / 中文 switch, pinned WhatsApp button.
2. Hero: 3D organic garland on an arched panel, headline, WhatsApp button, palette picker.
3. Celebrations we style: six categories with real photos and per-category WhatsApp links.
4. Recent work: 12 real photos in a pinned horizontal gallery, captioned "Location｜Theme" with palette dots.
5. Balloon sculptures: 3D chrome and pearl pieces plus photos of their real sculptures.
6. Where we set up: venue types in a slow marquee. No brand names.
7. How it works: three steps (pending client confirmation).
8. FAQ: only questions the client has answered.
9. Closing call to action: "Compose your celebration", palette picker and WhatsApp.
10. Footer: business name, registration number, Instagram, Xiaohongshu, copyright.

## Content sources

- Public Instagram profile https://www.instagram.com/one23balloon/ (191 posts, Feb 2025 to Oct 2026, reviewed 2026-10-29) and its highlights.
- Photos: selected and downloaded from the client's own Instagram posts by the implementer, at the highest resolution Instagram serves. Each image records its source post URL.
- Copy: drafted by the implementer in English and Simplified Chinese from the client's own captions and stated facts only. All copy is unapproved until the client signs off.

### Facts taken from Instagram

- Name and service area: "KL Event & Party Decoration", "📍KL & Selangor (CT0152510-K)".
- Services listed in the bio: custom designs for birthdays, weddings, gender reveals, baby parties, grand openings, new car and events.
- Based in Kepong, KL (bouquet pick-up posts, 2025).
- Contact number 010-9017633 appears in the October 2026 hiring post.
- Xiaohongshu link in bio: xhslink.com/m/625h2gZKgy6 (short link).
- "We broke our record: 8 setups in one day" (mini vlog, 2026-09-09).

### Pending client confirmation

- [ ] 010-9017633 is the booking WhatsApp number.
- [ ] Full Xiaohongshu profile URL.
- [ ] Booking steps: lead time, deposit, quote process, setup and takedown.
- [ ] FAQ answers.
- [ ] Approval of all English copy.
- [ ] Approval of all Simplified Chinese copy.
- [ ] Permission to show each photo with a recognisable customer face.
  - [ ] `service-weddings.jpg` (post DaDTmrpSMZP): small printed photo of a child on an easel at the left edge.
  - [ ] `gallery-03.jpg` (post Dcpi_vnS3oh): strip of small vintage family photos on an easel at the right edge.
  - Every other photo in `src/assets/work/` shows no face (see `docs/photo-sources.md`).
- [ ] Permission to show the registration number on the site.

## Tone and voice

Grand, refined, warm, confident, colourful (宏大、高级、不低俗、不幼稚). Speak like a styling studio, not a party shop. Avoid cartoon language, exclamation-mark stacks, emoji in UI copy, prices, brand names of past clients, and invented claims, reviews or statistics.

## Visual references (optional)

- The client's own work: organic balloon garlands wrapped around arched panels, chrome and pearl balloons, big satin bows, fabric drapes, twisted-balloon sculptures (lion dance, tiered cakes, rose and tulip bouquets).
- Their caption habit of naming the colour palette for every setup.
- Gallery-art balloon sculpture (mirror-chrome balloon dog) as a fashion and art cue, not a kids' cue.

## Must-haves and must-nots

Must:

- WhatsApp as the primary action, with pre-filled messages per category and per palette.
- English and Simplified Chinese.
- Motion-heavy, 3D balloon experience that still shows all content without JavaScript and respects reduced motion.
- Real photos of their work.

Must not:

- Show prices.
- Name or show logos of past clients and venues.
- Use cartoon mascots, faces on balloons, or lookalikes of licensed characters (Miffy, Sanrio, Kuromi).
- Publish testimonials, statistics or FAQ answers the client has not confirmed.

## Motion

Cinematic. Balloon-pop intro, real-time 3D hero garland with live palette recolouring, rotating 3D balloon sculptures, pinned horizontal gallery, venue marquee, balloon release at the closing call to action. See `design-direction.md`.

## Technical

- Astro static output on GitHub Pages at https://chowxingshao.github.io/one23balloon/ (no custom domain yet).
- Locales: `en` (default, unprefixed) and `zh` (Simplified Chinese, `/zh/`).
- Blog, projects and RSS off. No contact form; no analytics.
- Three.js for 3D, loaded lazily, with a decision record.
- Design spec: `docs/superpowers/specs/2026-10-29-one23balloon-landing-design.md`.
