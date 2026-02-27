import { BoardSize, CellState, Player } from './types.js';

function getLines(size: BoardSize): number[][] {
  const lines: number[][] = [];

  // Rows
  for (let row = 0; row < size; row++) {
    const line: number[] = [];
    for (let col = 0; col < size; col++) {
      line.push(row * size + col);
    }
    lines.push(line);
  }

  // Columns
  for (let col = 0; col < size; col++) {
    const line: number[] = [];
    for (let row = 0; row < size; row++) {
      line.push(row * size + col);
    }
    lines.push(line);
  }

  // Main diagonal (top-left to bottom-right)
  const mainDiag: number[] = [];
  for (let i = 0; i < size; i++) {
    mainDiag.push(i * size + i);
  }
  lines.push(mainDiag);

  // Anti-diagonal (top-right to bottom-left)
  const antiDiag: number[] = [];
  for (let i = 0; i < size; i++) {
    antiDiag.push(i * size + (size - 1 - i));
  }
  lines.push(antiDiag);

  return lines;
}

function checkLineWinner(
  board: CellState[],
  line: number[]
): Player | null {
  const firstCell = board[line[0]];

  // A winning line cannot contain empty cells
  if (firstCell === 'empty') {
    return null;
  }

  // Check if all cells in the line are the same player
  for (let i = 1; i < line.length; i++) {
    if (board[line[i]] !== firstCell) {
      return null;
    }
  }

  return firstCell as Player;
}

export function detectWinner(
  board: CellState[],
  size: BoardSize
): Player | 'draw' | null {
  const lines = getLines(size);

  let xWins = false;
  let oWins = false;

  for (const line of lines) {
    const winner = checkLineWinner(board, line);
    if (winner === 'X') {
      xWins = true;
    } else if (winner === 'O') {
      oWins = true;
    }
  }

  if (xWins && oWins) {
    return 'draw';
  }
  if (xWins) {
    return 'X';
  }
  if (oWins) {
    return 'O';
  }
  // Neither has a winning line
  return 'draw';
}
