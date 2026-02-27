import { CellState, GameOutcome, GameState, QutritState } from './types.js';
import { detectWinner } from './WinDetector.js';

const EPSILON = 0.001;

interface CellOption {
  state: CellState;
  probability: number;
}

/**
 * Get the possible outcomes for a cell, sorted by probability descending.
 * Each cell can collapse to X, O, or empty.
 */
function getCellOptions(cell: QutritState): CellOption[] {
  const options: CellOption[] = [];

  if (cell.probX > EPSILON) {
    options.push({ state: 'X', probability: cell.probX });
  }
  if (cell.probO > EPSILON) {
    options.push({ state: 'O', probability: cell.probO });
  }
  if (cell.probEmpty > EPSILON) {
    options.push({ state: 'empty', probability: cell.probEmpty });
  }

  // If no options have significant probability, handle edge case
  if (options.length === 0) {
    // Normalize and pick the highest
    const total = cell.probX + cell.probO + cell.probEmpty;
    if (total > 0) {
      if (cell.probX >= cell.probO && cell.probX >= cell.probEmpty) {
        options.push({ state: 'X', probability: 1.0 });
      } else if (cell.probO >= cell.probX && cell.probO >= cell.probEmpty) {
        options.push({ state: 'O', probability: 1.0 });
      } else {
        options.push({ state: 'empty', probability: 1.0 });
      }
    } else {
      options.push({ state: 'empty', probability: 1.0 });
    }
  }

  // Sort by probability descending
  options.sort((a, b) => b.probability - a.probability);

  return options;
}

/**
 * Encode an outcome as a string key for deduplication.
 */
function outcomeKey(board: CellState[]): string {
  return board.join(',');
}

/**
 * A max-heap based on probability.
 */
class MaxHeap {
  private heap: { board: CellState[]; probability: number; indices: number[] }[] = [];

  push(item: { board: CellState[]; probability: number; indices: number[] }): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { board: CellState[]; probability: number; indices: number[] } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[i].probability > this.heap[parent].probability) {
        [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
        i = parent;
      } else {
        break;
      }
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.heap[left].probability > this.heap[largest].probability) {
        largest = left;
      }
      if (right < n && this.heap[right].probability > this.heap[largest].probability) {
        largest = right;
      }

      if (largest !== i) {
        [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
        i = largest;
      } else {
        break;
      }
    }
  }
}

/**
 * Calculate the top most probable outcomes for the current board state.
 * Uses a priority-queue (max-heap) approach:
 * 1. Start with the most likely outcome (each cell takes its highest-probability state).
 * 2. Pop the most probable outcome, generate variants by changing one cell to its
 *    next-most-likely state.
 * 3. Track visited outcomes to avoid duplicates.
 * 4. Stop after finding maxOutcomes outcomes.
 */
export function calculateTopOutcomes(
  game: GameState,
  maxOutcomes: number = 64
): GameOutcome[] {
  const numCells = game.board.length;
  const cellOptions: CellOption[][] = game.board.map((cell) => getCellOptions(cell));

  // Start with the most likely outcome: each cell takes index 0 (highest probability)
  const initialIndices = new Array(numCells).fill(0);
  const initialBoard: CellState[] = initialIndices.map(
    (idx, cellIdx) => cellOptions[cellIdx][idx].state
  );
  const initialProbability = initialIndices.reduce(
    (prob, idx, cellIdx) => prob * cellOptions[cellIdx][idx].probability,
    1.0
  );

  const visited = new Set<string>();
  const results: GameOutcome[] = [];
  const heap = new MaxHeap();

  const initKey = outcomeKey(initialBoard);
  visited.add(initKey);
  heap.push({
    board: initialBoard,
    probability: initialProbability,
    indices: initialIndices,
  });

  while (heap.size > 0 && results.length < maxOutcomes) {
    const current = heap.pop()!;

    // Skip outcomes with negligible probability
    if (current.probability < 1e-12) {
      break;
    }

    const winner = detectWinner(current.board, game.size);
    results.push({
      board: [...current.board],
      probability: current.probability,
      winner,
    });

    // Generate variants: for each cell, try the next option
    for (let cellIdx = 0; cellIdx < numCells; cellIdx++) {
      const currentOptionIdx = current.indices[cellIdx];
      const nextOptionIdx = currentOptionIdx + 1;

      if (nextOptionIdx < cellOptions[cellIdx].length) {
        const newIndices = [...current.indices];
        newIndices[cellIdx] = nextOptionIdx;

        const newBoard: CellState[] = newIndices.map(
          (idx, ci) => cellOptions[ci][idx].state
        );
        const key = outcomeKey(newBoard);

        if (!visited.has(key)) {
          visited.add(key);

          const newProbability = newIndices.reduce(
            (prob, idx, ci) => prob * cellOptions[ci][idx].probability,
            1.0
          );

          heap.push({
            board: newBoard,
            probability: newProbability,
            indices: newIndices,
          });
        }
      }
    }
  }

  // Sort by probability descending
  results.sort((a, b) => b.probability - a.probability);

  return results;
}
