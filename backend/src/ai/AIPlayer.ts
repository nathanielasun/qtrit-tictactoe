import {
  AIConfig,
  BoardSize,
  GameState,
  Move,
  Player,
} from '../engine/types.js';
import { getValidMoves, makeMove, ValidCell } from '../engine/GameState.js';
import { calculateTopOutcomes } from '../engine/OutcomeCalculator.js';

const EPSILON = 0.001;

/**
 * Evaluate a game state from the AI player's perspective.
 * Returns a score between -1.0 (losing) and 1.0 (winning).
 */
function evaluatePosition(game: GameState, aiPlayer: Player): number {
  const outcomes = calculateTopOutcomes(game, 32);

  if (outcomes.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let totalProbability = 0;

  for (const outcome of outcomes) {
    let score: number;
    if (outcome.winner === aiPlayer) {
      score = 1.0;
    } else if (outcome.winner === 'draw' || outcome.winner === null) {
      score = 0.0;
    } else {
      score = -1.0;
    }
    totalScore += score * outcome.probability;
    totalProbability += outcome.probability;
  }

  if (totalProbability > 0) {
    return totalScore / totalProbability;
  }

  return 0;
}

/**
 * Get center cell indices for a given board size.
 */
function getCenterCells(size: BoardSize): number[] {
  if (size === 2) {
    return [0, 1, 2, 3]; // All cells are equally central on 2x2
  }
  if (size === 3) {
    return [4]; // Center of 3x3
  }
  // size === 4
  return [5, 6, 9, 10]; // Inner 2x2 of 4x4
}

/**
 * Get corner cell indices for a given board size.
 */
function getCornerCells(size: BoardSize): number[] {
  if (size === 2) {
    return [0, 1, 2, 3];
  }
  if (size === 3) {
    return [0, 2, 6, 8];
  }
  // size === 4
  return [0, 3, 12, 15];
}

/**
 * Generate all possible classical moves for the current player.
 */
function generateClassicalMoves(
  game: GameState,
  validCells: ValidCell[]
): Move[] {
  const moves: Move[] = [];
  for (const cell of validCells) {
    // Classical move requires the cell to be entirely empty
    if (cell.probEmpty >= 1.0 - EPSILON) {
      moves.push({
        type: 'classical',
        player: game.currentPlayer,
        square: cell.index,
      });
    }
  }
  return moves;
}

/**
 * Check whether a valid 2-square split exists among the valid cells.
 */
function canDoTwoSquareSplit(validCells: ValidCell[]): boolean {
  for (let i = 0; i < validCells.length; i++) {
    for (let j = i + 1; j < validCells.length; j++) {
      if (validCells[i].probEmpty + validCells[j].probEmpty >= 1.0 - EPSILON) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generate a multi-square split that distributes 1 unit across all cells
 * with remaining empty probability. Used when 2-square splits are impossible.
 */
function generateMultiSplit(
  game: GameState,
  validCells: ValidCell[]
): Move | null {
  if (validCells.length < 2) return null;

  // Fill each cell up to its capacity, distributing 1 unit total
  const allocations: { square: number; prob: number }[] = [];
  let remaining = 1.0;

  for (const cell of validCells) {
    if (remaining <= EPSILON) break;
    const amount = Math.min(cell.probEmpty, remaining);
    if (amount > EPSILON) {
      allocations.push({ square: cell.index, prob: amount });
      remaining -= amount;
    }
  }

  if (allocations.length < 2 || remaining > EPSILON) return null;

  return {
    type: 'split',
    player: game.currentPlayer,
    allocations,
  };
}

/**
 * Generate a set of candidate split moves for the current player.
 * Tries representative 2-square splits first. If no 2-square split is feasible,
 * falls back to multi-square splits.
 */
function generateSplitMoves(
  game: GameState,
  validCells: ValidCell[]
): Move[] {
  const moves: Move[] = [];

  if (validCells.length < 2) {
    return moves;
  }

  // Check if any 2-square split is possible
  const twoSquareFeasible = canDoTwoSquareSplit(validCells);

  if (!twoSquareFeasible) {
    // Must do a multi-square split
    const multiSplit = generateMultiSplit(game, validCells);
    if (multiSplit) moves.push(multiSplit);
    return moves;
  }

  const splitRatios = [0.5, 0.7, 0.3, 0.8, 0.2, 0.9, 0.1];

  // Limit combinations to keep computation tractable
  const maxPairs = Math.min(validCells.length, 6);

  for (let i = 0; i < maxPairs; i++) {
    for (let j = i + 1; j < maxPairs; j++) {
      const cell1 = validCells[i];
      const cell2 = validCells[j];

      // Skip pairs that can't hold 1 unit total
      if (cell1.probEmpty + cell2.probEmpty < 1.0 - EPSILON) continue;

      for (const ratio of splitRatios) {
        const prob1 = Math.min(ratio, cell1.probEmpty);
        const prob2 = 1.0 - prob1;

        if (prob2 <= cell2.probEmpty + EPSILON && prob1 > EPSILON && prob2 > EPSILON) {
          moves.push({
            type: 'split',
            player: game.currentPlayer,
            allocations: [
              { square: cell1.index, prob: prob1 },
              { square: cell2.index, prob: prob2 },
            ],
          });
        }

        // Also try the reverse assignment
        const prob2r = Math.min(ratio, cell2.probEmpty);
        const prob1r = 1.0 - prob2r;

        if (prob1r <= cell1.probEmpty + EPSILON && prob1r > EPSILON && prob2r > EPSILON) {
          moves.push({
            type: 'split',
            player: game.currentPlayer,
            allocations: [
              { square: cell1.index, prob: prob1r },
              { square: cell2.index, prob: prob2r },
            ],
          });
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueMoves: Move[] = [];
  for (const move of moves) {
    if (move.type === 'split') {
      const key = move.allocations
        .map((a) => `${a.square}:${a.prob.toFixed(3)}`)
        .join(',');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMoves.push(move);
      }
    }
  }

  return uniqueMoves;
}

/**
 * Generate a random valid move.
 */
function generateRandomMove(game: GameState): Move | null {
  const validCells = getValidMoves(game);

  if (validCells.length === 0) {
    return null;
  }

  // 50% chance of classical move if possible
  const classicalCandidates = validCells.filter(
    (c) => c.probEmpty >= 1.0 - EPSILON
  );

  if (classicalCandidates.length > 0 && Math.random() < 0.5) {
    const cell =
      classicalCandidates[
        Math.floor(Math.random() * classicalCandidates.length)
      ];
    return {
      type: 'classical',
      player: game.currentPlayer,
      square: cell.index,
    };
  }

  // Try a 2-square split first
  if (validCells.length >= 2 && canDoTwoSquareSplit(validCells)) {
    // Find a feasible pair
    for (let attempt = 0; attempt < 10; attempt++) {
      const idx1 = Math.floor(Math.random() * validCells.length);
      let idx2 = Math.floor(Math.random() * (validCells.length - 1));
      if (idx2 >= idx1) idx2++;

      const cell1 = validCells[idx1];
      const cell2 = validCells[idx2];

      if (cell1.probEmpty + cell2.probEmpty < 1.0 - EPSILON) continue;

      const maxProb1 = Math.min(cell1.probEmpty, 1.0);
      const minProb1 = Math.max(1.0 - cell2.probEmpty, 0.0);

      if (maxProb1 >= minProb1 + EPSILON) {
        const prob1 = minProb1 + Math.random() * (maxProb1 - minProb1);
        const prob2 = 1.0 - prob1;

        if (prob1 > EPSILON && prob2 > EPSILON) {
          return {
            type: 'split',
            player: game.currentPlayer,
            allocations: [
              { square: cell1.index, prob: prob1 },
              { square: cell2.index, prob: prob2 },
            ],
          };
        }
      }
    }
  }

  // Fallback to classical move
  if (classicalCandidates.length > 0) {
    const cell =
      classicalCandidates[
        Math.floor(Math.random() * classicalCandidates.length)
      ];
    return {
      type: 'classical',
      player: game.currentPlayer,
      square: cell.index,
    };
  }

  // Last fallback: multi-square split
  return generateMultiSplit(game, validCells);
}

/**
 * Heuristic scoring for a move without full evaluation.
 * Used to quickly prioritize moves before deeper evaluation.
 */
function heuristicScore(
  game: GameState,
  move: Move,
  aiPlayer: Player
): number {
  let score = 0;
  const size = game.size;

  const centerCells = getCenterCells(size);
  const cornerCells = getCornerCells(size);

  if (move.type === 'classical') {
    // Classical moves are strong: full control of a cell
    score += 0.3;

    if (centerCells.includes(move.square)) {
      score += 0.2;
    }
    if (cornerCells.includes(move.square)) {
      score += 0.1;
    }
  } else {
    // Split moves: prefer center/corner targets
    for (const alloc of move.allocations) {
      if (centerCells.includes(alloc.square)) {
        score += 0.15 / move.allocations.length;
      }
      if (cornerCells.includes(alloc.square)) {
        score += 0.05 / move.allocations.length;
      }
    }

    // Prefer more uneven splits (stronger commitment) — only for 2-target
    if (move.allocations.length === 2) {
      const unevenness = Math.abs(move.allocations[0].prob - move.allocations[1].prob);
      score += unevenness * 0.1;
    }
  }

  // Check if this move puts probability in cells where the opponent is strong
  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';

  if (move.type === 'classical') {
    const cell = game.board[move.square];
    const oppProb =
      opponent === 'X' ? cell.probX : cell.probO;
    // Blocking: if opponent has probability here, classical move overrides cell
    if (oppProb > 0.3) {
      score += 0.2;
    }
  } else {
    // For split moves, check if we're contesting opponent cells
    for (const alloc of move.allocations) {
      const cell = game.board[alloc.square];
      const oppProb = opponent === 'X' ? cell.probX : cell.probO;
      if (oppProb > 0.3) {
        score += 0.1 / move.allocations.length;
      }
    }
  }

  return score;
}

/**
 * Main AI move selection function.
 */
export function getAIMove(game: GameState, config: AIConfig): Move | null {
  if (game.gamePhase !== 'playing') {
    return null;
  }

  const aiPlayer = game.currentPlayer;
  const validCells = getValidMoves(game);

  if (validCells.length === 0) {
    return null;
  }

  // Exploration: with probability = explorationRate, make a random move
  if (Math.random() < config.explorationRate) {
    return generateRandomMove(game);
  }

  // Generate candidate moves
  const classicalMoves = generateClassicalMoves(game, validCells);
  const splitMoves = generateSplitMoves(game, validCells);
  const allMoves = [...classicalMoves, ...splitMoves];

  if (allMoves.length === 0) {
    return generateRandomMove(game);
  }

  // First pass: heuristic scoring to select top candidates
  const scoredMoves = allMoves.map((move) => ({
    move,
    heuristicScore: heuristicScore(game, move, aiPlayer),
  }));

  scoredMoves.sort((a, b) => b.heuristicScore - a.heuristicScore);

  // Take the top N candidates for deeper evaluation
  const topN = Math.min(scoredMoves.length, 12);
  const candidates = scoredMoves.slice(0, topN);

  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    try {
      const newGameState = makeMove(game, candidate.move);
      const positionScore = evaluatePosition(newGameState, aiPlayer);

      // Combine position evaluation with heuristic
      const totalScore = positionScore * 0.7 + candidate.heuristicScore * 0.3;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = candidate.move;
      }
    } catch {
      // If the move is invalid for some reason, skip it
      continue;
    }
  }

  if (bestMove === null) {
    return generateRandomMove(game);
  }

  return bestMove;
}

/**
 * Generate a random valid move (exported for use in training).
 */
export function getRandomMove(game: GameState): Move | null {
  return generateRandomMove(game);
}
