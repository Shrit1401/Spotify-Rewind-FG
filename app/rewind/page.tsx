"use client";
import BuildWithForgeZone from "@/components/BuildWithForgeZone";
import React, { useState, useEffect } from "react";
import {
  getPopularGenres,
  getRecentlyPlayed,
  getNewDiscovery,
  getTopArtists,
  getTopTracks,
  getUserProfile,
} from "@/lib/actions";
import { generateVideoFacts } from "@/lib/gemini";
import { Player } from "@remotion/player";
import SpotifyRewindVideo from "@/components/SpotifyRewindVideo";

export default function RewindPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [topTracks, setTopTracks] = useState<TopTracksResponse | null>(null);
  const [topArtists, setTopArtists] = useState<TopArtistsResponse | null>(null);
  const [newDiscovery, setNewDiscovery] = useState<NewDiscover | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] =
    useState<RecentlyPlayedResponse | null>(null);
  const [genres, setGenres] = useState<[string, unknown][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [videoInsights, setVideoInsights] = useState<VideoInsights>();

  const randomSongIndex = Math.floor(Math.random() * 5) + 1;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const profile = await getUserProfile();
        const topTracks = await getTopTracks();
        const topArtists = await getTopArtists();
        const recentlyPlayed = await getRecentlyPlayed();
        const genres = await getPopularGenres();
        const topAlbums = await getNewDiscovery();

        setTopTracks(topTracks);
        setUserProfile(profile);
        setTopArtists(topArtists);
        setRecentlyPlayed(recentlyPlayed);
        setGenres(genres);
        setNewDiscovery(topAlbums);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClick = async () => {
    setBtnLoading(true);
    const videoInsights = await generateVideoFacts(
      userProfile!,
      topTracks!,
      topArtists!,
      genres!,
      recentlyPlayed!,
      newDiscovery!
    );

    if (!videoInsights) {
      console.error("Error generating video insights");
      setBtnLoading(false);
      return;
    }

    setVideoInsights(videoInsights);
    setBtnLoading(false);
  };

  useEffect(() => {
    if (videoInsights) {
      const videoElement = document.querySelector(".remotion-player");
      if (videoElement) {
        setTimeout(() => {
          videoElement.scrollIntoView({ behavior: "smooth" });
        }, 200); // small delay ensures element is rendered
      }
    }
  }, [videoInsights]);

  return (
    <>
      <div className="root">
        {loading ||
        !userProfile ||
        !topTracks ||
        !topArtists ||
        !newDiscovery ? (
          <div className="flex flex-col items-center justify-center min-h-screen py-12">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="container max-w-7xl mx-auto px-4">
            <div className="header">
              <div className="header-title mb-6">
                <h1 className="text-4xl font-bold">
                  Hello {userProfile?.display_name}
                </h1>
              </div>

              <div className="bg-gradient-to-r bg-[#111] border-white/50 border-2 border-dashed rounded-xl shadow-lg p-8 mb-10">
                <div className="flex items-center space-x-6">
                  <img
                    src={
                      userProfile.images &&
                      userProfile.images[0] &&
                      userProfile.images[0].url
                    }
                    alt="Profile picture"
                    className="rounded-full w-24 h-24 border-2"
                    width={96}
                    height={96}
                  />
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">
                      {userProfile.display_name}
                    </h2>
                    <p className="text-indigo-100">{userProfile.email}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-6">
                  <div className="p-3 bg-black/30 rounded-lg">
                    <p className="text-gray-400">Tracks</p>
                    <p className="text-2xl font-bold">{topTracks.limit}</p>
                  </div>
                  <div className="p-3 bg-black/30 rounded-lg">
                    <p className="text-gray-400">Artists</p>
                    <p className="text-2xl font-bold">{topArtists.limit}</p>
                  </div>
                  <div className="p-3 bg-black/30 rounded-lg">
                    <p className="text-gray-400">Genres</p>
                    <p className="text-2xl font-bold">
                      {genres ? Object.keys(genres).length : 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="button-container flex justify-center my-8">
                <button
                  onClick={handleClick}
                  disabled={btnLoading}
                  type="button"
                  className="button bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all"
                >
                  {btnLoading ? "Generating..." : "Generate My Rewind"}
                </button>
              </div>
            </div>
          </div>
        )}
        <BuildWithForgeZone />
      </div>
      <div className="remotion-player">
        {videoInsights &&
          userProfile &&
          topTracks &&
          topArtists &&
          newDiscovery &&
          recentlyPlayed &&
          genres && (
            <>
              <div className="mx-auto max-w-md overflow-hidden rounded-xl shadow-lg ">
                <Player
                  component={SpotifyRewindVideo}
                  durationInFrames={1800}
                  fps={30}
                  compositionWidth={1080}
                  compositionHeight={1920}
                  style={{ width: "100%", borderRadius: "0.75rem" }}
                  controls
                  inputProps={{
                    userProfile,
                    topTracks,
                    topArtists,
                    recentlyPlayed,
                    newDiscovery,
                    genres,
                    videoInsights,
                    randomSongIndex,
                  }}
                />
              </div>
              <p
                className="text-center  mt-4 pt-8 text-md px-4"
                style={{ maxWidth: "600px", margin: "0 auto" }}
              >
                I don't have any copyright over the music used in the video. I
                just took the audio from{" "}
                <a
                  href="https://www.youtube.com/watch?v=GedLli_YXEI"
                  target="_blank"
                  className="text-white/70 hover:underline"
                >
                  this video
                </a>
              </p>
            </>
          )}
      </div>
    </>
  );
}
