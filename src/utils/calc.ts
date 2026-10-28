import { UserProfile, MuscleStats, Estimated1RM, GameState } from '../types/game';

/**
 * ユーザーの身長・体重・性別から基礎ステータスを推定する
 */
export function estimateInitialStats(profile: UserProfile): {
  muscleStats: MuscleStats;
  initial1RM: Estimated1RM;
  bmi: number;
  bodyFatPercent: number;
  leanBodyMass: number;
} {
  const heightM = profile.height / 100;
  const bmi = profile.weight / (heightM * heightM);

  // 体脂肪率推定 (Jackson-Pollock簡易推計法)
  let bodyFatPercent = 0;
  if (profile.gender === 'female') {
    bodyFatPercent = 1.2 * bmi + 0.23 * profile.age - 5.4;
  } else {
    // male / other
    bodyFatPercent = 1.2 * bmi + 0.23 * profile.age - 10.8 * 1 - 5.4;
  }
  // 正常範囲にクリッピング
  bodyFatPercent = Math.max(8, Math.min(45, Math.round(bodyFatPercent * 10) / 10));

  const leanBodyMass = Math.round(profile.weight * (1 - bodyFatPercent / 100) * 10) / 10;

  // 運動経験による補正係数
  let expMultiplier = 1.0;
  if (profile.experienceLevel === 'intermediate') expMultiplier = 1.2;
  if (profile.experienceLevel === 'advanced') expMultiplier = 1.45;

  // 男女比率 (平均的な筋肉量比率を加味)
  const genderStrengthRatio = profile.gender === 'female' ? 0.7 : 1.0;

  // 各部位の基礎筋力 (レベル1〜300のスケール、初期値10〜25程度)
  // 除脂肪体重(LBM)をベースに計算
  const baseStrength = (leanBodyMass / 3) * expMultiplier * genderStrengthRatio;

  const muscleStats: MuscleStats = {
    chest: Math.round(baseStrength * 0.9),
    back: Math.round(baseStrength * 1.0),
    legs: Math.round(baseStrength * 1.3), // 脚は元々の筋肉量が多い
    core: Math.round(baseStrength * 0.95),
    arms: Math.round(baseStrength * 0.75),
    shoulders: Math.round(baseStrength * 0.7),
  };

  // 初期推定1RM (最大挙上重量)
  // 初心者男性: ベンチ~0.5-0.6倍, スクワット~0.75倍, デッドリフト~0.9倍
  const weight = profile.weight;
  let benchRatio = profile.gender === 'female' ? 0.35 : 0.55;
  let squatRatio = profile.gender === 'female' ? 0.55 : 0.8;
  let deadliftRatio = profile.gender === 'female' ? 0.65 : 0.95;

  benchRatio *= expMultiplier;
  squatRatio *= expMultiplier;
  deadliftRatio *= expMultiplier;

  const initial1RM: Estimated1RM = {
    benchPress: Math.round(weight * benchRatio),
    squat: Math.round(weight * squatRatio),
    deadlift: Math.round(weight * deadliftRatio),
  };

  return {
    muscleStats,
    initial1RM,
    bmi: Math.round(bmi * 10) / 10,
    bodyFatPercent,
    leanBodyMass,
  };
}

/**
 * 累計筋肉経験値からプレイヤーレベルを計算
 */
export function calculatePlayerLevel(lifetimeExp: number): number {
  // レベル1: 0 exp, レベル2: 50 exp, レベル3: 150 exp ...
  return Math.floor(1 + Math.sqrt(lifetimeExp / 60));
}

/**
 * 次のレベルまでの必要経験値
 */
export function getExpForNextLevel(currentLevel: number): number {
  return Math.floor(Math.pow(currentLevel, 2) * 60);
}

/**
 * 現在の推定1RM（部位筋力の上昇を加味した動的計算）
 */
export function calculateCurrent1RM(state: GameState): Estimated1RM {
  const { profile, muscleStats } = state;
  const initial = estimateInitialStats(profile).initial1RM;

  // 胸・肩・腕の成長率
  const chestProgress = Math.max(0, muscleStats.chest - 10) * 0.45;
  const tricepsProgress = Math.max(0, muscleStats.arms - 10) * 0.2;
  const benchBonus = Math.round(chestProgress + tricepsProgress);

  // 脚・体幹の成長率
  const legProgress = Math.max(0, muscleStats.legs - 10) * 0.65;
  const coreProgress = Math.max(0, muscleStats.core - 10) * 0.2;
  const squatBonus = Math.round(legProgress + coreProgress);

  // 背中・脚・体幹の成長率
  const backProgress = Math.max(0, muscleStats.back - 10) * 0.6;
  const deadliftBonus = Math.round(backProgress + legProgress * 0.3);

  return {
    benchPress: initial.benchPress + benchBonus,
    squat: initial.squat + squatBonus,
    deadlift: initial.deadlift + deadliftBonus,
  };
}

/**
 * トータルBIG3重量 (kg)
 */
export function calculateBig3Total(rm: Estimated1RM): number {
  return rm.benchPress + rm.squat + rm.deadlift;
}

/**
 * 数値フォーマッター (例: 1,234 または 1.2k, 1.2M)
 */
export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + ' 億';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + ' 万';
  }
  return Math.floor(num).toLocaleString('ja-JP');
}

/**
 * トン数フォーマッター
 */
export function formatTonnage(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} t`;
  }
  return `${Math.round(kg)} kg`;
}
