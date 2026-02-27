import { CellState, GameState } from './types.js';
import { detectWinner } from './WinDetector.js';

const EPSILON = 0.001;

export function collapseBoard(game: GameState): GameState {
  if (game.gamePhase !== 'ready_to_collapse') {
    throw new Error(
      `Cannot collapse board in game phase '${game.gamePhase}'. Game must be in 'ready_to_collapse' phase.`
    );
  }

  const collapsedBoard: CellState[] = [];

  for (let i = 0; i < game.board.length; i++) {
    const cell = game.board[i];

    // If probEmpty is effectively 0, only consider X and O
    const effectiveProbEmpty = cell.probEmpty < EPSILON ? 0 : cell.probEmpty;
    const totalNonEmpty = cell.probX + cell.probO;

    let probX: number;
    let probO: number;

    if (effectiveProbEmpty < EPSILON && totalNonEmpty > EPSILON) {
      // Normalize X and O probabilities to sum to 1
      probX = cell.probX / totalNonEmpty;
      probO = cell.probO / totalNonEmpty;
    } else {
      probX = cell.probX;
      probO = cell.probO;
    }

    const rand = Math.random();

    if (rand < probX) {
      collapsedBoard.push('X');
    } else if (rand < probX + probO) {
      collapsedBoard.push('O');
    } else {
      collapsedBoard.push('empty');
    }
  }

  const winner = detectWinner(collapsedBoard, game.size);

  const newGame: GameState = {
    ...game,
    board: game.board.map((cell) => ({ ...cell })),
    moves: [...game.moves],
    gamePhase: 'collapsed',
    collapsedBoard,
    winner,
  };

  return newGame;
}
