const GRAPHQL_URL = "https://apis.justwatch.com/graphql";
const COUNTRY = (process.env.WATCH_REGION ?? "US") as string;

// fullPath lives inside content(country, language), not directly on the node.
// Filter uses array-of-objects format: [{ externalId, provider }].
const QUERY = `
  query GetSuggestedTitles(
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
            }
          }
          ... on Show {
            content(country: $country, language: $language) {
              title
              fullPath
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
        operationName: "GetSuggestedTitles",
        query: QUERY,
        variables: {
          country: COUNTRY,
          language: "en",
          first: 1,
          filter: {
            externalIds: [{ externalId: String(tmdbId), provider: "TMDB" }],
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

    const node = json?.data?.popularTitles?.edges?.[0]?.node;
    const fullPath: string | undefined = node?.content?.fullPath;

    if (!fullPath) {
      console.error(`[JustWatch] No fullPath for tmdbId=${tmdbId} type=${mediaType}. Response:`, JSON.stringify(json?.data));
      return null;
    }

    return `https://www.justwatch.com${fullPath}`;
  } catch (err) {
    console.error("[JustWatch] Fetch error:", err);
    return null;
  }
}
