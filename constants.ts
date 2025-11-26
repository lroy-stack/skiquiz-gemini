import { PrizeTier, ShopItem, Badge } from './types';

export const GAME_CONFIG = {
  QUESTIONS_PER_GAME: 5,
  TIME_PER_QUESTION_SEC: 5,
  BASE_SCORE: 100,
  MAX_SPEED_BONUS: 20,
  STREAK_BONUS_ALL_CORRECT: 100,
  TICKET_COST_REPLAY: 3, // Cost for extra games
  DAILY_LOGIN_BONUS: 1, // Tickets received on login
  TICKETS_REFERRAL_BONUS: 3,
  TICKETS_JOIN_BONUS: 1,
};

export const PRIZE_TIERS: PrizeTier[] = [
  {
    minPlayers: 0,
    prizes: { rank1: 'Ski Goggles (€100)', rank2: 'Gloves (€40)', rank3: 'Buff (€15)' }
  },
  {
    minPlayers: 100,
    prizes: { rank1: 'Helmet (€150)', rank2: 'Ski Goggles (€100)', rank3: 'Gloves (€40)' }
  },
  {
    minPlayers: 200,
    prizes: { rank1: 'Complete Set (€250)', rank2: 'Jacket (€150)', rank3: 'Set (€60)' }
  },
  {
    minPlayers: 400,
    prizes: { rank1: 'Pro Gear (€700)', rank2: 'Set (€300)', rank3: 'Jacket (€150)' }
  }
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'pack_small', tickets: 10, price: '€2.99' },
  { id: 'pack_medium', tickets: 25, price: '€5.99', label: 'Popular' },
  { id: 'pack_large', tickets: 60, price: '€9.99', label: 'Best Value' },
];

export const BADGES: Badge[] = [
  { id: 'first_run', name: 'Rookie', description: 'Play your first game', iconName: 'Flag' },
  { id: 'streak_week', name: 'Committed', description: 'Reach a 7-day streak', iconName: 'Calendar' },
  { id: 'sharpshooter', name: 'Sharpshooter', description: '100 correct answers', iconName: 'Target' },
  { id: 'high_flyer', name: 'High Flyer', description: 'Score 600+ in a game', iconName: 'Zap' },
  { id: 'elite_club', name: 'Pro', description: 'Reach Top 10 rank', iconName: 'Crown' },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Hanni S.', score: 685, country: 'AT' },
  { rank: 2, name: 'Marco O.', score: 672, country: 'CH' },
  { rank: 3, name: 'Lindsey V.', score: 660, country: 'US' },
  { rank: 4, name: 'Felix N.', score: 645, country: 'DE' },
  { rank: 5, name: 'Alexis P.', score: 630, country: 'FR' },
  { rank: 6, name: 'Mikaela S.', score: 615, country: 'US' },
  { rank: 7, name: 'Henrik K.', score: 602, country: 'NO' },
  { rank: 8, name: 'Lara G.', score: 590, country: 'CH' },
  { rank: 9, name: 'Petra V.', score: 588, country: 'SK' },
  { rank: 10, name: 'Sofia G.', score: 575, country: 'IT' },
];