export enum Screen {
  HOME = 'HOME',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
  LEADERBOARD = 'LEADERBOARD',
  SHOP = 'SHOP',
  PROFILE = 'PROFILE',
  PRIZES = 'PRIZES',
  SETTINGS = 'SETTINGS'
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface UserState {
  tickets: number;
  highScore: number;
  dailyFreePlayUsed: boolean;
  dailyBonusClaimed: boolean; // Track if daily ticket was received
  streakDays: number;
  totalGamesPlayed: number;
  username: string;
  rank: number; // Simulated rank
  badges: string[];
  totalCorrectAnswers: number;
  referralCode: string;
  referralsCount: number;
  totalScore: number;
  perfectGames: number;
  settings: UserSettings;
}

export interface QuizState {
  currentQuestionIndex: number;
  score: number;
  answers: boolean[]; // true = correct, false = wrong
  startTime: number; // To calculate speed bonus
  isActive: boolean;
}

export interface PrizeTier {
  minPlayers: number;
  prizes: {
    rank1: string;
    rank2: string;
    rank3: string;
  };
}

export interface ShopItem {
  id: string;
  tickets: number;
  price: string;
  label?: string;
}