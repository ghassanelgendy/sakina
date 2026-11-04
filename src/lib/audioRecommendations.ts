import type { AudioTrack, TrackPlaybackProgress } from '../types/audio';

export interface RecommendationResult {
  track: AudioTrack;
  score: number;
  reason: string;
  badgeType: 'context' | 'followed' | 'favorite' | 'speaker' | 'discovery';
}

export interface RecommendationParams {
  catalog: AudioTrack[];
  playbackProgress: Record<string, TrackPlaybackProgress>;
  favoriteTrackIds: string[];
  followedTopicIds: string[];
  currentTrack: AudioTrack | null;
  limit?: number;
}

/**
 * Client-Side Recommendation Engine for Sakina
 * Runs 100% in-browser on Vercel static hosting without requiring any backend.
 * Uses user interaction signals (playback history, favorites, followed topics)
 * and temporal context (time of day, Friday) to generate personalized audio suggestions.
 */
export function getRecommendedTracks({
  catalog,
  playbackProgress,
  favoriteTrackIds,
  followedTopicIds,
  currentTrack,
  limit = 4,
}: RecommendationParams): RecommendationResult[] {
  if (!catalog || catalog.length === 0) return [];

  const now = new Date();
  const hour = now.getHours();
  const isFriday = now.getDay() === 5;
  const isMorning = hour >= 5 && hour < 12;
  const isNight = hour >= 19 || hour < 5;

  // 1. Build User Affinity Profiles from Local Signals
  const speakerAffinity: Record<string, number> = {};
  const topicAffinity: Record<string, number> = {};

  // Favorites signals
  favoriteTrackIds.forEach((id) => {
    const t = catalog.find((item) => item.id === id);
    if (t) {
      speakerAffinity[t.reciterOrSpeaker] = (speakerAffinity[t.reciterOrSpeaker] || 0) + 4;
      topicAffinity[t.topicId] = (topicAffinity[t.topicId] || 0) + 5;
    }
  });

  // Followed topics signals
  followedTopicIds.forEach((topicId) => {
    topicAffinity[topicId] = (topicAffinity[topicId] || 0) + 6;
  });

  // Playback history signals
  Object.entries(playbackProgress).forEach(([id, progress]) => {
    if (progress.position > 25) {
      const t = catalog.find((item) => item.id === id);
      if (t) {
        speakerAffinity[t.reciterOrSpeaker] = (speakerAffinity[t.reciterOrSpeaker] || 0) + 2;
        topicAffinity[t.topicId] = (topicAffinity[t.topicId] || 0) + 3;
      }
    }
  });

  // 2. Score Every Track in Catalog
  const scoredTracks: RecommendationResult[] = [];

  for (const track of catalog) {
    // Avoid recommending the track currently actively playing
    if (currentTrack && track.id === currentTrack.id) continue;

    let score = 0;
    let reason = 'تسجيل مقترح للسكينة';
    let badgeType: RecommendationResult['badgeType'] = 'discovery';

    const progress = playbackProgress[track.id];
    const isUnplayed = !progress || progress.position < 20;
    const isFinished = progress && track.duration > 0 && progress.position >= track.duration - 25;

    // Followed Topic Boost
    if (followedTopicIds.includes(track.topicId)) {
      score += 35;
      reason = `من أقسامك المتابعة: «${track.topicLabel}»`;
      badgeType = 'followed';
    }

    // Topic Affinity Boost
    const topicScore = topicAffinity[track.topicId] || 0;
    if (topicScore > 0) {
      score += topicScore * 4;
      if (badgeType !== 'followed') {
        reason = `بناءً على اهتمامك بـ «${track.topicLabel}»`;
        badgeType = 'followed';
      }
    }

    // Speaker Affinity Boost
    const speakerScore = speakerAffinity[track.reciterOrSpeaker] || 0;
    if (speakerScore > 0) {
      score += speakerScore * 5;
      if (score > 40 && badgeType !== 'followed') {
        reason = `لأنك استمعت إلى ${track.reciterOrSpeaker}`;
        badgeType = 'speaker';
      }
    }

    // Contextual / Time-of-Day Boost
    if (isFriday && (track.topicId === 'prayer' || track.topicId === 'tadabbur' || track.title.includes('الكهف'))) {
      score += 30;
      reason = 'موصى به ليوم الجمعة المبارك 🕌';
      badgeType = 'context';
    } else if (isNight && (track.topicId === 'prayer' || track.topicId === 'peace_conflict' || track.topicId === 'complete')) {
      score += 26;
      reason = 'مناسب لساعات المساء والسكينة 🌙';
      badgeType = 'context';
    } else if (isMorning && (track.topicId === 'short_surahs' || track.id === 'minshawi-fajr' || track.topicId === 'tazkiyah')) {
      score += 26;
      reason = 'مناسب لنفحات الصباح والبدايات 🌅';
      badgeType = 'context';
    }

    // Up-Next / Currently Playing Similarity
    if (currentTrack) {
      if (track.topicId === currentTrack.topicId) {
        score += 20;
      }
      if (track.reciterOrSpeaker === currentTrack.reciterOrSpeaker) {
        score += 22;
      }
    }

    // Discovery Boost for Unplayed Tracks
    if (isUnplayed) {
      score += 15;
    }

    // New Track Boost
    if (track.isNew) {
      score += 12;
    }

    // Penalty for tracks recently completed unless favorited
    if (isFinished && !favoriteTrackIds.includes(track.id)) {
      score -= 20;
    }

    scoredTracks.push({
      track,
      score,
      reason,
      badgeType,
    });
  }

  // 3. Sort by highest relevance score
  scoredTracks.sort((a, b) => b.score - a.score);

  return scoredTracks.slice(0, limit);
}
