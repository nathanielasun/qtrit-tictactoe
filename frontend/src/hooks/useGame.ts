import { useState, useCallback, useEffect } from 'react';
import type {
  GameState,
  GameOutcome,
  BoardSize,
  GameMode,
  Player,
  Allocation,
} from '../types';
import * as api from '../api';

export interface UseGameReturn {
  game: GameState | null;
  outcomes: GameOutcome[];
  loading: boolean;
  error: string | null;
  selectedSquares: number[];
  moveMode: 'classical' | 'split';
  showSplitModal: boolean;
  splitSquares: number[];
  startGame: (size: BoardSize, gameMode: GameMode, aiPlayer?: Player) => Promise<void>;
  handleSquareClick: (index: number) => void;
  confirmSplitSelection: () => void;
  makeSplitMove: (allocations: Allocation[]) => Promise<void>;
  collapse: () => Promise<void>;
  setMoveMode: (mode: 'classical' | 'split') => void;
  closeSplitModal: () => void;
  clearSelection: () => void;
  clearError: () => void;
}

export function useGame(): UseGameReturn {
  const [game, setGame] = useState<GameState | null>(null);
  const [outcomes, setOutcomes] = useState<GameOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSquares, setSelectedSquares] = useState<number[]>([]);
  const [moveMode, setMoveMode] = useState<'classical' | 'split'>('classical');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitSquares, setSplitSquares] = useState<number[]>([]);

  const fetchOutcomes = useCallback(async (gameId: string) => {
    try {
      const data = await api.getOutcomes(gameId);
      setOutcomes(data);
    } catch {
      // Outcomes may not be available yet - that's okay
    }
  }, []);

  useEffect(() => {
    if (game && game.gamePhase !== 'setup' && game.movesPlayed > 0) {
      fetchOutcomes(game.id);
    }
  }, [game, fetchOutcomes]);

  const startGame = useCallback(
    async (size: BoardSize, gameMode: GameMode, aiPlayer?: Player) => {
      setLoading(true);
      setError(null);
      setOutcomes([]);
      setSelectedSquares([]);
      setMoveMode('classical');
      setShowSplitModal(false);
      setSplitSquares([]);
      try {
        const newGame = await api.createGame(size, gameMode, aiPlayer);
        setGame(newGame);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create game');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSquareClick = useCallback(
    (index: number) => {
      if (!game || game.gamePhase !== 'playing') return;

      // In PvA mode, don't allow clicks when it's the AI's turn
      if (game.gameMode === 'pva' && game.currentPlayer === game.aiPlayer) return;

      const cell = game.board[index];

      if (moveMode === 'classical') {
        // Classical move: cell must have enough empty probability (full 1.0)
        if (cell.probEmpty < 0.999) {
          setError('This cell does not have enough empty probability for a classical move.');
          return;
        }
        setLoading(true);
        setError(null);
        api
          .makeMove(game.id, { type: 'classical', square: index })
          .then((updatedGame) => {
            setGame(updatedGame);
            setSelectedSquares([]);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Move failed');
          })
          .finally(() => setLoading(false));
      } else {
        // Split mode: select multiple squares
        if (cell.probEmpty < 0.001) {
          setError('This cell has no empty probability remaining.');
          return;
        }

        setSelectedSquares((prev) => {
          if (prev.includes(index)) {
            // Deselect
            return prev.filter((i) => i !== index);
          }
          return [...prev, index];
        });
        setError(null);
      }
    },
    [game, moveMode]
  );

  const confirmSplitSelection = useCallback(() => {
    if (selectedSquares.length < 2) {
      setError('Select at least 2 squares for a split move.');
      return;
    }
    setSplitSquares([...selectedSquares]);
    setShowSplitModal(true);
    setError(null);
  }, [selectedSquares]);

  const makeSplitMove = useCallback(
    async (allocations: Allocation[]) => {
      if (!game) return;
      setLoading(true);
      setError(null);
      setShowSplitModal(false);
      setSplitSquares([]);
      setSelectedSquares([]);
      try {
        const roundedAllocations = allocations.map((a) => ({
          square: a.square,
          prob: Math.round(a.prob * 1000) / 1000,
        }));
        const updatedGame = await api.makeMove(game.id, {
          type: 'split',
          allocations: roundedAllocations,
        });
        setGame(updatedGame);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Split move failed');
      } finally {
        setLoading(false);
      }
    },
    [game]
  );

  const collapse = useCallback(async () => {
    if (!game) return;
    setLoading(true);
    setError(null);
    try {
      const collapsed = await api.collapseGame(game.id);
      setGame(collapsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collapse failed');
    } finally {
      setLoading(false);
    }
  }, [game]);

  const closeSplitModal = useCallback(() => {
    setShowSplitModal(false);
    setSplitSquares([]);
    setSelectedSquares([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquares([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    game,
    outcomes,
    loading,
    error,
    selectedSquares,
    moveMode,
    showSplitModal,
    splitSquares,
    startGame,
    handleSquareClick,
    confirmSplitSelection,
    makeSplitMove,
    collapse,
    setMoveMode,
    closeSplitModal,
    clearSelection,
    clearError,
  };
}
