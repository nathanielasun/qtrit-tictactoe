import {
  AIConfig,
  BoardSize,
  GameState,
  Move,
  Player,
  TrainingStats,
} from '../engine/types.js';
import { createGame, makeMove } from '../engine/GameState.js';
import { collapseBoard } from '../engine/Collapse.js';
import { getAIMove, getRandomMove } from './AIPlayer.js';
import { addTrainingStats, getStats, recordGame } from './StrategyDB.js';

/**
 * Play a single game of AI vs random player.
 * Returns the completed game state and moves.
 */
function playAIvsRandom(
  config: AIConfig,
  size: BoardSize,
  aiPlayer: Player
): { game: GameState; moves: Move[] } {
  let game = createGame(size, 'pva', aiPlayer);
  const allMoves: Move[] = [];

  while (game.gamePhase === 'playing') {
    let move: Move | null;

    if (game.currentPlayer === aiPlayer) {
      move = getAIMove(game, config);
    } else {
      move = getRandomMove(game);
    }

    if (move === null) {
      // No valid moves available, break
      break;
    }

    try {
      game = makeMove(game, move);
      allMoves.push(move);
    } catch {
      // If the move failed, try a random move as fallback
      const fallback = getRandomMove(game);
      if (fallback === null) {
        break;
      }
      try {
        game = makeMove(game, fallback);
        allMoves.push(fallback);
      } catch {
        // Truly stuck, break
        break;
      }
    }
  }

  // Collapse the board if ready
  if (game.gamePhase === 'ready_to_collapse') {
    game = collapseBoard(game);
  }

  return { game, moves: allMoves };
}

/**
 * Play a single game of AI vs AI (self-play).
 */
function playAIvsAI(
  config: AIConfig,
  size: BoardSize
): { game: GameState; moves: Move[] } {
  let game = createGame(size, 'pva', 'X');
  const allMoves: Move[] = [];

  while (game.gamePhase === 'playing') {
    const move = getAIMove(game, config);

    if (move === null) {
      break;
    }

    try {
      game = makeMove(game, move);
      allMoves.push(move);
    } catch {
      const fallback = getRandomMove(game);
      if (fallback === null) {
        break;
      }
      try {
        game = makeMove(game, fallback);
        allMoves.push(fallback);
      } catch {
        break;
      }
    }
  }

  if (game.gamePhase === 'ready_to_collapse') {
    game = collapseBoard(game);
  }

  return { game, moves: allMoves };
}

/**
 * Run a training batch: AI plays numGames against a random player.
 * Records results in the strategy DB.
 * Returns training stats for this batch.
 */
export function runTrainingBatch(
  config: AIConfig,
  numGames: number,
  size: BoardSize = 3
): TrainingStats {
  const stats = getStats();
  const epoch = stats.trainingHistory.length + 1;

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalReward = 0;

  for (let i = 0; i < numGames; i++) {
    // Alternate which player the AI is
    const aiPlayer: Player = i % 2 === 0 ? 'X' : 'O';

    const result = playAIvsRandom(config, size, aiPlayer);

    // Record the game
    recordGame(result.moves, result.game.winner ?? null, aiPlayer);

    // Calculate reward
    let reward: number;
    if (result.game.winner === aiPlayer) {
      wins++;
      reward = 1.0;
    } else if (
      result.game.winner === 'draw' ||
      result.game.winner === null
    ) {
      draws++;
      reward = 0.1;
    } else {
      losses++;
      reward = -0.5;
    }

    totalReward += reward;
  }

  const winRate = numGames > 0 ? wins / numGames : 0;
  const avgReward = numGames > 0 ? totalReward / numGames : 0;

  const trainingStats: TrainingStats = {
    epoch,
    winRate,
    avgReward,
    explorationRate: config.explorationRate,
    gamesThisEpoch: numGames,
  };

  addTrainingStats(trainingStats);

  return trainingStats;
}

/**
 * Self-play: AI plays against itself to improve.
 * Runs a batch of self-play games.
 */
export function selfPlay(
  config: AIConfig,
  numGames: number = 10,
  size: BoardSize = 3
): TrainingStats {
  const stats = getStats();
  const epoch = stats.trainingHistory.length + 1;

  let xWins = 0;
  let oWins = 0;
  let draws = 0;
  let totalReward = 0;

  for (let i = 0; i < numGames; i++) {
    const result = playAIvsAI(config, size);

    // In self-play, record from X's perspective
    recordGame(result.moves, result.game.winner ?? null, 'X');

    if (result.game.winner === 'X') {
      xWins++;
      totalReward += 1.0;
    } else if (result.game.winner === 'O') {
      oWins++;
      totalReward += -0.5;
    } else {
      draws++;
      totalReward += 0.1;
    }
  }

  const winRate = numGames > 0 ? xWins / numGames : 0;
  const avgReward = numGames > 0 ? totalReward / numGames : 0;

  const trainingStats: TrainingStats = {
    epoch,
    winRate,
    avgReward,
    explorationRate: config.explorationRate,
    gamesThisEpoch: numGames,
  };

  addTrainingStats(trainingStats);

  return trainingStats;
}
