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

Visitors are bilingual (English and Simplified Chinese). The one action they should take is to start a WhatsApp conversation, ideally with the occasion already in the message.

## Pages and sections

One page, at `/` (English) and `/zh/` (Simplified Chinese):

Header: wordmark, EN / 中文 switch, pinned WhatsApp pill. Then six chapters and a footer:

1. Hero: "Every party, bigger." over one travelling 3D balloon cluster, shown first as a captured poster still.
2. Statement: one sentence about the occasions the studio styles, with four inline photo pills.
3. What we do: six colour cards (weddings, grand openings, birthdays, baby parties, new cars, balloon bouquets), each with a per-service WhatsApp link.
4. Signature pieces: a giant marquee line and two balloon sculpture photos.
5. Recent celebrations: a wall of 40 real photos, each captioned with its occasion.
6. Closing: "Let's make yours." on a pink flood, with the WhatsApp, Instagram and Xiaohongshu actions.
7. Footer: giant wordmark, business name, registration number, Instagram, Xiaohongshu, copyright.

## Content sources

- Public Instagram profile https://www.instagram.com/one23balloon/ (191 posts, Feb 2025 to Oct 2026, reviewed 2026-10-29) and its highlights. The 26 photos added in the 2026-10-30 redesign also come from an export of the client's account (posts, carousels and story highlights); `docs/photo-sources.md` records each source.
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
- [ ] Confirm the occasion label under each celebrations photo. They are the implementer's reading of the photo and caption; `gallery-14.jpg` ("Corporate event") is inferred.
- [ ] Approval of all English copy, including the new headline, statement, six service cards, signature line and celebrations labels.
- [ ] Approval of all Simplified Chinese copy, including the same new text.
- [ ] Approval of the hero poster stills (`src/assets/stage/hero-poster.webp` and `hero-poster-portrait.webp`). They are captures of the site's own 3D balloons, with no photo or text.
- [ ] Approval of the 26 photos added in the redesign (`gallery-13.jpg` to `gallery-38.jpg`, 26 files). Rows below need a decision because of a face or printed name; the rest show no face or name (see `docs/photo-sources.md`).
- [ ] Permission to show each photo with a recognisable customer face.
  - [ ] `service-weddings.jpg` (post DaDTmrpSMZP): small printed photo of a child on an easel at the left edge.
  - [ ] `gallery-03.jpg` (post Dcpi_vnS3oh): strip of small vintage family photos on an easel at the right edge.
  - [ ] `gallery-23.jpg` (reel DcSZojwy4lp): small easel of printed baby photos at the left edge.
  - [ ] `gallery-25.jpg` (post DaK-VbEEiSF): a performer far in the background, a few pixels tall and not recognisable.
  - Every other photo in `src/assets/work/` shows no face (see `docs/photo-sources.md`).
- [ ] Permission to show customer names printed on backdrops (or blur them). From `docs/photo-sources.md`:
  - [ ] `hero-arch.jpg`: customer first name and a date.
  - [ ] `service-weddings.jpg`: the couple's names and a date.
  - [ ] `gallery-01.jpg`: customer first name.
  - [ ] `gallery-03.jpg`: customer first name.
  - [ ] `gallery-05.jpg`: a child's name.
  - [ ] `gallery-10.jpg`: a child's first name.
  - [ ] `gallery-11.jpg`: customer first name and a date.
  - [ ] `gallery-12.jpg`: children's first names.
  - [ ] `closing.jpg`: customer first name, on the arch and on an easel sign.
  - [ ] `gallery-17.jpg`: child's first name.
  - [ ] `gallery-18.jpg`: customer first name.
  - [ ] `gallery-20.jpg`: customer name and age.
  - [ ] `gallery-23.jpg`: child's first name.
  - [ ] `gallery-24.jpg`: customer first name.
  - [ ] `gallery-27.jpg`: customer first name.
  - [ ] `gallery-28.jpg`: customer name.
  - [ ] `gallery-29.jpg`: child's Chinese name.
  - [ ] `gallery-30.jpg`: child's full name (flagged for sign-off in the photo ledger).
  - [ ] `gallery-31.jpg`: child's Chinese name.
  - [ ] `gallery-32.jpg`: customer name and a date.
  - [ ] `gallery-33.jpg`: customer first name.
  - [ ] `gallery-36.jpg`: child's name.
  - [ ] `gallery-37.jpg`: a name partly visible on the cake board at the right edge.
- [ ] Permission to show the registration number on the site.

## Tone and voice

Grand, refined, warm, confident, colourful (宏大、高级、不低俗、不幼稚). Speak like a styling studio, not a party shop. Avoid cartoon language, exclamation-mark stacks, emoji in UI copy, prices, brand names of past clients, and invented claims, reviews or statistics.

## Visual references (optional)

- The client's own work: organic balloon garlands wrapped around arched panels, chrome and pearl balloons, big satin bows, fabric drapes, twisted-balloon sculptures (lion dance, tiered cakes, rose and tulip bouquets).
- Their caption habit of naming the colour palette for every setup.
- Gallery-art balloon sculpture (mirror-chrome balloon dog) as a fashion and art cue, not a kids' cue.

## Must-haves and must-nots

Must:

- WhatsApp as the primary action, with a pre-filled message per service.
- English and Simplified Chinese.
- Motion-heavy, 3D balloon experience that still shows all content without JavaScript and respects reduced motion.
- Real photos of their work.

Must not:

- Show prices.
- Name or show logos of past clients and venues.
- Use cartoon mascots, faces on balloons, or lookalikes of licensed characters (Miffy, Sanrio, Kuromi).
- Publish testimonials, statistics or answers (such as a FAQ or booking steps) the client has not confirmed.

## Motion

Showcase. One 3D balloon stage that travels through the chapters, a headline that splits on scroll, a pinned stack of colour cards, a signature marquee, a celebrations wall that enters tilted on wide screens, and a pink flood closing. Smooth scrolling and pins only with a fine pointer on wide screens and motion allowed. See `design-direction.md`.

## Technical

- Astro static output on GitHub Pages at https://chowxingshao.github.io/one23balloon/ (no custom domain yet).
- Locales: `en` (default, unprefixed) and `zh` (Simplified Chinese, `/zh/`).
- Blog, projects and RSS off. No contact form; no analytics.
- Three.js for 3D, loaded lazily, with a decision record.
- Design spec: `docs/superpowers/specs/2026-10-30-one23balloon-redesign-design.md` (the 2026-10-29 landing spec is superseded).
- Fonts: Unbounded 900 (display), Source Sans 3 (English body), Noto Sans SC (Chinese display and body), all self-hosted.
