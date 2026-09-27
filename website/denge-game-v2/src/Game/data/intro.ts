export type IntroStage = 'splash' | 'profile' | 'opening' | 'lina' | 'complete';

export const INTRO_VIDEOS = {
  opening: {
    title: 'Denge Kasabası’na hoş geldin',
    path: 'assets/videos/Camera_descending_onto_game_map.mp4',
  },
  lina: {
    title: 'Lina ile tanış',
    path: 'assets/videos/lina-masked.mp4',
  },
} as const;

export const INTRO_ART = {
  clouds: 'assets/videos/intro-clouds.jpg',
  town: 'assets/videos/intro-town.jpg',
  lina: 'assets/videos/lina-poster.png',
} as const;

const NEXT_STAGE: Record<IntroStage, IntroStage> = {
  splash: 'profile',
  profile: 'opening',
  opening: 'lina',
  lina: 'complete',
  complete: 'complete',
};

export function advanceIntro(current: IntroStage, finished: IntroStage): IntroStage {
  return current === finished ? NEXT_STAGE[current] : current;
}
