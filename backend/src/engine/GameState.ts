import { v4 as uuidv4 } from 'uuid';
import {
  BoardSize,
  ClassicalMove,
  GameMode,
  GamePhase,
  GameState,
  Move,
  Player,
  QutritState,
  SplitMove,
} from './types.js';

const EPSILON = 0.001;

function createInitialBoard(size: BoardSize): QutritState[] {
  const numCells = size * size;
  const board: QutritState[] = [];
  for (let i = 0; i < numCells; i++) {
    board.push({ probEmpty: 1.0, probO: 0.0, probX: 0.0 });
  }
  return board;
}

export function createGame(
  size: BoardSize,
  gameMode: GameMode,
  aiPlayer?: Player
): GameState {
  const id = uuidv4();
  const totalMoves = size * size;

  const game: GameState = {
    id,
    board: createInitialBoard(size),
    size,
    currentPlayer: 'X',
    movesPlayed: 0,
    totalMoves,
    gamePhase: 'playing',
    moves: [],
    gameMode,
    aiPlayer,
  };

  return game;
}

function validateSquareIndex(square: number, size: BoardSize): void {
  const numCells = size * size;
  if (square < 0 || square >= numCells || !Number.isInteger(square)) {
    throw new Error(
      `Invalid square index ${square}. Must be between 0 and ${numCells - 1}.`
    );
  }
}

function validateClassicalMove(game: GameState, move: ClassicalMove): void {
  validateSquareIndex(move.square, game.size);

  const cell = game.board[move.square];
  if (cell.probEmpty < 1.0 - EPSILON) {
    throw new Error(
      `Classical move requires an entirely empty cell. Cell ${move.square} has probEmpty=${cell.probEmpty}.`
    );
  }
}

function validateSplitMove(game: GameState, move: SplitMove): void {
  if (!move.allocations || move.allocations.length < 2) {
    throw new Error('Split move requires at least 2 target squares.');
  }

  // Check for duplicate squares
  const squares = new Set<number>();
  for (const alloc of move.allocations) {
    validateSquareIndex(alloc.square, game.size);
    if (squares.has(alloc.square)) {
      throw new Error(`Duplicate square ${alloc.square} in split move.`);
    }
    squares.add(alloc.square);
  }

  // Probabilities must sum to 1
  const totalProb = move.allocations.reduce((sum, a) => sum + a.prob, 0);
  if (Math.abs(totalProb - 1.0) > EPSILON) {
    throw new Error(
      `Split move probabilities must sum to 1. Got ${totalProb.toFixed(4)}.`
    );
  }

  // Each probability must be non-negative
  for (const alloc of move.allocations) {
    if (alloc.prob < -EPSILON) {
      throw new Error(
        `Split move probability must be non-negative. Got ${alloc.prob} for square ${alloc.square}.`
      );
    }
  }

  // Each allocation must not exceed available empty probability
  for (const alloc of move.allocations) {
    const cell = game.board[alloc.square];
    if (alloc.prob > cell.probEmpty + EPSILON) {
      throw new Error(
        `Split amount ${alloc.prob.toFixed(3)} exceeds available empty probability ${cell.probEmpty.toFixed(3)} in cell ${alloc.square}.`
      );
    }
  }
}

export function makeMove(game: GameState, move: Move): GameState {
  if (game.gamePhase !== 'playing') {
    throw new Error(
      `Cannot make a move in game phase '${game.gamePhase}'. Game must be in 'playing' phase.`
    );
  }

  if (move.player !== game.currentPlayer) {
    throw new Error(
      `It is ${game.currentPlayer}'s turn, but received move from ${move.player}.`
    );
  }

  // Deep clone the game state
  const newGame: GameState = {
    ...game,
    board: game.board.map((cell) => ({ ...cell })),
    moves: [...game.moves],
  };

  if (move.type === 'classical') {
    validateClassicalMove(newGame, move);

    const cell = newGame.board[move.square];
    if (move.player === 'X') {
      cell.probX = 1.0;
    } else {
      cell.probO = 1.0;
    }
    cell.probEmpty = 0.0;
  } else if (move.type === 'split') {
    validateSplitMove(newGame, move);

    for (const alloc of move.allocations) {
      const cell = newGame.board[alloc.square];
      if (move.player === 'X') {
        cell.probX += alloc.prob;
      } else {
        cell.probO += alloc.prob;
      }
      cell.probEmpty -= alloc.prob;

      // Clamp to avoid floating point issues
      cell.probEmpty = Math.max(0, cell.probEmpty);
      cell.probX = Math.min(1, Math.max(0, cell.probX));
      cell.probO = Math.min(1, Math.max(0, cell.probO));
    }
  } else {
    throw new Error(`Unknown move type.`);
  }

  newGame.moves.push(move);
  newGame.movesPlayed += 1;
  newGame.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

  if (newGame.movesPlayed >= newGame.totalMoves) {
    newGame.gamePhase = 'ready_to_collapse';
  }

  return newGame;
}

export interface ValidCell {
  index: number;
  probEmpty: number;
}

export function getValidMoves(game: GameState): ValidCell[] {
  const validCells: ValidCell[] = [];
  for (let i = 0; i < game.board.length; i++) {
    if (game.board[i].probEmpty > EPSILON) {
      validCells.push({
        index: i,
        probEmpty: game.board[i].probEmpty,
      });
    }
  }
  return validCells;
}
