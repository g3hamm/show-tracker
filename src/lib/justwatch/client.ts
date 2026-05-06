const GRAPHQL_URL = "https://apis.justwatch.com/graphql";
const COUNTRY = (process.env.WATCH_REGION ?? "US") as string;

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
          ... on Movie { fullPath }
          ... on Show  { fullPath }
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
      },
      body: JSON.stringify({
        operationName: "GetSuggestedTitles",
        query: QUERY,
        variables: {
          country: COUNTRY,
          language: "en",
          first: 1,
          filter: {
            externalIds: { tmdbId },
            objectTypes: [mediaType === "movie" ? "MOVIE" : "SHOW"],
          },
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const fullPath: string | undefined =
      json?.data?.popularTitles?.edges?.[0]?.node?.fullPath;

    return fullPath ? `https://www.justwatch.com${fullPath}` : null;
  } catch {
    return null;
  }
}
