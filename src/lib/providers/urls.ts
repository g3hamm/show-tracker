type UrlFn = (title: string) => string;

const SEARCH_URLS: Record<number, UrlFn> = {
  8:    (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}`,
  9:    (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video`,
  10:   (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video`,
  119:  (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video`,
  15:   (t) => `https://www.hulu.com/search?q=${encodeURIComponent(t)}`,
  337:  (t) => `https://www.disneyplus.com/search/${encodeURIComponent(t)}`,
  350:  (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
  // Max (and legacy HBO Max / HBO Go IDs)
  1899: (t) => `https://www.max.com/search?q=${encodeURIComponent(t)}`,
  29:   (t) => `https://www.max.com/search?q=${encodeURIComponent(t)}`,
  384:  (t) => `https://www.max.com/search?q=${encodeURIComponent(t)}`,
  386:  (t) => `https://www.peacocktv.com/search?q=${encodeURIComponent(t)}`,
  531:  (t) => `https://www.paramountplus.com/search/${encodeURIComponent(t)}/`,
  37:   (t) => `https://www.sho.com/search#q=${encodeURIComponent(t)}`,
  43:   (t) => `https://www.starz.com/us/en/search?q=${encodeURIComponent(t)}`,
  99:   (t) => `https://www.shudder.com/search?q=${encodeURIComponent(t)}`,
  510:  (t) => `https://www.discoveryplus.com/search?query=${encodeURIComponent(t)}`,
  526:  (t) => `https://www.amcplus.com/search?query=${encodeURIComponent(t)}`,
  151:  (t) => `https://www.britbox.com/us/search?q=${encodeURIComponent(t)}`,
  149:  (t) => `https://www.espnplus.com/search?q=${encodeURIComponent(t)}`,
  283:  (t) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}`,
  634:  (t) => `https://www.mgmplus.com/search?q=${encodeURIComponent(t)}`,
};

export function getProviderSearchUrl(providerId: number, title: string): string | null {
  const fn = SEARCH_URLS[providerId];
  return fn ? fn(title) : null;
}
