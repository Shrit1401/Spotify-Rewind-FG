"use client";

import { interpolate, Easing, Audio, staticFile } from "remotion";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  spring,
} from "remotion";
import styled from "@emotion/styled";
import { AuroraBackground } from "./AuroraBackground";

// Advanced animation utilities
const smoothEasing = (progress: number): number => {
  return Easing.bezier(0.25, 0.1, 0.25, 1)(progress);
};

const smoothBounce = (progress: number): number => {
  return Easing.bezier(0.34, 1.56, 0.64, 1)(progress);
};

const elasticOut = (progress: number): number => {
  return Easing.bezier(0.16, 1.32, 0.68, 1.12)(progress);
};

const easeOutBack = (progress: number): number => {
  return Easing.bezier(0.175, 0.885, 0.32, 1.275)(progress);
};

// Helper function to create slower spring configurations
const createSlowSpringConfig = (damping = 12, stiffness = 80, mass = 1.5) => {
  return {
    damping,
    stiffness,
    mass,
  };
};

// Animation composition helper with slower timing
const useAnimatedValue = (
  frame: number,
  keyframes: [number, number][],
  options: {
    easing?: (t: number) => number;
    extrapolateRight?: "clamp" | "extend" | "identity";
    extrapolateLeft?: "clamp" | "extend" | "identity";
  } = {}
) => {
  // Slow down animations by expanding the keyframe durations by 1.5x
  const slowedKeyframes = keyframes.map(([time, value]): [number, number] => [
    time * 1.5,
    value,
  ]);

  const {
    easing = smoothEasing,
    extrapolateLeft = "clamp",
    extrapolateRight = "clamp",
  } = options;

  return interpolate(
    frame,
    slowedKeyframes.map((k) => k[0]),
    slowedKeyframes.map((k) => k[1]),
    {
      easing,
      extrapolateLeft,
      extrapolateRight,
    }
  );
};

// Helper for string interpolation with slower timing
const useAnimatedColor = (
  frame: number,
  keyframes: [number, string][],
  options: {
    easing?: (t: number) => number;
    extrapolateRight?: "clamp" | "extend" | "identity";
    extrapolateLeft?: "clamp" | "extend" | "identity";
  } = {}
) => {
  // Slow down animations by expanding the keyframe durations by 1.5x
  const slowedKeyframes = keyframes.map(([time, value]): [number, string] => [
    time * 1.5,
    value,
  ]);

  const {
    easing = smoothEasing,
    extrapolateLeft = "clamp",
    extrapolateRight = "clamp",
  } = options;

  // Find the current segment
  const frameValue = frame;
  const lastIndex = slowedKeyframes.length - 1;

  // If before first keyframe or after last, clamp to the appropriate value
  if (frameValue <= slowedKeyframes[0][0]) return slowedKeyframes[0][1];
  if (frameValue >= slowedKeyframes[lastIndex][0])
    return slowedKeyframes[lastIndex][1];

  // Find the segment that contains the current frame
  for (let i = 0; i < lastIndex; i++) {
    const currentKey = slowedKeyframes[i];
    const nextKey = slowedKeyframes[i + 1];

    if (frameValue >= currentKey[0] && frameValue < nextKey[0]) {
      // Calculate progress within this segment
      const segmentProgress =
        (frameValue - currentKey[0]) / (nextKey[0] - currentKey[0]);
      const easedProgress = easing ? easing(segmentProgress) : segmentProgress;

      // For colors, just return the color at the appropriate keyframe
      // This is a simplified approach - for proper color interpolation
      // you'd need to parse the colors and interpolate RGB values
      return easedProgress < 0.5 ? currentKey[1] : nextKey[1];
    }
  }

  // Fallback
  return slowedKeyframes[lastIndex][1];
};

// Advanced shadow effect generator
const generateShadow = (
  blur: number,
  opacity: number,
  color: string = "29, 185, 84",
  x: number = 0,
  y: number = 0
) => {
  return `${x}px ${y}px ${blur}px rgba(${color}, ${opacity})`;
};

interface SpotifyRewindVideoProps {
  userProfile: UserProfile;
  topTracks: TopTracksResponse;
  topArtists: TopArtistsResponse;
  recentlyPlayed: RecentlyPlayedResponse;
  newDiscovery: any;
  genres: [string, unknown][];
  videoInsights: VideoInsights;
  randomSongIndex: number;
}

const Section = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  text-align: center;
  padding: 2rem;
  position: relative;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0;
  list-style: none;
  align-items: center;
`;

const SectionTitle = styled.h1`
  font-size: 6rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
`;

const Image = styled.img`
  max-width: 400px;
  max-height: 400px;
  width: auto;
  height: auto;
  border-radius: 50%;
`;

const ListItemImage = styled.img`
  max-width: 400px;
  max-height: 400px;
  width: auto;
  height: auto;
  border-radius: 10px;
  border: 4px solid rgba(255, 255, 255, 0.3);

  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ArtistImage = styled.img`
  max-width: 400px;
  max-height: 400px;
  width: 400px;
  height: auto;
  border-radius: 50%;
  border: 4px solid #d3d3d3;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
`;

const UserName = styled.p`
  font-size: 5rem;
  font-weight: 800;
  margin-top: 5rem;
`;

const TrackName = styled.p`
  font-size: 2rem;
  font-weight: 800;
`;

const TrackArtist = styled.p`
  font-size: 1.5rem;
  font-weight: 800;
  opacity: 0.5;
`;

const GenreName = styled.p`
  font-size: 3.5rem;
  font-weight: 800;
  margin-right: 1rem;
`;

const GenreCount = styled.p`
  font-size: 3.5rem;
  font-weight: 800;
  opacity: 0.5;
`;

// Forge Zone branding components
const BrandingSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  text-align: center;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(29, 185, 84, 0.2) 100%
  );
`;

const BrandingText = styled.h1`
  font-size: 7rem;
  font-weight: 800;
  color: #ffff;
`;

const Logo = styled.img`
  position: absolute;
  bottom: 40px;
  left: 40px;
  width: 180px;
  height: auto;
  opacity: 0.9;
  z-index: 10;
