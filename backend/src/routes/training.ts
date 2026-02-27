import { Router, Request, Response } from 'express';
import { AIConfig, BoardSize } from '../engine/types.js';
import { getPatterns, getStats, reset } from '../ai/StrategyDB.js';
import { runTrainingBatch, selfPlay } from '../ai/Trainer.js';

const router = Router();

// Mutable AI configuration
let aiConfig: AIConfig = {
  learningRate: 0.01,
  explorationRate: 0.15,
  discountFactor: 0.95,
  batchSize: 32,
};

/**
 * GET /api/ai/config
 * Returns the current AI configuration.
 */
router.get('/config', (_req: Request, res: Response): void => {
  res.json(aiConfig);
});

/**
 * POST /api/ai/config
 * Body: partial AIConfig
 * Updates the AI configuration and returns the full config.
 */
router.post('/config', (req: Request, res: Response): void => {
  const updates = req.body;

  if (updates.learningRate !== undefined) {
    if (typeof updates.learningRate !== 'number' || updates.learningRate < 0 || updates.learningRate > 1) {
      res.status(400).json({ error: 'learningRate must be a number between 0 and 1.' });
      return;
    }
    aiConfig.learningRate = updates.learningRate;
  }

  if (updates.explorationRate !== undefined) {
    if (typeof updates.explorationRate !== 'number' || updates.explorationRate < 0 || updates.explorationRate > 1) {
      res.status(400).json({ error: 'explorationRate must be a number between 0 and 1.' });
      return;
    }
    aiConfig.explorationRate = updates.explorationRate;
  }

  if (updates.discountFactor !== undefined) {
    if (typeof updates.discountFactor !== 'number' || updates.discountFactor < 0 || updates.discountFactor > 1) {
      res.status(400).json({ error: 'discountFactor must be a number between 0 and 1.' });
      return;
    }
    aiConfig.discountFactor = updates.discountFactor;
  }

  if (updates.batchSize !== undefined) {
    if (typeof updates.batchSize !== 'number' || updates.batchSize < 1 || !Number.isInteger(updates.batchSize)) {
      res.status(400).json({ error: 'batchSize must be a positive integer.' });
      return;
    }
    aiConfig.batchSize = updates.batchSize;
  }

  res.json(aiConfig);
});

/**
 * POST /api/ai/train
 * Body: { numGames: number, size?: BoardSize, mode?: 'random' | 'self' }
 * Runs a training batch and returns training stats.
 */
router.post('/train', (req: Request, res: Response): void => {
  const { numGames, size, mode } = req.body;

  if (!numGames || typeof numGames !== 'number' || numGames < 1) {
    res.status(400).json({ error: 'numGames must be a positive number.' });
    return;
  }

  if (numGames > 1000) {
    res.status(400).json({ error: 'numGames cannot exceed 1000 per batch.' });
    return;
  }

  const boardSize: BoardSize = (size === 2 || size === 3 || size === 4) ? size : 3;

  try {
    if (mode === 'self') {
      selfPlay(aiConfig, numGames, boardSize);
    } else {
      runTrainingBatch(aiConfig, numGames, boardSize);
    }
    const allStats = getStats();
    res.json({
      message: `Completed ${numGames} training games on ${boardSize}x${boardSize} board.`,
      stats: allStats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/ai/stats
 * Returns AI statistics including training history.
 */
router.get('/stats', (_req: Request, res: Response): void => {
  const stats = getStats();
  res.json(stats);
});

/**
 * GET /api/ai/patterns
 * Returns learned patterns from past games.
 */
router.get('/patterns', (_req: Request, res: Response): void => {
  const patterns = getPatterns();
  res.json({ patterns });
});

/**
 * POST /api/ai/reset
 * Resets the strategy database.
 */
router.post('/reset', (_req: Request, res: Response): void => {
  reset();
  res.json({ message: 'Strategy database reset successfully.' });
});

export { router as trainingRouter };
