import { Router, Request, Response } from 'express';
import {
  BoardSize,
  GameMode,
  GameState,
  Move,
  Player,
} from '../engine/types.js';
import { createGame, makeMove } from '../engine/GameState.js';
import { collapseBoard } from '../engine/Collapse.js';
import { calculateTopOutcomes } from '../engine/OutcomeCalculator.js';
import { getAIMove } from '../ai/AIPlayer.js';
import { recordGame } from '../ai/StrategyDB.js';

const router = Router();

// In-memory game store
const games = new Map<string, GameState>();

// Default AI config for game-time AI moves
const defaultAIConfig = {
  learningRate: 0.01,
  explorationRate: 0.1,
  discountFactor: 0.95,
  batchSize: 32,
};

function isValidBoardSize(size: unknown): size is BoardSize {
  return size === 2 || size === 3 || size === 4;
}

function isValidGameMode(mode: unknown): mode is GameMode {
  return mode === 'pvp' || mode === 'pva';
}

function isValidPlayer(player: unknown): player is Player {
  return player === 'X' || player === 'O';
}

/**
 * POST /api/game/new
 * Body: { size: BoardSize, gameMode: GameMode, aiPlayer?: Player }
 * Creates a new game. If PvA and AI goes first, also makes AI's first move.
 */
router.post('/new', (req: Request, res: Response): void => {
  const { size, gameMode, aiPlayer } = req.body;

  if (!isValidBoardSize(size)) {
    res.status(400).json({ error: 'Invalid board size. Must be 2, 3, or 4.' });
    return;
  }

  if (!isValidGameMode(gameMode)) {
    res.status(400).json({ error: 'Invalid game mode. Must be "pvp" or "pva".' });
    return;
  }

  if (gameMode === 'pva' && aiPlayer !== undefined && !isValidPlayer(aiPlayer)) {
    res.status(400).json({ error: 'Invalid AI player. Must be "X" or "O".' });
    return;
  }

  // Determine AI player: use provided or randomly assign
  let resolvedAIPlayer: Player | undefined;
  if (gameMode === 'pva') {
    resolvedAIPlayer = aiPlayer ?? (Math.random() < 0.5 ? 'X' : 'O');
  }

  let game = createGame(size, gameMode, resolvedAIPlayer);

  // If PvA and AI goes first (AI is X), make AI's first move
  if (
    gameMode === 'pva' &&
    resolvedAIPlayer === 'X' &&
    game.gamePhase === 'playing'
  ) {
    const aiMove = getAIMove(game, defaultAIConfig);
    if (aiMove) {
      try {
        game = makeMove(game, aiMove);
      } catch {
        // AI move failed; leave game as-is for the player
      }
    }
  }

  games.set(game.id, game);
  res.json(game);
});

/**
 * POST /api/game/:id/move
 * Body: { move: Move }
 * Applies the player's move. If PvA and it's AI's turn after, also applies AI move.
 */
router.post('/:id/move', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { move: rawMove } = req.body;

  const game = games.get(id);
  if (!game) {
    res.status(404).json({ error: 'Game not found.' });
    return;
  }

  if (game.gamePhase !== 'playing') {
    res.status(400).json({ error: `Cannot make a move. Game phase is '${game.gamePhase}'.` });
    return;
  }

  if (!rawMove || !rawMove.type) {
    res.status(400).json({ error: 'Invalid move format.' });
    return;
  }

  // Inject current player if not provided by the client
  const move: Move = { ...rawMove, player: rawMove.player || game.currentPlayer };

  // Validate it's not the AI's turn (player should not submit moves for the AI)
  if (
    game.gameMode === 'pva' &&
    game.aiPlayer === move.player &&
    move.player === game.currentPlayer
  ) {
    res.status(400).json({ error: "It's the AI's turn. Wait for the AI to move." });
    return;
  }

  try {
    let updatedGame = makeMove(game, move);

    // If PvA and it's now the AI's turn, make the AI move
    if (
      updatedGame.gameMode === 'pva' &&
      updatedGame.gamePhase === 'playing' &&
      updatedGame.currentPlayer === updatedGame.aiPlayer
    ) {
      const aiMove = getAIMove(updatedGame, defaultAIConfig);
      if (aiMove) {
        try {
          updatedGame = makeMove(updatedGame, aiMove);
        } catch {
          // AI move failed; return the state after the player's move
        }
      }
    }

    games.set(id, updatedGame);
    res.json(updatedGame);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/game/:id/collapse
 * Collapses the board and determines the winner.
 */
router.post('/:id/collapse', (req: Request, res: Response): void => {
  const { id } = req.params;

  const game = games.get(id);
  if (!game) {
    res.status(404).json({ error: 'Game not found.' });
    return;
  }

  if (game.gamePhase !== 'ready_to_collapse') {
    res.status(400).json({
      error: `Cannot collapse. Game phase is '${game.gamePhase}'. Must be 'ready_to_collapse'.`,
    });
    return;
  }

  try {
    const collapsedGame = collapseBoard(game);
    games.set(id, collapsedGame);

    // Record game for AI learning if it was a PvA game
    if (collapsedGame.gameMode === 'pva' && collapsedGame.aiPlayer) {
      recordGame(
        collapsedGame.moves,
        collapsedGame.winner ?? null,
        collapsedGame.aiPlayer
      );
    }

    res.json(collapsedGame);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/game/:id
 * Returns the current game state.
 */
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  const game = games.get(id);
  if (!game) {
    res.status(404).json({ error: 'Game not found.' });
    return;
  }

  res.json(game);
});

/**
 * GET /api/game/:id/outcomes
 * Returns the top 64 most probable outcomes.
 */
router.get('/:id/outcomes', (req: Request, res: Response): void => {
  const { id } = req.params;

  const game = games.get(id);
  if (!game) {
    res.status(404).json({ error: 'Game not found.' });
    return;
  }

  if (game.gamePhase === 'collapsed') {
    res.status(400).json({ error: 'Game is already collapsed.' });
    return;
  }

  try {
    const outcomes = calculateTopOutcomes(game, 64);
    res.json({ outcomes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export { router as gameRouter };
