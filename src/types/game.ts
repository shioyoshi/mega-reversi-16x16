export type Gender = 'male' | 'female' | 'other';

export interface UserProfile {
  name: string;
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  age: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  isInitialized: boolean;
}

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'core' | 'arms' | 'shoulders';

export interface MuscleStats {
  chest: number;      // 大胸筋
  back: number;       // 広背筋・脊柱起立筋
  legs: number;       // 大腿四頭筋・ハムストリングス・臀筋
  core: number;       // 腹直筋・腹斜筋
  arms: number;       // 上腕二頭筋・三頭筋
  shoulders: number;  // 三角筋
}

export interface Estimated1RM {
  benchPress: number; // kg
  squat: number;      // kg
  deadlift: number;   // kg
}

export type ExerciseCategory = 'bodyweight' | 'gym';

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: ExerciseCategory;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  description: string;
  baseExp: number;         // 獲得筋肉EXP
  baseReps: number;        // 1クリックあたりのレップ数
  currentWeight: number;   // 自重なら体重比%, ジムならkg
  unlocked: boolean;
  unlockConditionText: string;
  unlockRequirement?: {
    muscle?: { group: MuscleGroup; level: number };
    totalReps?: number;
    userLevel?: number;
    gymUnlocked?: boolean;
    exerciseLevel?: { id: string; level: number };
  };
  level: number;
  repsCompleted: number;
  upgradeCostExp: number;
}

export interface UpgradeItem {
  id: string;
  name: string;
  type: 'supplement' | 'gear' | 'trainer' | 'facility';
  description: string;
  cost: number;
  ownedCount: number;
  maxCount?: number;
  passiveExpPerSec: number;
  clickMultiplier: number;
  fatigueRecoveryMultiplier: number;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  check: (state: GameState) => boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color?: string;
}

export interface GameState {
  profile: UserProfile;
  muscleStats: MuscleStats;
  totalMuscleExp: number;      // 現在の消費可能筋肉EXP (プロテインポイント)
  lifetimeMuscleExp: number;   // 累計獲得筋肉EXP
  playerLevel: number;
  totalReps: number;
  totalLiftedKg: number;       // 累計持ち上げた重量 (kg)
  fatigue: number;             // 疲労度 0 - 100
  pumpGauge: number;           // パンプ度 0 - 100
  isPumpMode: boolean;         // 超パンプモード中か
  pumpTimeRemaining: number;   // 超パンプ残り秒数
  hasGymMembership: boolean;   // ジム会員権があるか
  exercises: Exercise[];
  upgrades: UpgradeItem[];
  achievements: Achievement[];
  lastSavedTimestamp: number;
}
