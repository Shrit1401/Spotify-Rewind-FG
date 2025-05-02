import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
const ai_model = "gemini-1.5-flash";
const ai = new GoogleGenAI({ apiKey });

export const geminiPrompt = async (prompt: string) => {
  if (!apiKey) {
    throw new Error("Google Gemini API key is not configured");
  }

  const response = await ai.models.generateContent({
    model: ai_model,
    contents: prompt,
  });
  return response.text;
};
export const generateVideoFacts = async (
  userProfile: UserProfile,
  topTracks: TopTracksResponse,
  topArtists: TopArtistsResponse,
  genres: [string, unknown][],
  recent: RecentlyPlayedResponse,
  newDiscovery: NewDiscover
) => {
  // Make sure all data structures are defined before accessing their properties
  const safeNewDiscovery = newDiscovery?.items ? newDiscovery : { items: [] };
  const safeTopTracks = topTracks?.items ? topTracks : { items: [], total: 0 };
  const safeTopArtists = topArtists?.items
    ? topArtists
    : { items: [], total: 0 };
  const safeRecent = recent?.items ? recent : { items: [] };
  const safeGenres = genres || [];

  const prompt = `
    As a brutally honest music critic with zero patience, create harshly accurate roasts for this Spotify user.
    Don't sugarcoat their questionable taste. Be sarcastic, witty, and slightly offensive - but keep it funny.
    Write short, punchy captions that will appear on a "Your Music Roast" style video.

    Don't use any year or date references, just focus on mocking their terrible music choices.
    No mentions of Spotify or platforms - focus on destroying their musical identity.
    Use their tracks, artists, genres, and plays to create a savage narrative.
    
    Each roast must:
    - Be between 3-5 words
    - No emojis, no markdown
    - Be humorously judgmental without crossing the line
    - Use their specific music choices to deliver stinging but funny observations
  
    Format strictly like:
    Basic taste detected
    Really? This garbage?
    Taylor? How original
  
    USER PROFILE:
    Name: ${userProfile?.display_name || "Music Fan"}
    New Discoveries: ${safeNewDiscovery.items
      .slice(0, 20)
      .map((item: any) => item?.name || "")
      .filter(Boolean)
      .join(", ")}
    Tracks played: ${safeTopTracks.total}
    Artists explored: ${safeTopArtists.total}
  
    TOP ARTISTS: ${safeTopArtists.items
      .slice(0, 20)
      .map((a: any) => a?.name || "")
      .filter(Boolean)
      .join(", ")}
  
    TOP TRACKS: ${safeTopTracks.items
      .slice(0, 20)
      .map((t: any) =>
        t?.name && t?.artists?.[0]?.name
          ? `${t.name} by ${t.artists[0].name}`
          : ""
      )
      .filter(Boolean)
      .join(", ")}
  
    FAVORITE GENRES: ${
      safeGenres.length > 0
        ? safeGenres
            .slice(0, 20)
            .map(([genre]: [string, unknown]) => genre || "")
            .filter(Boolean)
            .join(", ")
        : ""
    }
  
    RECENT DISCOVERIES: ${safeNewDiscovery.items
      .slice(0, 20)
      .map((t: any) =>
        t?.name && t?.artists?.[0]?.name
          ? `${t.name} by ${t.artists[0].name}`
          : ""
      )
      .filter(Boolean)
      .join(", ")}
  
    MOST RECENT PLAYS: ${safeRecent.items
      .slice(0, 20)
      .map((item: any) =>
        item?.track?.name && item?.track?.artists?.[0]?.name
          ? `${item.track.name} by ${item.track.artists[0].name}`
          : ""
      )
      .filter(Boolean)
      .join(", ")}
  
    Generate 6 short, roast captions:
    1. A sarcastic greeting
    2. Top tracks mockery
    3. Artist choice ridicule
    4. New discoveries critique
    5. Genre taste judgment
    6. Recent plays embarrassment
  `;

  try {
    const response = await geminiPrompt(prompt);
    if (!response) throw new Error("Failed to generate AI response");

    const extractInsight = (text: string): string => {
      // Remove leading emoji, dots or any punctuation at the start, then trim
      return text.replace(/^[^\w\s]*\s*/u, "").trim();
    };

    const sections = response
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.length <= 60);

    let videoInsights: VideoInsights = {
      hello: "[Analyzing your music identity...]",
      topTracks: "[Top tracks being processed...]",
      topArtists: "[Top artists insight pending...]",
      newdiscov: "[Discoveries are loading...]",
      genres: "[Genre reflection in progress...]",
      recentTracks: "[Your mood is processing...]",
    };

    if (sections.length >= 6) {
      videoInsights = {
        hello: extractInsight(sections[0]),
        topTracks: extractInsight(sections[1]),
        topArtists: extractInsight(sections[2]),
        newdiscov: extractInsight(sections[3]),
        genres: extractInsight(sections[4]),
        recentTracks: extractInsight(sections[5]),
      };
    }

    return videoInsights;
  } catch (error) {
    console.error("Error generating video insights:", error);
    return {
      hello: "[Analyzing your music identity...]",
      topTracks: "[Top tracks being processed...]",
      topArtists: "[Top artists insight pending...]",
      newdiscov: "[Discoveries are loading...]",
      genres: "[Genre reflection in progress...]",
      recentTracks: "[Your mood is processing...]",
    };
  }
};
