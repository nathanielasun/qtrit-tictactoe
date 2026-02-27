import { useState } from 'react';
import type { GameState, BoardSize, GameMode, Player } from '../../types';
import './GameControls.css';

interface GameControlsProps {
  game: GameState | null;
  loading: boolean;
  moveMode: 'classical' | 'split';
  selectedSquares: number[];
  onStartGame: (size: BoardSize, gameMode: GameMode, aiPlayer?: Player) => void;
  onSetMoveMode: (mode: 'classical' | 'split') => void;
  onCollapse: () => void;
  onConfirmSplit: () => void;
  onClearSelection: () => void;
}

export function GameControls({
  game,
  loading,
  moveMode,
  selectedSquares,
  onStartGame,
  onSetMoveMode,
  onCollapse,
  onConfirmSplit,
  onClearSelection,
}: GameControlsProps) {
  const [selectedSize, setSelectedSize] = useState<BoardSize>(3);
  const [selectedMode, setSelectedMode] = useState<GameMode>('pvp');
  const [selectedAIPlayer, setSelectedAIPlayer] = useState<Player>('O');

  const sizes: BoardSize[] = [2, 3, 4];

  const handleStart = () => {
    if (selectedMode === 'pva') {
      onStartGame(selectedSize, selectedMode, selectedAIPlayer);
    } else {
      onStartGame(selectedSize, selectedMode);
    }
  };

  // Setup panel - no game yet
  if (!game) {
    return (
      <div className="game-controls card fade-in">
        <h2 className="gc-title">New Game</h2>

        <div className="gc-section">
          <label className="gc-label">Board Size</label>
          <div className="gc-chips">
            {sizes.map((s) => (
              <button
                key={s}
                className={`gc-chip ${selectedSize === s ? 'gc-chip--active' : ''}`}
                onClick={() => setSelectedSize(s)}
              >
                {s}x{s}
              </button>
            ))}
          </div>
        </div>

        <div className="gc-section">
          <label className="gc-label">Game Mode</label>
          <div className="gc-chips">
            <button
              className={`gc-chip ${selectedMode === 'pvp' ? 'gc-chip--active' : ''}`}
              onClick={() => setSelectedMode('pvp')}
            >
              Player vs Player
            </button>
            <button
              className={`gc-chip ${selectedMode === 'pva' ? 'gc-chip--active' : ''}`}
              onClick={() => setSelectedMode('pva')}
            >
              Player vs AI
            </button>
          </div>
        </div>

        {selectedMode === 'pva' && (
          <div className="gc-section fade-in">
            <label className="gc-label">Play as</label>
            <div className="gc-chips">
              <button
                className={`gc-chip gc-chip--x ${selectedAIPlayer === 'O' ? 'gc-chip--active' : ''}`}
                onClick={() => setSelectedAIPlayer('O')}
              >
                X (first)
              </button>
              <button
                className={`gc-chip gc-chip--o ${selectedAIPlayer === 'X' ? 'gc-chip--active' : ''}`}
                onClick={() => setSelectedAIPlayer('X')}
              >
                O (second)
              </button>
            </div>
            <p className="gc-hint">AI will play as {selectedAIPlayer}</p>
          </div>
        )}

        <button
          className="btn btn-primary gc-start-btn"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Start Game'}
        </button>
      </div>
    );
  }

  // Game in progress
  if (game.gamePhase === 'playing') {
    const isAITurn =
      game.gameMode === 'pva' && game.currentPlayer === game.aiPlayer;
    return (
      <div className="game-controls card fade-in">
        <h2 className="gc-title">Game Controls</h2>

        <div className="gc-status">
          <div className="gc-current-player">
            <span className="gc-label">Current Turn</span>
            <span
              className={`gc-player-badge ${game.currentPlayer === 'X' ? 'gc-player-badge--x' : 'gc-player-badge--o'}`}
            >
              {game.currentPlayer}
              {isAITurn && ' (AI thinking...)'}
            </span>
          </div>
          <div className="gc-turn-count">
            <span className="gc-label">Progress</span>
            <span className="gc-turn-text">
              Turn {game.movesPlayed + 1} of {game.totalMoves}
            </span>
            <div className="gc-progress-bar">
              <div
                className="gc-progress-fill"
                style={{
                  width: `${(game.movesPlayed / game.totalMoves) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="gc-section">
          <label className="gc-label">Move Type</label>
          <div className="gc-toggle">
            <button
              className={`gc-toggle-btn ${moveMode === 'classical' ? 'gc-toggle-btn--active' : ''}`}
              onClick={() => onSetMoveMode('classical')}
            >
              Classical
            </button>
            <button
              className={`gc-toggle-btn ${moveMode === 'split' ? 'gc-toggle-btn--active' : ''}`}
              onClick={() => onSetMoveMode('split')}
            >
              Split
            </button>
          </div>
          <p className="gc-hint">
            {moveMode === 'classical'
              ? 'Click a fully empty cell to place your mark.'
              : 'Click 2 or more cells, then set probabilities.'}
          </p>
          {moveMode === 'split' && selectedSquares.length > 0 && (
            <div className="gc-split-controls fade-in">
              <p className="gc-split-count">
                {selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} selected
              </p>
              <div className="gc-split-buttons">
                <button
                  className="btn btn-primary gc-split-confirm"
                  onClick={onConfirmSplit}
                  disabled={selectedSquares.length < 2}
                >
                  Set Probabilities
                </button>
                <button
                  className="btn btn-secondary gc-split-clear"
                  onClick={onClearSelection}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          className="btn btn-secondary gc-new-btn"
          onClick={() => onStartGame(game.size, game.gameMode, game.aiPlayer)}
          disabled={loading}
        >
          New Game
        </button>
      </div>
    );
  }

  // Ready to collapse
  if (game.gamePhase === 'ready_to_collapse') {
    return (
      <div className="game-controls card fade-in">
        <h2 className="gc-title">Board Full!</h2>
        <p className="gc-description">
          All {game.totalMoves} moves have been played. The quantum state is
          ready for measurement. Collapse the wavefunction to determine the
          outcome!
        </p>

        <button
          className="btn btn-primary gc-collapse-btn"
          onClick={onCollapse}
          disabled={loading}
        >
          {loading ? 'Collapsing...' : 'Collapse!'}
        </button>

        <button
          className="btn btn-secondary gc-new-btn"
          onClick={() => onStartGame(game.size, game.gameMode, game.aiPlayer)}
          disabled={loading}
        >
          New Game
        </button>
      </div>
    );
  }

  // Collapsed - show results
  if (game.gamePhase === 'collapsed') {
    const winner = game.winner;
    let resultText: string;
    let resultClass: string;
    if (winner === 'X') {
      resultText = 'X Wins!';
      resultClass = 'gc-result--x';
    } else if (winner === 'O') {
      resultText = 'O Wins!';
      resultClass = 'gc-result--o';
    } else if (winner === 'draw') {
      resultText = "It's a Draw!";
      resultClass = 'gc-result--draw';
    } else {
      resultText = 'No Winner';
      resultClass = 'gc-result--draw';
    }

    return (
      <div className="game-controls card fade-in">
        <h2 className="gc-title">Game Over</h2>
        <div className={`gc-result ${resultClass}`}>
          <span className="gc-result-text">{resultText}</span>
        </div>
        <p className="gc-description">
          The wavefunction has collapsed. The quantum state has been measured!
        </p>
        <button
          className="btn btn-primary gc-new-btn"
          onClick={() => onStartGame(game.size, game.gameMode, game.aiPlayer)}
          disabled={loading}
        >
          Play Again
        </button>
      </div>
    );
  }

  return null;
}
