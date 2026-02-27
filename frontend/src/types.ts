export type Player = 'X' | 'O';
export type CellState = 'X' | 'O' | 'empty';
export type BoardSize = 2 | 3 | 4;
export type GameMode = 'pvp' | 'pva';
export type GamePhase = 'setup' | 'playing' | 'ready_to_collapse' | 'collapsed';

export interface QutritState {
  probEmpty: number;
  probO: number;
  probX: number;
}

export interface ClassicalMove {
  type: 'classical';
  player: Player;
  square: number;
}

export interface Allocation {
  square: number;
  prob: number;
}

export interface SplitMove {
  type: 'split';
  player: Player;
  allocations: Allocation[];
}

export type Move = ClassicalMove | SplitMove;

export interface GameState {
  id: string;
  board: QutritState[];
  size: BoardSize;
  currentPlayer: Player;
  movesPlayed: number;
  totalMoves: number;
  gamePhase: GamePhase;
  moves: Move[];
  gameMode: GameMode;
  aiPlayer?: Player;
  collapsedBoard?: CellState[];
  winner?: Player | 'draw' | null;
}

export interface GameOutcome {
  board: CellState[];
  probability: number;
  winner: Player | 'draw' | null;
}

export interface CircuitGate {
  type: 'classical' | 'split';
  player: Player;
  targets: number[];
  params?: { allocations: Allocation[] };
  moveIndex: number;
}

export interface AIConfig {
  learningRate: number;
  explorationRate: number;
  discountFactor: number;
  batchSize: number;
}

export interface AIStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  trainingHistory: TrainingStats[];
}

export interface TrainingStats {
  epoch: number;
  winRate: number;
  avgReward: number;
  explorationRate: number;
  gamesThisEpoch: number;
}
