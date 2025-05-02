"use server";
import { getAccessToken } from "@/lib/spotify";

export async function getUserProfile() {
  const token = await getAccessToken();

  if (!token) return null;

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function getTopTracks() {
  const token = await getAccessToken();

  if (!token) {
    console.error("getTopTracks: No access token available");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `getTopTracks: API error ${response.status} for time range long_term`
      );
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`Error in getTopTracks for time range long_term`, error);
    return null;
  }
}

export async function getTopArtists() {
  const token = await getAccessToken();

  if (!token) {
    console.error("getTopArtists: No access token available");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `getTopArtists: API error ${response.status} for time range long_term`
      );
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`Error in getTopArtists for time range long_term:`, error);
    return null;
  }
}

export async function getRecentlyPlayed() {
  const token = await getAccessToken();

  if (!token) return null;

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/recently-played?limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) return null;

  return response.json();
}

export const getPopularGenres = async () => {
  const token = await getAccessToken();

  if (!token) return null;

  const response = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();

  const genres = data.items.flatMap((artist: any) => artist.genres);
  const genreCount = genres.reduce((acc: any, genre: string) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(genreCount)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);
};

export async function getNewDiscovery() {
  const token = await getAccessToken();

  if (!token) {
    console.error("getNewDiscovery: No access token available");
    return [];
  }

  try {
    // Fetch short-term and long-term top artists
    const [shortTermResponse, longTermResponse] = await Promise.all([
      fetch(
        "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
      fetch(
        "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
    ]);

    if (!shortTermResponse.ok || !longTermResponse.ok) {
      console.error(
        `getNewDiscovery: API error - Short term: ${shortTermResponse.status}, Long term: ${longTermResponse.status}`
      );
      return [];
    }

    const shortTermArtists = await shortTermResponse.json();
    const longTermArtists = await longTermResponse.json();

    if (!shortTermArtists.items || !longTermArtists.items) {
      console.error("getNewDiscovery: Invalid data structure for artists");
      return [];
    }

    // Find artists in short term but not in long term (new discoveries)
    const longTermIds = new Set(
      longTermArtists.items.map((artist: any) => artist.id)
    );

    // Filter short term artists that don't appear in long term
    const newDiscoveries = shortTermArtists.items.filter(
      (artist: any) => !longTermIds.has(artist.id)
    );

    return newDiscoveries;
  } catch (error) {
    console.error("Error in getNewDiscovery:", error);
    return [];
  }
}
