// Shared identity tokens. Change here, not in the pages.

export const MOSS = '#4F6B3E';

// "The Rule" mark as an inline favicon. Same geometry as components/Mark.astro.
const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text x='3.5' y='23' font-family='Georgia,serif' font-size='20' fill='${MOSS}'>K</text><line x1='16' y1='6' x2='16' y2='26' stroke='${MOSS}' stroke-width='1'/><text x='19' y='23' font-family='Georgia,serif' font-size='20' fill='${MOSS}'>S</text></svg>`;

export const FAVICON = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;
