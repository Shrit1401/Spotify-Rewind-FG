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
    As a music psychologist and cultural analyst, create deeply personalized insights for a Spotify user.
    Connect dots in their listening patterns to reveal fascinating insights about who they are.
    Keep it casual, simple, and emotional — speak like you're narrating their story.
    Write insights in short, clean captions that will appear on a Spotify Rewind-style video.

    don't use any year or date references, just focus on the music and the user.
    also don't mention Spotify or any other platform.
    Use the user's top tracks, artists, genres, and recent plays to create a narrative.
    Use the user's recent plays and new discoveries to create a narrative.
    Use the user's top tracks and artists to create a narrative.
    Use the user's favorite genres to create a narrative.
    Use the user's recent plays to create a narrative.
    Use the user's new discoveries to create a narrative.
    
  
    Each insight must:
    - Be between 3 and 5 words
    - No emojis, no markdown
    - Feel nostalgic, comforting, and emotionally insightful
    - Use precise details from their year in music to reflect their personality and journey
  
    Format strictly like:
    Music was your safe place  
    Hip-hop lit your soul  
    Emotions flowed with Taylor
  
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
  
    Generate 6 short, insight captions:
    1. A warm welcome line
    2. Top tracks reflection
    3. Top artists connection
    4. Recent discoveries growth
    5. Genre personality insight
    6. Most recent mood snapshot
  `;

  try {
    const response = await geminiPrompt(prompt);
    if (!response) throw new Error("Failed to generate AI response");

    const extractInsight = (text: string): string => {
      // Remove leading emoji if any slipped in, trim, and return
      return text.replace(/^[\p{Emoji}\s]+/u, "").trim();
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