`;

export default function SpotifyRewindVideo({
  userProfile,
  topTracks,
  topArtists,
  recentlyPlayed,
  newDiscovery,
  genres,
  videoInsights,
  randomSongIndex,
}: SpotifyRewindVideoProps) {
  const frame: any = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const totalSections = 13;
  const sectionDuration = Math.floor(durationInFrames / totalSections);

  const songUrl = staticFile(`songs/song_${randomSongIndex}.mp3`);
  return (
    <AbsoluteFill style={{ background: "#1DB954" }}>
      <Audio src={staticFile(songUrl)} />
      <AuroraBackground
        style={{ position: "absolute", width: "100%", height: "100%" }}
      >
        <div style={{ width: "100%", height: "100%" }}></div>
      </AuroraBackground>
      <Sequence from={0} durationInFrames={sectionDuration}>
        <Section>
          {(() => {
            const titleOpacity = useAnimatedValue(frame, [
              [0, 0],
              [20, 0.7],
              [30, 1],
            ]);
            const titleY = useAnimatedValue(frame, [
              [0, 50],
              [30, 0],
            ]);
            const titleScale = useAnimatedValue(frame, [
              [30, 1],
              [45, 1.05],
              [60, 1],
            ]);

            const imageOpacity = useAnimatedValue(frame, [
              [20, 0],
              [45, 1],
            ]);
            const imageScale = useAnimatedValue(frame, [
              [20, 0.8],
              [45, 1.1],
              [55, 0.95],
              [65, 1],
            ]);
            const imageRotate = useAnimatedValue(frame, [
              [45, 0],
              [65, 5],
              [85, -5],
              [105, 0],
            ]);

            const usernameOpacity = useAnimatedValue(frame, [
              [40, 0],
              [60, 0.7],
              [70, 0.9],
              [80, 1],
            ]);
            const usernameX = useAnimatedValue(frame, [
              [40, -300],
              [70, 0],
            ]);

            const logoOpacity = useAnimatedValue(frame, [
              [60, 0],
              [80, 1],
            ]);
            const logoY = useAnimatedValue(frame, [
              [60, 50],
              [80, 0],
            ]);

            return (
              <>
                <div
                  style={{
                    opacity: titleOpacity,
                    transform: `translateY(${titleY}px) scale(${titleScale})`,
                  }}
                >
                  <SectionTitle style={{ color: "#191414" }}>
                    Welcome to Your Spotify Rewind
                  </SectionTitle>
                </div>

                <div
                  style={{
                    opacity: imageOpacity,
                    transform: `scale(${imageScale}) rotate(${imageRotate}deg)`,
                    borderRadius: "50%",
                    overflow: "hidden",
                    boxShadow: generateShadow(
                      useAnimatedValue(frame, [
                        [45, 0],
                        [75, 20],
                        [105, 10],
                      ]),
                      useAnimatedValue(frame, [
                        [45, 0],
                        [75, 0.5],
                        [105, 0.3],
                      ])
                    ),
                  }}
                >
                  <Image
                    src={userProfile?.images?.[0]?.url}
                    alt={userProfile?.display_name}
                  />
                </div>

                <div
                  style={{
                    opacity: usernameOpacity,
                    transform: `translateX(${usernameX}px)`,
                  }}
                >
                  <UserName style={{ color: "#191414" }}>
                    {userProfile?.display_name}
                  </UserName>
                </div>

                <div
                  style={{
                    opacity: logoOpacity,
                    transform: `translateY(${logoY}px)`,
                    position: "absolute",
                    bottom: "40px",
                    left: "40px",
                  }}
                >
                  <Logo
                    src="https://i.imgur.com/65lwHJi.png"
                    alt="Forge Zone Logo"
                  />
                </div>
              </>
            );
          })()}
          <Logo src="https://i.imgur.com/65lwHJi.png" alt="Forge Zone Logo" />
        </Section>
      </Sequence>

      <Sequence from={sectionDuration} durationInFrames={sectionDuration}>
        <Section>
          {(() => {
            const frameOffset = frame - sectionDuration;

            const titleOpacity = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [20, 1],
              ],
              { easing: elasticOut }
            );

            const titleScale = useAnimatedValue(
              frameOffset,
              [
                [0, 0.8],
                [20, 1.2],
                [40, 0.9],
                [60, 1],
              ],
              { easing: smoothBounce }
            );

            const titleY = useAnimatedValue(frameOffset, [
              [0, 50],
              [30, 0],
            ]);

            // Add subtle floating animation
            const floatY = Math.sin(frameOffset * 0.03) * 5;

            return (
              <>
                <div
                  style={{
                    opacity: titleOpacity,
                    transform: `translateY(${
                      titleY + floatY
                    }px) scale(${titleScale})`,
                    filter: `drop-shadow(0 ${Math.abs(
                      Math.sin(frameOffset * 0.02) * 8
                    )}px 15px rgba(25, 20, 20, 0.3))`,
                  }}
                >
                  <SectionTitle style={{ color: "#191414" }}>
                    {videoInsights.hello
                      ? videoInsights.hello
                      : "Hello, Spotify User!"}
                  </SectionTitle>
                </div>
                <Logo
                  src="https://i.imgur.com/65lwHJi.png"
                  alt="Forge Zone Logo"
                  style={{
                    filter: `drop-shadow(0 2px 8px rgba(0, 0, 0, ${useAnimatedValue(
                      frameOffset,
                      [
                        [40, 0],
                        [60, 0.3],
                      ]
                    )}))`,
                    transform: `translateY(${
                      Math.sin(frameOffset * 0.03) * 3
                    }px) scale(${useAnimatedValue(frameOffset, [
                      [40, 0.9],
                      [50, 1.05],
                      [60, 1],
                    ])})`,
                  }}
                />
              </>
            );
          })()}
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 2} durationInFrames={sectionDuration}>
        <Section>
          {(() => {
            const frameOffset = frame - sectionDuration * 2;

            // Professional reveal animation with text glow effect
            const titleOpacity = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [25, 1],
              ],
              { easing: smoothEasing }
            );

            const titleRotation = useAnimatedValue(
              frameOffset,
              [
                [0, 5],
                [15, -3],
                [30, 0],
              ],
              { easing: elasticOut }
            );

            const titleX = useAnimatedValue(
              frameOffset,
              [
                [0, -300],
                [30, 0],
              ],
              { easing: smoothEasing }
            );

            // Dynamic text shadow for depth
            const shadowOpacity = useAnimatedValue(frameOffset, [
              [20, 0],
              [40, 0.4],
              [60, 0.25],
            ]);

            const shadowBlur = useAnimatedValue(frameOffset, [
              [20, 0],
              [40, 15],
              [60, 8],
            ]);

            return (
              <>
                <div
                  style={{
                    opacity: titleOpacity,
                    transform: `translateX(${titleX}px) rotate(${titleRotation}deg)`,
                    transition: "all 0.5s ease",
                    textShadow: generateShadow(
                      shadowBlur,
                      shadowOpacity,
                      "25, 25, 25",
                      0,
                      4
                    ),
                  }}
                >
                  <SectionTitle style={{ color: "#191414" }}>
                    {videoInsights.topTracks
                      ? videoInsights.topTracks
                      : "Your Top Tracks"}
                  </SectionTitle>
                </div>

                {/* Subtle floating logo with shadow effect */}
                <Logo
                  src="https://i.imgur.com/65lwHJi.png"
                  alt="Forge Zone Logo"
                  style={{
                    transform: `translateY(${
                      Math.sin(frameOffset * 0.03) * 4
                    }px) scale(${useAnimatedValue(frameOffset, [
                      [35, 0.9],
                      [45, 1.1],
                      [55, 1],
                    ])})`,
                    filter: `drop-shadow(0 4px 6px rgba(0, 0, 0, ${useAnimatedValue(
                      frameOffset,
                      [
                        [35, 0],
                        [55, 0.25],
                      ]
                    )}))`,
                  }}
                />
              </>
            );
          })()}
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 3} durationInFrames={sectionDuration}>
        <Section>
          <SectionTitle
            style={{
              color: "#191414",
              opacity: useAnimatedValue(frame - sectionDuration * 3, [
                [0, 0],
                [15, 1],
              ]),
              transform: `translateY(${useAnimatedValue(
                frame - sectionDuration * 3,
                [
                  [0, -20],
                  [15, 0],
                ],
                { easing: elasticOut }
              )}px)`,
              filter: `drop-shadow(0 4px 8px rgba(0, 0, 0, ${useAnimatedValue(
                frame - sectionDuration * 3,
                [
                  [0, 0],
                  [15, 0.2],
                ]
              )}))`,
            }}
          >
            Top Tracks
          </SectionTitle>

          <List>
            {topTracks?.items?.slice(0, 3).map((track: any, index: number) => {
              const frameOffset = frame - sectionDuration * 3;
              // Calculate staggered animations for each track with delay
              const startFrame = 15 + index * 20; // Stagger each track's animation

              // Create a spring animation for a more professional bounce effect
              const springValue = spring({
                frame: frameOffset - startFrame,
                fps: 30,
                config: createSlowSpringConfig(12, 80, 1.5),
              });

              const itemOpacity = useAnimatedValue(frameOffset, [
                [startFrame, 0],
                [startFrame + 15, 1],
              ]);

              // Use the springValue for more natural animation
              const itemScale = springValue < 0 ? 0 : 0.8 + springValue * 0.2;

              // Create a slight delay for horizontal movement
              const itemX = useAnimatedValue(
                frameOffset,
                [
                  [startFrame, 100],
                  [startFrame + 25, 0],
                ],
                { easing: elasticOut }
              );

              // Add a subtle float animation that's slightly different for each item
              const floatY = Math.sin((frameOffset + index * 8) * 0.03) * 3;

              return (
                <li
                  key={track.id}
                  className="flex flex-col items-center gap-2 space-x-6"
                  style={{
                    opacity: itemOpacity,
                    transform: `translateX(${itemX}px) translateY(${floatY}px) scale(${itemScale})`,
                  }}
                >
                  <ListItemImage
                    src={track?.album?.images?.[0]?.url}
                    alt={track?.name}
                    style={{
                      boxShadow: `0 ${
                        4 + Math.abs(Math.sin(frameOffset * 0.04) * 4)
                      }px ${
                        8 + Math.abs(Math.sin(frameOffset * 0.04) * 4)
                      }px rgba(0, 0, 0, ${
                        0.2 + Math.abs(Math.sin(frameOffset * 0.04) * 0.1)
                      })`,
                      transform: `scale(${useAnimatedValue(frameOffset, [
                        [startFrame + 10, 0.95],
                        [startFrame + 20, 1.05],
                        [startFrame + 30, 1],
                      ])})`,
                    }}
                  />
                  <div
                    style={{
                      opacity: useAnimatedValue(frameOffset, [
                        [startFrame + 10, 0],
                        [startFrame + 25, 1],
                      ]),
                      transform: `translateY(${useAnimatedValue(
                        frameOffset,
                        [
                          [startFrame + 10, 10],
                          [startFrame + 25, 0],
                        ],
                        { easing: elasticOut }
                      )}px)`,
                    }}
                  >
                    <TrackName style={{ color: "#191414" }}>
                      {track?.name}
                    </TrackName>
                    <TrackArtist
                      style={{
                        color: "#191414",
                        opacity: useAnimatedValue(frameOffset, [
                          [startFrame + 15, 0],
                          [startFrame + 30, 0.7],
                        ]),
                      }}
                    >
                      {track?.artists?.[0]?.name}
                    </TrackArtist>
                  </div>
                </li>
              );
            })}
          </List>

          <Logo
            src="https://i.imgur.com/65lwHJi.png"
            alt="Forge Zone Logo"
            style={{
              transform: `translateY(${
                Math.sin((frame - sectionDuration * 3) * 0.04) * 4
              }px)`,
              filter: `drop-shadow(0 4px 8px rgba(0, 0, 0, ${
                0.2 +
                Math.abs(Math.sin((frame - sectionDuration * 3) * 0.04) * 0.1)
              }))`,
            }}
          />
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 4} durationInFrames={sectionDuration}>
        <Section>
          {(() => {
            const frameOffset = frame - sectionDuration * 4;

            // Create unique swirling entrance animation for top artists section
            const titleOpacity = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [20, 1],
              ],
              { easing: elasticOut }
            );

            // Add a rotating/swirling entrance effect
            const titleRotation = useAnimatedValue(
              frameOffset,
              [
                [0, -20],
                [15, 10],
                [30, 0],
              ],
              { easing: elasticOut }
            );

            // Add a unique bounce effect
            const titleScale = useAnimatedValue(
              frameOffset,
              [
                [0, 0.5],
                [15, 1.3],
                [25, 0.9],
                [35, 1.1],
                [45, 1],
              ],
              { easing: smoothBounce }
            );

            // Add some horizontal movement with elastic feel
            const titleX = useAnimatedValue(
              frameOffset,
              [
                [0, -200],
                [20, 0],
              ],
              { easing: elasticOut }
            );

            // Create a spotlight effect by animating shadow properties
            const shadowBlur = useAnimatedValue(frameOffset, [
              [20, 0],
              [40, 15],
              [60, 10],
              [80, 5],
            ]);

            const shadowOpacity = useAnimatedValue(frameOffset, [
              [20, 0],
              [40, 0.7],
            ]);

            // Add a subtle perpetual floating movement
            const floatY = Math.sin(frameOffset * 0.03) * 5;
            const floatRotation = Math.sin(frameOffset * 0.02) * 0.5;

            return (
              <>
                <div
                  style={{
                    opacity: titleOpacity,
                    transform: `translateX(${titleX}px) translateY(${floatY}px) rotate(${
                      titleRotation + floatRotation
                    }deg) scale(${titleScale})`,
                    textShadow: generateShadow(
                      shadowBlur,
                      shadowOpacity,
                      "29, 185, 84",
                      0,
                      3
                    ),
                  }}
                >
                  <SectionTitle style={{ color: "#191414" }}>
                    {videoInsights.topArtists
                      ? videoInsights.topArtists
                      : "Your Top Artists"}
                  </SectionTitle>
                </div>

                {/* Animated logo with subtle orbital motion */}
                <Logo
                  src="https://i.imgur.com/65lwHJi.png"
                  alt="Forge Zone Logo"
                  style={{
                    transform: `translate(
                      ${Math.sin(frameOffset * 0.02) * 5}px, 
                      ${Math.cos(frameOffset * 0.03) * 3}px
                    ) scale(${useAnimatedValue(frameOffset, [
                      [40, 0.9],
                      [60, 1.05],
                      [80, 1],
                    ])})`,
                    filter: `drop-shadow(0 3px 6px rgba(0, 0, 0, ${useAnimatedValue(
                      frameOffset,
                      [
                        [40, 0],
                        [60, 0.3],
                      ]
                    )}))`,
                  }}
                />
              </>
            );
          })()}
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 5} durationInFrames={sectionDuration}>
        <Section>
          <SectionTitle
            style={{
              color: "#191414",
              transform: `translateY(${useAnimatedValue(
                frame - sectionDuration * 5,
                [
                  [0, -30],
                  [20, 0],
                ],
                { easing: elasticOut }
              )}px)`,
              opacity: useAnimatedValue(frame - sectionDuration * 5, [
                [0, 0],
                [20, 1],
              ]),
              textShadow: generateShadow(
                useAnimatedValue(frame - sectionDuration * 5, [
                  [0, 0],
                  [20, 10],
                  [40, 5],
                ]),
                useAnimatedValue(frame - sectionDuration * 5, [
                  [0, 0],
                  [20, 0.4],
                  [40, 0.2],
                ]),
                "29, 185, 84"
              ),
            }}
          >
            Top Artists
          </SectionTitle>

          <List>
            {topArtists?.items
              ?.slice(0, 3)
              .map((artist: any, index: number) => {
                const frameOffset = frame - sectionDuration * 5;
                // Calculate staggered animations for each artist with delay
                const startFrame = 15 + index * 20; // Stagger each artist's animation

                // Create a spring animation for a natural bounce effect
                const springValue = spring({
                  frame: frameOffset - startFrame,
                  fps: 30,
                  config: createSlowSpringConfig(12, 80, 1.5),
                });

                // Base opacity on the spring animation for smoother fades
                const itemOpacity = Math.min(1, Math.max(0, springValue * 1.2));

                // Dynamic shadow with subtle pulsating effect
                const shadowIntensity =
                  0.2 + Math.abs(Math.sin(frameOffset * 0.03) * 0.15);
                const shadowBlur =
                  6 + Math.abs(Math.sin(frameOffset * 0.03) * 4);

                // Subtle rotation for each artist that differs slightly
                const itemRotate =
                  Math.sin((frameOffset + index * 12) * 0.02) * 1;

                // Staggered floating effect
                const floatY = Math.sin((frameOffset + index * 20) * 0.02) * 4;

                return (
                  <li
                    key={artist.id}
                    className="flex flex-col items-center gap-2 space-x-6"
                    style={{
                      opacity: itemOpacity,
                      transform: `translateY(${floatY}px) rotate(${itemRotate}deg) scale(${Math.min(
                        1,
                        springValue * 1.1
                      )})`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <ArtistImage
                      src={artist?.images?.[0]?.url}
                      alt={artist?.name}
                      style={{
                        boxShadow: `0 ${shadowBlur}px ${
                          shadowBlur * 1.5
                        }px rgba(0, 0, 0, ${shadowIntensity})`,
                        transform: `scale(${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame, 0.9],
                            [startFrame + 15, 1.05],
                            [startFrame + 30, 1],
                          ],
                          { easing: smoothBounce }
                        )})`,
                        border: `4px solid rgba(211, 211, 211, ${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame, 0],
                            [startFrame + 20, 1],
                          ]
                        )})`,
                      }}
                    />
                    <div
                      style={{
                        opacity: useAnimatedValue(frameOffset, [
                          [startFrame + 10, 0],
                          [startFrame + 25, 1],
                        ]),
                        transform: `translateY(${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame + 10, 15],
                            [startFrame + 25, 0],
                          ],
                          { easing: elasticOut }
                        )}px)`,
                      }}
                    >
                      <TrackName
                        style={{
                          color: "#191414",
                          filter: `drop-shadow(0 2px 3px rgba(0, 0, 0, ${useAnimatedValue(
                            frameOffset,
                            [
                              [startFrame + 15, 0],
                              [startFrame + 30, 0.2],
                            ]
                          )}))`,
                        }}
                      >
                        {artist?.name}
                      </TrackName>
                    </div>
                  </li>
                );
              })}
          </List>
          <Logo
            src="https://i.imgur.com/65lwHJi.png"
            alt="Forge Zone Logo"
            style={{
              transform: `translate(
                ${Math.sin((frame - sectionDuration * 5) * 0.02) * 5}px,
                ${Math.cos((frame - sectionDuration * 5) * 0.03) * 3}px
              ) scale(${useAnimatedValue(frame - sectionDuration * 5, [
                [60, 0.9],
                [80, 1.05],
                [100, 1],
              ])})`,
              filter: `drop-shadow(0 3px 6px rgba(0, 0, 0, ${useAnimatedValue(
                frame - sectionDuration * 5,
                [
                  [60, 0],
                  [80, 0.3],
                ]
              )}))`,
            }}
          />
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 6} durationInFrames={sectionDuration}>
        <Section>
          {(() => {
            const frameOffset = frame - sectionDuration * 6;

            // Create animated gradient text effect
            const gradientPosition = useAnimatedValue(frameOffset, [
              [0, 0],
              [60, 100],
            ]);

            // Enhanced dynamic shadow effect
            const shadowBlur = useAnimatedValue(frameOffset, [
              [0, 0],
              [30, 15],
              [60, 8],
            ]);

            const shadowOpacity = useAnimatedValue(frameOffset, [
              [0, 0],
              [30, 0.6],
              [60, 0.3],
            ]);

            // Add subtle perpetual motion
            const floatY = Math.sin(frameOffset * 0.03) * 5;
            const floatRotation = Math.sin(frameOffset * 0.02) * 0.7;

            // Dynamic scale animation with bouncy effect
            const titleScale = spring({
              frame: frameOffset,
              fps: 30,
              config: createSlowSpringConfig(12, 80, 1.5),
            });

            // Calculate actual scale with limits
            const actualScale = Math.min(1.1, Math.max(0.5, titleScale));

            return (
              <>
                <div
                  style={{
                    opacity: useAnimatedValue(frameOffset, [
                      [0, 0],
                      [30, 1],
                    ]),
                    transform: `translateY(${floatY}px) rotate(${floatRotation}deg) scale(${actualScale})`,
                    textShadow: generateShadow(
                      shadowBlur,
                      shadowOpacity,
                      "29, 185, 84",
                      0,
                      2
                    ),
                    color: "#191414",
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <SectionTitle>
                    {videoInsights.recentTracks
                      ? videoInsights.recentTracks
                      : "Your Recently Played"}
                  </SectionTitle>
                </div>
                <Logo
                  src="https://i.imgur.com/65lwHJi.png"
                  alt="Forge Zone Logo"
                  style={{
                    opacity: useAnimatedValue(frameOffset, [
                      [40, 0],
                      [60, 1],
                    ]),
                    transform: `translate(
                      ${Math.sin(frameOffset * 0.04) * 4}px,
                      ${Math.cos(frameOffset * 0.03) * 3}px
                    ) scale(${useAnimatedValue(frameOffset, [
                      [40, 0.9],
                      [55, 1.1],
                      [70, 1],
                    ])})`,
                    filter: `drop-shadow(0 3px 6px rgba(0, 0, 0, ${useAnimatedValue(
                      frameOffset,
                      [
                        [40, 0],
                        [60, 0.3],
                      ]
                    )}))`,
                  }}
                />
              </>
            );
          })()}
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 7} durationInFrames={sectionDuration}>
        <Section>
          <SectionTitle
            style={{
              color: "#191414",
              transform: `translateY(${useAnimatedValue(
                frame - sectionDuration * 7,
                [
                  [0, -30],
                  [20, 0],
                ],
                { easing: elasticOut }
              )}px)`,
              opacity: useAnimatedValue(frame - sectionDuration * 7, [
                [0, 0],
                [20, 1],
              ]),
              textShadow: generateShadow(
                useAnimatedValue(frame - sectionDuration * 7, [
                  [0, 0],
                  [20, 10],
                  [40, 5],
                ]),
                useAnimatedValue(frame - sectionDuration * 7, [
                  [0, 0],
                  [20, 0.4],
                  [40, 0.2],
                ]),
                "29, 185, 84"
              ),
            }}
          >
            Recently Played
          </SectionTitle>

          <List>
            {recentlyPlayed?.items
              ?.slice(0, 3)
              .map((track: any, index: number) => {
                const frameOffset = frame - sectionDuration * 7;
                // Stagger animations with different delays for professional feel
                const startFrame = 15 + index * 15;

                // Create a spring animation for natural movement
                const springProps = spring({
                  frame: frameOffset - startFrame,
                  fps: 30,
                  config: createSlowSpringConfig(12, 80, 1.5),
                });

                // Apply spring value to various properties
                const itemScale = Math.min(1, Math.max(0, springProps * 1.05));
                const itemOpacity = Math.min(1, Math.max(0, springProps * 1.2));

                // Dynamic, subtle, pulsating shadow
                const shadowOpacity =
                  0.15 + Math.sin((frameOffset + index * 10) * 0.04) * 0.1;
                const shadowBlur =
                  5 + Math.sin((frameOffset + index * 10) * 0.04) * 3;

                // Subtle sliding effect with slight delay
                const slideX = useAnimatedValue(
                  frameOffset,
                  [
                    [startFrame, -20],
                    [startFrame + 20, 0],
                  ],
                  { easing: easeOutBack }
                );

                // Individual floating animation for each item
                const floatY = Math.sin((frameOffset + index * 15) * 0.03) * 2;

                return (
                  <li
                    key={track?.played_at}
                    className="flex flex-col items-center gap-2 space-x-6"
                    style={{
                      opacity: itemOpacity,
                      transform: `translateX(${slideX}px) translateY(${floatY}px) scale(${itemScale})`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <ListItemImage
                      src={track?.track?.album?.images?.[0]?.url}
                      alt={track?.track?.name}
                      style={{
                        boxShadow: `0 ${shadowBlur}px ${
                          shadowBlur * 1.5
                        }px rgba(0, 0, 0, ${shadowOpacity})`,
                        transform: `scale(${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame + 5, 0.95],
                            [startFrame + 15, 1.05],
                            [startFrame + 25, 1],
                          ],
                          { easing: smoothBounce }
                        )})`,
                        border: `4px solid rgba(255, 255, 255, ${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame, 0],
                            [startFrame + 15, 0.3],
                          ]
                        )})`,
                      }}
                    />
                    <div
                      style={{
                        opacity: useAnimatedValue(frameOffset, [
                          [startFrame + 10, 0],
                          [startFrame + 25, 1],
                        ]),
                        transform: `translateY(${useAnimatedValue(frameOffset, [
                          [startFrame + 10, 10],
                          [startFrame + 25, 0],
                        ])}px)`,
                      }}
                    >
                      <TrackName
                        style={{
                          color: "#191414",
                          filter: `drop-shadow(0 1px 2px rgba(0, 0, 0, ${useAnimatedValue(
                            frameOffset,
                            [
                              [startFrame + 15, 0],
                              [startFrame + 30, 0.2],
                            ]
                          )}))`,
                        }}
                      >
                        {track?.track?.name}
                      </TrackName>
                      <TrackArtist
                        style={{
                          color: "#191414",
                          opacity: useAnimatedValue(frameOffset, [
                            [startFrame + 15, 0],
                            [startFrame + 30, 0.7],
                          ]),
                          transform: `translateY(${useAnimatedValue(
                            frameOffset,
                            [
                              [startFrame + 15, 5],
                              [startFrame + 30, 0],
                            ]
                          )}px)`,
                        }}
                      >
                        {track?.track?.artists?.[0]?.name}
                      </TrackArtist>
                    </div>
                  </li>
                );
              })}
          </List>
          <Logo
            src="https://i.imgur.com/65lwHJi.png"
            alt="Forge Zone Logo"
            style={{
              transform: `translate(${
                Math.sin((frame - sectionDuration * 7) * 0.03) * 3
              }px, ${Math.cos((frame - sectionDuration * 7) * 0.03) * 2}px)`,
              filter: `drop-shadow(0 3px 5px rgba(0, 0, 0, ${
                0.2 +
                Math.abs(Math.sin((frame - sectionDuration * 7) * 0.04) * 0.1)
              }))`,
            }}
          />
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 8} durationInFrames={sectionDuration}>
        <Section>
          {(() => {
            const frameOffset = frame - sectionDuration * 8;

            // Using spring physics for a more professional bounce effect
            const titleSpring = spring({
              frame: frameOffset,
              fps: 30,
              config: createSlowSpringConfig(12, 80, 1.5),
            });

            // Constrain the spring value to reasonable limits
            const titleScale = Math.min(1.1, Math.max(0, titleSpring));

            // Create dynamic shadow based on scale for a more coherent look
            const shadowBlur = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [20, 15],
                [40, 10],
              ],
              { easing: smoothEasing }
            );

            const shadowOpacity = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [20, 0.4],
                [40, 0.25],
              ],
              { easing: smoothEasing }
            );

            // Subtle constant motion for visual interest
            const floatY = Math.sin(frameOffset * 0.03) * 4;

            // Create a slight angle change for a more dynamic look
            const titleRotate = Math.sin(frameOffset * 0.02) * 0.8;

            return (
              <>
                <div
                  style={{
                    opacity: useAnimatedValue(
                      frameOffset,
                      [
                        [0, 0],
                        [20, 1],
                      ],
                      { easing: elasticOut }
                    ),
                    transform: `translateY(${floatY}px) rotate(${titleRotate}deg) scale(${titleScale})`,
                    textShadow: generateShadow(
                      shadowBlur,
                      shadowOpacity,
                      "29, 185, 84",
                      0,
                      3
                    ),
                    filter: `brightness(${
                      1 + Math.sin(frameOffset * 0.04) * 0.05
                    })`,
                  }}
                >
                  <SectionTitle style={{ color: "#191414" }}>
                    {videoInsights.newdiscov
                      ? videoInsights.newdiscov
                      : "New Discoveries"}
                  </SectionTitle>
                </div>
                <Logo
                  src="https://i.imgur.com/65lwHJi.png"
                  alt="Forge Zone Logo"
                  style={{
                    opacity: useAnimatedValue(frameOffset, [
                      [40, 0],
                      [60, 1],
                    ]),
                    transform: `translate(
                      ${Math.sin(frameOffset * 0.03) * 5}px,
                      ${Math.cos(frameOffset * 0.04) * 4}px
                    ) scale(${useAnimatedValue(frameOffset, [
                      [40, 0.9],
                      [55, 1.1],
                      [70, 1],
                    ])})`,
                    filter: `drop-shadow(0 3px 7px rgba(0, 0, 0, ${useAnimatedValue(
                      frameOffset,
                      [
                        [40, 0],
                        [60, 0.35],
                      ]
                    )}))`,
                  }}
                />
              </>
            );
          })()}
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 9} durationInFrames={sectionDuration}>
        <Section>
          <SectionTitle
            style={{
              color: "#191414",
              transform: `translateY(${useAnimatedValue(
                frame - sectionDuration * 9,
                [
                  [0, -25],
                  [20, 0],
                ],
                { easing: elasticOut }
              )}px)
                          rotate(${
                            Math.sin((frame - sectionDuration * 9) * 0.02) * 0.5
                          }deg)`,
              opacity: useAnimatedValue(frame - sectionDuration * 9, [
                [0, 0],
                [20, 1],
              ]),
              textShadow: generateShadow(
                useAnimatedValue(frame - sectionDuration * 9, [
                  [0, 0],
                  [20, 12],
                  [40, 6],
                ]),
                useAnimatedValue(frame - sectionDuration * 9, [
                  [0, 0],
                  [20, 0.35],
                  [40, 0.25],
                ]),
                "29, 185, 84"
              ),
            }}
          >
            New Discoveries
          </SectionTitle>

          <List>
            {newDiscovery?.slice(0, 3).map((artist: any, index: number) => {
              const frameOffset = frame - sectionDuration * 9;
              // Stagger animations with different timing for visual interest
              const startFrame = 15 + index * 18;

              // Create a spring animation for natural movement
              const springProps = spring({
                frame: frameOffset - startFrame,
                fps: 30,
                config: createSlowSpringConfig(12, 80, 1.5),
              });

              // Apply spring value with constraints
              const itemScale = Math.min(1.05, Math.max(0, springProps));
              const itemOpacity = Math.min(1, Math.max(0, springProps * 1.2));

              // Dynamic shadow with sophisticated lighting effect
              const shadowOpacity =
                0.15 + Math.sin((frameOffset + index * 12) * 0.04) * 0.1;
              const shadowBlur =
                4 + Math.sin((frameOffset + index * 12) * 0.04) * 3;
              const shadowOffset =
                2 + Math.sin((frameOffset + index * 12) * 0.04) * 1;

              // Subtle rotation that differs for each artist
              const itemRotate =
                Math.sin((frameOffset + index * 15) * 0.02) *
                (0.8 - index * 0.1);

              // Individual floating animation
              const floatY = Math.sin((frameOffset + index * 22) * 0.03) * 3;

              return (
                <li
                  key={artist?.id}
                  className="flex flex-col items-center gap-2 space-x-6"
                  style={{
                    opacity: itemOpacity,
                    transform: `translateY(${floatY}px) rotate(${itemRotate}deg) scale(${itemScale})`,
                  }}
                >
                  <ArtistImage
                    src={artist?.images?.[0]?.url}
                    alt={artist?.name}
                    style={{
                      boxShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`,
                      transform: `scale(${useAnimatedValue(
                        frameOffset,
                        [
                          [startFrame + 5, 0.92],
                          [startFrame + 15, 1.04],
                          [startFrame + 25, 1],
                        ],
                        { easing: easeOutBack }
                      )})`,
                      border: `4px solid rgba(211, 211, 211, ${useAnimatedValue(
                        frameOffset,
                        [
                          [startFrame, 0],
                          [startFrame + 20, 0.8],
                        ],
                        { easing: smoothEasing }
                      )})`,
                      filter: `brightness(${
                        1 + Math.sin((frameOffset + index * 15) * 0.03) * 0.04
                      })`,
                    }}
                  />
                  <div
                    style={{
                      opacity: useAnimatedValue(frameOffset, [
                        [startFrame + 8, 0],
                        [startFrame + 23, 1],
                      ]),
                      transform: `translateY(${useAnimatedValue(
                        frameOffset,
                        [
                          [startFrame + 8, 12],
                          [startFrame + 23, 0],
                        ],
                        { easing: elasticOut }
                      )}px)`,
                    }}
                  >
                    <TrackName
                      style={{
                        color: "#191414",
                        filter: `drop-shadow(0 1px 2px rgba(0, 0, 0, ${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame + 15, 0],
                            [startFrame + 30, 0.25],
                          ]
                        )}))`,
                      }}
                    >
                      {artist?.name}
                    </TrackName>
                    <TrackArtist
                      style={{
                        color: "#191414",
                        opacity: useAnimatedValue(frameOffset, [
                          [startFrame + 18, 0],
                          [startFrame + 33, 0.7],
                        ]),
                        transform: `translateY(${useAnimatedValue(frameOffset, [
                          [startFrame + 18, 5],
                          [startFrame + 33, 0],
                        ])}px)`,
                      }}
                    >
                      {artist?.genres?.[0] || "Artist"}
                    </TrackArtist>
                  </div>
                </li>
              );
            })}
          </List>
          <Logo
            src="https://i.imgur.com/65lwHJi.png"
            alt="Forge Zone Logo"
            style={{
              transform: `translate(
                ${Math.sin((frame - sectionDuration * 9) * 0.02) * 4}px, 
                ${Math.cos((frame - sectionDuration * 9) * 0.03) * 3}px
              ) scale(${useAnimatedValue(frame - sectionDuration * 9, [
                [60, 0.95],
                [75, 1.05],
                [90, 1],
              ])})`,
              filter: `drop-shadow(0 2px 5px rgba(0, 0, 0, ${
                0.2 +
                Math.abs(Math.sin((frame - sectionDuration * 9) * 0.03) * 0.1)
              }))`,
            }}
          />
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 10} durationInFrames={sectionDuration}>
        <Section>
          {(() => {
            const frameOffset = frame - sectionDuration * 10;

            // Create a dramatic entrance animation for the title using spring physics
            const titleSpring = spring({
              frame: frameOffset,
              fps: 30,
              config: createSlowSpringConfig(12, 80, 1.5),
            });

            // Use spring values for multiple properties
            const titleOpacity = Math.min(1, Math.max(0, titleSpring * 1.2));
            const titleScale = Math.min(
              1.1,
              Math.max(0.8, 0.8 + titleSpring * 0.3)
            );

            // Add dynamic rotation based on the spring motion
            const titleRotate = Math.sin(frameOffset * 0.03) * 1;

            // Create a dramatic lighting effect with dynamic shadows
            const shadowBlur = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [20, 15],
                [40, 8],
              ],
              { easing: smoothEasing }
            );

            const shadowOpacity = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [25, 0.45],
                [50, 0.25],
              ],
              { easing: smoothEasing }
            );

            // Add subtle floating motion for visual interest
            const floatY = Math.sin(frameOffset * 0.03) * 4;

            return (
              <>
                <div
                  style={{
                    opacity: titleOpacity,
                    transform: `translateY(${floatY}px) rotate(${titleRotate}deg) scale(${titleScale})`,
                    textShadow: generateShadow(
                      shadowBlur,
                      shadowOpacity,
                      "29, 185, 84",
                      0,
                      3
                    ),
                  }}
                >
                  <SectionTitle style={{ color: "#191414" }}>
                    {videoInsights.genres
                      ? videoInsights.genres
                      : "Your Favorite Genres"}
                  </SectionTitle>
                </div>

                {/* Animate the logo with orbital motion */}
                <Logo
                  src="https://i.imgur.com/65lwHJi.png"
                  alt="Forge Zone Logo"
                  style={{
                    opacity: useAnimatedValue(frameOffset, [
                      [40, 0],
                      [60, 1],
                    ]),
                    transform: `translate(
                      ${Math.sin(frameOffset * 0.04) * 5}px,
                      ${Math.cos(frameOffset * 0.03) * 3}px
                    ) scale(${useAnimatedValue(frameOffset, [
                      [40, 0.9],
                      [55, 1.1],
                      [70, 1],
                    ])})`,
                    filter: `drop-shadow(0 3px 6px rgba(0, 0, 0, ${useAnimatedValue(
                      frameOffset,
                      [
                        [40, 0],
                        [60, 0.3],
                      ]
                    )}))`,
                  }}
                />
              </>
            );
          })()}
        </Section>
      </Sequence>

      <Sequence from={sectionDuration * 11} durationInFrames={sectionDuration}>
        <Section>
          <SectionTitle
            style={{
              color: "#191414",
              transform: `translateY(${useAnimatedValue(
                frame - sectionDuration * 11,
                [
                  [0, -20],
                  [20, 0],
                ],
                { easing: elasticOut }
              )}px) 
                          rotate(${
                            Math.sin((frame - sectionDuration * 11) * 0.025) *
                            0.5
                          }deg)`,
              opacity: useAnimatedValue(frame - sectionDuration * 11, [
                [0, 0],
                [20, 1],
              ]),
              textShadow: generateShadow(
                useAnimatedValue(frame - sectionDuration * 11, [
                  [0, 0],
                  [20, 10],
                  [40, 5],
                ]),
                useAnimatedValue(frame - sectionDuration * 11, [
                  [0, 0],
                  [20, 0.35],
                  [40, 0.2],
                ]),
                "29, 185, 84"
              ),
              filter: `brightness(${
                1 + Math.sin((frame - sectionDuration * 11) * 0.04) * 0.05
              })`,
            }}
          >
            Your Musical Universe
          </SectionTitle>

          <List>
            {genres &&
              genres.slice(0, 4).map(([genre, count]: any, index: number) => {
                const frameOffset = frame - sectionDuration * 11;
                // Carefully staggered animations for balanced visual flow
                const startFrame = 15 + index * 12;

                // Create spring physics for natural movement
                const springProps = spring({
                  frame: frameOffset - startFrame,
                  fps: 30,
                  config: createSlowSpringConfig(12, 80, 1.5),
                });

                // Apply spring values with constraints
                const itemScale = Math.min(1.05, Math.max(0, springProps));
                const itemOpacity = Math.min(1, Math.max(0, springProps * 1.2));

                // Create alternating entrance directions based on index
                const itemX = useAnimatedValue(
                  frameOffset,
                  [
                    [startFrame, index % 2 === 0 ? -40 : 40],
                    [startFrame + 20, 0],
                  ],
                  { easing: elasticOut }
                );

                // Add subtle floating effect different for each genre
                const floatX = Math.sin((frameOffset + index * 20) * 0.03) * 2;
                const floatY = Math.cos((frameOffset + index * 15) * 0.04) * 1;

                // Create animated count value that counts up
                const countValue = Math.round(
                  useAnimatedValue(
                    frameOffset,
                    [
                      [startFrame + 10, 0],
                      [startFrame + 40, Number(count)],
                    ],
                    { easing: smoothEasing }
                  )
                );

                // Dynamic text brightness based on animation progress
                const textBrightness = useAnimatedValue(
                  frameOffset,
                  [
                    [startFrame, 0.7],
                    [startFrame + 30, 1],
                  ],
                  { easing: smoothEasing }
                );

                return (
                  <li
                    key={genre}
                    className="flex justify-between w-3/4"
                    style={{
                      opacity: itemOpacity,
                      transform: `translate(${
                        itemX + floatX
                      }px, ${floatY}px) scale(${itemScale})`,
                    }}
                  >
                    <GenreName
                      style={{
                        color: "#191414",
                        filter: `brightness(${textBrightness}) drop-shadow(0 1px 2px rgba(0, 0, 0, ${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame + 10, 0],
                            [startFrame + 30, 0.2],
                          ]
                        )}))`,
                      }}
                    >
                      {genre}
                    </GenreName>
                    <GenreCount
                      style={{
                        color: "#191414",
                        opacity: useAnimatedValue(frameOffset, [
                          [startFrame + 15, 0],
                          [startFrame + 35, 0.7],
                        ]),
                        transform: `scale(${useAnimatedValue(
                          frameOffset,
                          [
                            [startFrame + 15, 0.9],
                            [startFrame + 25, 1.1],
                            [startFrame + 35, 1],
                          ],
                          { easing: smoothBounce }
                        )})`,
                      }}
                    >
                      {countValue} times
                    </GenreCount>
                  </li>
                );
              })}
          </List>
          <Logo
            src="https://i.imgur.com/65lwHJi.png"
            alt="Forge Zone Logo"
            style={{
              transform: `translate(${
                Math.sin((frame - sectionDuration * 11) * 0.02) * 4
              }px, ${Math.cos((frame - sectionDuration * 11) * 0.03) * 3}px)`,
              filter: `drop-shadow(0 2px 4px rgba(0, 0, 0, ${
                0.2 +
                Math.abs(Math.sin((frame - sectionDuration * 11) * 0.03) * 0.1)
              }))`,
              opacity: useAnimatedValue(frame - sectionDuration * 11, [
                [0, 0],
                [40, 1],
              ]),
            }}
          />
        </Section>
      </Sequence>

      <Sequence
        from={sectionDuration * 12}
        durationInFrames={sectionDuration + 30}
      >
        <BrandingSection
          style={{
            background:
              "linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(29, 185, 84, 0.5) 100%)",
          }}
        >
          {(() => {
            const frameOffset = frame - sectionDuration * 12;

            // Create dramatic multiple spring animations for the finale
            const titleSpring1 = spring({
              frame: frameOffset,
              fps: 30,
              config: createSlowSpringConfig(12, 80, 1.5),
            });

            const titleSpring2 = spring({
              frame: frameOffset - 20, // Delayed spring for the second line
              fps: 30,
              config: createSlowSpringConfig(12, 80, 1.5),
            });

            // Professional entrance animations
            const titleLine1Scale = Math.min(1.2, Math.max(0, titleSpring1));
            const titleLine1Opacity = Math.min(
              1,
              Math.max(0, titleSpring1 * 1.2)
            );

            const titleLine2Scale = Math.min(1.2, Math.max(0, titleSpring2));
            const titleLine2Opacity = Math.min(
              1,
              Math.max(0, titleSpring2 * 1.2)
            );

            // Add subtle perpetual floating movement
            const line1FloatY = Math.sin(frameOffset * 0.02) * 4;
            const line2FloatY = Math.sin((frameOffset + 10) * 0.02) * 4; // Offset phase

            // Add dynamic rotation for the title lines
            const line1Rotate = Math.sin(frameOffset * 0.015) * 0.5;
            const line2Rotate = Math.sin((frameOffset + 10) * 0.015) * 0.5; // Offset phase

            // Create dynamic shadow effects
            const shadowBlur = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [40, 20],
                [80, 15],
              ],
              { easing: smoothEasing }
            );

            const shadowOpacity = useAnimatedValue(
              frameOffset,
              [
                [0, 0],
                [40, 0.6],
                [80, 0.5],
              ],
              { easing: smoothEasing }
            );

            // Create dynamic gradient animation
            const gradientPosition = useAnimatedValue(frameOffset, [
              [0, 0],
              [120, 360],
            ]);

            // Create logo animations with spring physics
            const logoSpring = spring({
              frame: frameOffset - 40,
              fps: 30,
              config: createSlowSpringConfig(12, 80, 1.5),
            });

            const logoScale = Math.min(1.2, Math.max(0, logoSpring));
            const logoOpacity = Math.min(1, Math.max(0, logoSpring * 1.2));

            // Add subtle orbital motion to the logo
            const logoX = Math.sin(frameOffset * 0.02) * 6;
            const logoY = Math.cos(frameOffset * 0.03) * 4;

            // Add pulsating effect for the logo
            const logoPulse = 1 + Math.sin(frameOffset * 0.04) * 0.05;

            return (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      opacity: titleLine1Opacity,
                      transform: `translateY(${line1FloatY}px) rotate(${line1Rotate}deg) scale(${titleLine1Scale})`,
                      margin: "0",
                    }}
                  >
                    <BrandingText>Made With</BrandingText>
                  </div>
                  <div
                    style={{
                      opacity: titleLine2Opacity,
                      transform: `translateY(${line2FloatY}px) rotate(${line2Rotate}deg) scale(${titleLine2Scale})`,
                      margin: "0",
                    }}
                  >
                    <BrandingText>Forge Zone</BrandingText>
                  </div>
                </div>

                <Logo
                  src="/forge-zone.png"
                  alt="Forge Zone Logo"
                  style={{
                    opacity: logoOpacity,
                    transform: `translate(${logoX}px, ${logoY}px) scale(${
                      logoScale * logoPulse
                    })`,
                    filter: `brightness(${
                      1 + Math.sin(frameOffset * 0.05) * 0.1
                    }) 
                             drop-shadow(0 4px 12px rgba(29, 185, 84, ${useAnimatedValue(
                               frameOffset,
                               [
                                 [40, 0],
                                 [80, 0.6],
                               ]
                             )}))`,
                  }}
                />
              </>
            );
          })()}
        </BrandingSection>
      </Sequence>
    </AbsoluteFill>
  );
}
