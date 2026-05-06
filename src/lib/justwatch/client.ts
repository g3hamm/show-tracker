const GRAPHQL_URL = "https://apis.justwatch.com/graphql";
const COUNTRY = (process.env.WATCH_REGION ?? "US") as string;

// Search by title, then confirm with TMDB ID match in the response.
// More reliable than the externalIds filter which causes 422 errors.
const QUERY = `
  query SearchTitles(
    $country: Country!
    $language: Language!
    $first: Int!
    $filter: TitleFilter!
  ) {
    popularTitles(country: $country, first: $first, filter: $filter) {
      edges {
        node {
          ... on Movie {
            content(country: $country, language: $language) {
              title
              fullPath
              externalIds { tmdbId }
            }
          }
          ... on Show {
            content(country: $country, language: $language) {
              title
              fullPath
              externalIds { tmdbId }
            }
          }
        }
      }
    }
  }
`;

export async function fetchJustWatchUrl(
  tmdbId: number,
  mediaType: "show" | "movie",
  title: string,
): Promise<string | null> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "App-Version": "3.7.7-web",
      },
      body: JSON.stringify({
        operationName: "SearchTitles",
        query: QUERY,
        variables: {
          country: COUNTRY,
          language: "en",
          first: 5,
          filter: {
            searchQuery: title,
            objectTypes: [mediaType === "movie" ? "MOVIE" : "SHOW"],
          },
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[JustWatch] HTTP ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    if (json.errors) {
      console.error("[JustWatch] GraphQL errors:", JSON.stringify(json.errors));
      return null;
    }

    const edges: { node: { content?: { fullPath?: string; externalIds?: { tmdbId?: number } } } }[] =
      json?.data?.popularTitles?.edges ?? [];

    if (edges.length === 0) {
      console.error(`[JustWatch] No results for "${title}" tmdbId=${tmdbId}`);
      return null;
    }

    // Prefer exact TMDB ID match; fall back to first result.
    const match =
      edges.find((e) => e.node?.content?.externalIds?.tmdbId === tmdbId) ??
      edges[0];

    const fullPath = match?.node?.content?.fullPath;
    if (!fullPath) {
      console.error(`[JustWatch] No fullPath for "${title}" tmdbId=${tmdbId}`);
      return null;
    }

    return `https://www.justwatch.com${fullPath}`;
  } catch (err) {
    console.error("[JustWatch] Fetch error:", err);
    return null;
  }
}
