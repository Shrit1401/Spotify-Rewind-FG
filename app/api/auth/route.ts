import { redirect } from "next/navigation";
import { getSpotifyAuthURL } from "@/lib/spotify";

export async function GET() {
  const authUrl = await getSpotifyAuthURL();
  redirect(authUrl);
}
