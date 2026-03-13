const reactionIconUrl = (name: string) =>
  new URL(`../assets/reactions/icons/${name}.png`, import.meta.url).href;

export const MESSAGE_REACTION_OPTIONS = [
  {
    type: 'like',
    emoji: '👍',
    iconUrl: reactionIconUrl('reaction-like'),
    videoUrl: new URL(
      '../assets/reactions/Bubble Burst Confetti.webm',
      import.meta.url,
    ).href,
    movUrl: new URL('../assets/reactions/mov/Bubble Burst Confetti.mov', import.meta.url)
      .href,
  },
  {
    type: 'heart',
    emoji: '❤️',
    iconUrl: reactionIconUrl('reaction-heart'),
    videoUrl: new URL('../assets/reactions/Love burst solid.webm', import.meta.url)
      .href,
    movUrl: new URL('../assets/reactions/mov/Love burst solid.mov', import.meta.url)
      .href,
  },
  {
    type: 'laugh',
    emoji: '😂',
    iconUrl: reactionIconUrl('reaction-laugh'),
    videoUrl: new URL('../assets/reactions/Celebration.webm', import.meta.url).href,
    movUrl: new URL('../assets/reactions/mov/Celebration.mov', import.meta.url).href,
  },
  {
    type: 'wow',
    emoji: '😮',
    iconUrl: reactionIconUrl('reaction-wow'),
    videoUrl: new URL('../assets/reactions/Fireworks.webm', import.meta.url).href,
    movUrl: new URL('../assets/reactions/mov/Fireworks.mov', import.meta.url).href,
  },
  {
    type: 'sad',
    emoji: '😢',
    iconUrl: reactionIconUrl('reaction-sad'),
    videoUrl: new URL('../assets/reactions/confetti.webm', import.meta.url).href,
    movUrl: new URL('../assets/reactions/mov/confetti.mov', import.meta.url).href,
  },
  {
    type: 'fire',
    emoji: '🔥',
    iconUrl: reactionIconUrl('reaction-fire'),
    videoUrl: new URL('../assets/reactions/Flex Confetti.webm', import.meta.url)
      .href,
    movUrl: new URL(
      '../assets/reactions/mov/Copy of Flex Confetti.mov',
      import.meta.url,
    ).href,
  },
] as const;

export type MessageReactionType = (typeof MESSAGE_REACTION_OPTIONS)[number]['type'];

export interface MessageReactionSummaryItem {
  type: MessageReactionType | string;
  emoji: string;
  count: number;
}

