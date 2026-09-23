/** The "Steel of Oman" campaign carousel, taken from
 *  jindalsteel.om/steel-of-oman.
 *
 *  Titles are the alt text the live site ships. Every image is square (the
 *  originals are 2000x2000, resampled to 1200px for the web), so the carousel
 *  is locked to 1:1 rather than guessing a crop. */

export const STEEL_OF_OMAN = [
  { file: '01-traditions.jpg', title: 'Traditions' },
  { file: '02-the-culture.jpg', title: 'The Culture' },
  { file: '03-loyalty.jpg', title: 'Loyalty' },
  { file: '04-resilience.jpg', title: 'The Resilience' },
  { file: '05-adnan-al-raisi.jpg', title: 'Adnan Al Raisi' },
  { file: '06-al-saff.jpg', title: 'Al-Saff' },
  { file: '07-ali-al-habsi.jpg', title: 'Ali Al Habsi' },
  { file: '08-anas.jpg', title: 'Anas' },
  { file: '09-mohammed.jpg', title: 'Mohammed' },
  { file: '10-spirit-of-oman.jpg', title: 'The Spirit of Oman' },
  { file: '11-stimulation.jpg', title: 'Stimulation' },
  { file: '12-blessings.jpg', title: 'Blessings' },
];

export const SLIDE_DIR = 'brand/steel-of-oman/';

/** Fisher-Yates. The brief asks for the deck to be shuffled, so no visitor sees
 *  the same running order twice — and no slide is privileged by being first. */
export function shuffled(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
