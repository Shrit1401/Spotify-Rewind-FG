import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    redirect("/");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.NEXT_URL
        ? `${process.env.NEXT_URL}/api/auth/callback`
        : "http://localhost:3000/api/auth/callback",
    }),
  });

  const data = await response.json();

  if (data.error) {
    redirect("/");
  }

  const cookieStore = await cookies();
  cookieStore.set("spotify_access_token", data.access_token, {
    maxAge: 3600,
    path: "/",
  });
  cookieStore.set("spotify_refresh_token", data.refresh_token, {
    maxAge: 3600 * 24 * 30,
    path: "/",
  });

  redirect("/rewind");
}
