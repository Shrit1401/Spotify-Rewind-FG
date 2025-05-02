import { cookies } from "next/headers";

const CLIENT_ID =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI =
  `${process.env.NEXT_PUBLIC_URL || process.env.NEXT_URL}/api/auth/callback` ||
  "http://localhost:3000/api/auth/callback";

export async function getSpotifyAuthURL() {
  const scope =
    "user-top-read user-read-email user-follow-read user-read-private user-read-recently-played";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken() {
  // Client-side token access
  if (typeof window !== "undefined") {
    // Running in browser
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("spotify_access_token=")
    );
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
    return null;
  } else {
    // Server-side token access
    const cookieStore = cookies();
    const token = (await cookieStore).get("spotify_access_token")?.value;
    return token || null;
  }
}
