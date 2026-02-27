import {
  AIStats,
  Move,
  Player,
  TrainingStats,
} from '../engine/types.js';

interface GameRecord {
  moves: Move[];
  winner: Player | 'draw' | null;
  aiPlayer: Player;
  timestamp: number;
}

interface PatternInfo {
  pattern: string;
  frequency: number;
  winRate: number;
  description: string;
}

// Singleton in-memory strategy database
let gameRecords: GameRecord[] = [];
let totalWins = 0;
let totalLosses = 0;
let totalDraws = 0;
let trainingHistory: TrainingStats[] = [];

export function recordGame(
  moves: Move[],
  winner: Player | 'draw' | null,
  aiPlayer: Player
): void {
  gameRecords.push({
    moves: [...moves],
    winner,
    aiPlayer,
    timestamp: Date.now(),
  });

  if (winner === aiPlayer) {
    totalWins++;
  } else if (winner === 'draw' || winner === null) {
    totalDraws++;
  } else {
    totalLosses++;
  }
}

export function getPatterns(): PatternInfo[] {
  const patterns: PatternInfo[] = [];

  if (gameRecords.length === 0) {
    return patterns;
  }

  // Analyze opening moves by the opponent
  const openingMoves: Map<string, { count: number; aiWins: number }> = new Map();

  for (const record of gameRecords) {
    // Find opponent moves
    const opponentMoves = record.moves.filter(
      (m) => m.player !== record.aiPlayer
    );

    if (opponentMoves.length > 0) {
      const firstMove = opponentMoves[0];
      let key: string;
      if (firstMove.type === 'classical') {
        key = `classical-${firstMove.square}`;
      } else {
        const sqs = firstMove.allocations.map((a) => a.square).sort().join('-');
        key = `split-${sqs}`;
      }

      const existing = openingMoves.get(key) || { count: 0, aiWins: 0 };
      existing.count++;
      if (record.winner === record.aiPlayer) {
        existing.aiWins++;
      }
      openingMoves.set(key, existing);
    }
  }

  for (const [key, data] of openingMoves) {
    if (data.count >= 2) {
      patterns.push({
        pattern: `opponent_opening_${key}`,
        frequency: data.count,
        winRate: data.count > 0 ? data.aiWins / data.count : 0,
        description: `Opponent opens with ${key}. AI win rate: ${((data.aiWins / data.count) * 100).toFixed(1)}%`,
      });
    }
  }

  // Analyze split move effectiveness
  const splitStats: Map<string, { count: number; wins: number }> = new Map();

  for (const record of gameRecords) {
    const aiSplitMoves = record.moves.filter(
      (m) => m.player === record.aiPlayer && m.type === 'split'
    );

    for (const move of aiSplitMoves) {
      if (move.type === 'split') {
        // Categorize split ratio (sorted descending by prob)
        const sortedProbs = move.allocations
          .map((a) => a.prob)
          .sort((a, b) => b - a);
        const ratio = sortedProbs
          .map((p) => `${(p * 100).toFixed(0)}`)
          .join('/');

        const existing = splitStats.get(ratio) || { count: 0, wins: 0 };
        existing.count++;
        if (record.winner === record.aiPlayer) {
          existing.wins++;
        }
        splitStats.set(ratio, existing);
      }
    }
  }

  for (const [ratio, data] of splitStats) {
    if (data.count >= 3) {
      patterns.push({
        pattern: `ai_split_ratio_${ratio}`,
        frequency: data.count,
        winRate: data.count > 0 ? data.wins / data.count : 0,
        description: `AI uses ${ratio} split. Win rate: ${((data.wins / data.count) * 100).toFixed(1)}%`,
      });
    }
  }

  // Analyze counter-strategies: what AI did after opponent's common moves
  const counterStrategies: Map<string, { count: number; wins: number }> = new Map();

  for (const record of gameRecords) {
    for (let i = 0; i < record.moves.length - 1; i++) {
      const oppMove = record.moves[i];
      const aiResponse = record.moves[i + 1];

      if (
        oppMove.player !== record.aiPlayer &&
        aiResponse.player === record.aiPlayer
      ) {
        let oppKey: string;
        if (oppMove.type === 'classical') {
          oppKey = `opp_c${oppMove.square}`;
        } else {
          const sqs = oppMove.allocations.map((a) => a.square).sort().join('_');
          oppKey = `opp_s${sqs}`;
        }

        let aiKey: string;
        if (aiResponse.type === 'classical') {
          aiKey = `ai_c${aiResponse.square}`;
        } else {
          const sqs = aiResponse.allocations.map((a) => a.square).sort().join('_');
          aiKey = `ai_s${sqs}`;
        }

        const stratKey = `${oppKey}_then_${aiKey}`;
        const existing = counterStrategies.get(stratKey) || {
          count: 0,
          wins: 0,
        };
        existing.count++;
        if (record.winner === record.aiPlayer) {
          existing.wins++;
        }
        counterStrategies.set(stratKey, existing);
      }
    }
  }

  for (const [stratKey, data] of counterStrategies) {
    if (data.count >= 3) {
      patterns.push({
        pattern: `counter_${stratKey}`,
        frequency: data.count,
        winRate: data.count > 0 ? data.wins / data.count : 0,
        description: `Counter-strategy: ${stratKey}. Win rate: ${((data.wins / data.count) * 100).toFixed(1)}%`,
      });
    }
  }

  // Sort by frequency descending
  patterns.sort((a, b) => b.frequency - a.frequency);

  return patterns;
}

export function getStats(): AIStats {
  return {
    gamesPlayed: gameRecords.length,
    wins: totalWins,
    losses: totalLosses,
    draws: totalDraws,
    trainingHistory: [...trainingHistory],
  };
}

export function addTrainingStats(stats: TrainingStats): void {
  trainingHistory.push(stats);
}

export function reset(): void {
  gameRecords = [];
  totalWins = 0;
  totalLosses = 0;
  totalDraws = 0;
  trainingHistory = [];
}
