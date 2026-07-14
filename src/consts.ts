// Shared identity tokens. Change here, not in the pages.
//
// The mark takes the colour of the room it's in: blue on /tech, moss on the
// landing and /life. The two sides are meant to look nothing like each other.

export const BLUE = '#2563EB';
export const MOSS = '#4F6B3E';

// "The Rule" mark as an inline favicon. Same geometry as components/Mark.astro.
export function favicon(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text x='3.5' y='23' font-family='Georgia,serif' font-size='20' fill='${color}'>K</text><line x1='16' y1='6' x2='16' y2='26' stroke='${color}' stroke-width='1'/><text x='19' y='23' font-family='Georgia,serif' font-size='20' fill='${color}'>S</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const FAVICON_TECH = favicon(BLUE);
export const FAVICON_LIFE = favicon(MOSS);
