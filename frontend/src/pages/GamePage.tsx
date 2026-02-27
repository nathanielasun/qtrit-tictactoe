import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { Board } from '../components/Board/Board';
import { GameControls } from '../components/GameControls/GameControls';
import { OutcomePanel } from '../components/OutcomePanel/OutcomePanel';
import { QuantumCircuit } from '../components/QuantumCircuit/QuantumCircuit';
import { SplitMoveModal } from '../components/SplitMoveModal/SplitMoveModal';
import './GamePage.css';

interface EducationalCardState {
  qutrits: boolean;
  superposition: boolean;
  collapse: boolean;
}

export function GamePage() {
  const {
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
  } = useGame();

  const [expandedCards, setExpandedCards] = useState<EducationalCardState>({
    qutrits: false,
    superposition: false,
    collapse: false,
  });

  const toggleCard = (card: keyof EducationalCardState) => {
    setExpandedCards((prev) => ({ ...prev, [card]: !prev[card] }));
  };

  return (
    <div className="game-page">
      {error && (
        <div className="gp-error fade-in">
          <span>{error}</span>
          <button className="gp-error-close" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      <div className="gp-layout">
        {/* Left column: Controls */}
        <div className="gp-col gp-col--left">
          <GameControls
            game={game}
            loading={loading}
            moveMode={moveMode}
            selectedSquares={selectedSquares}
            onStartGame={startGame}
            onSetMoveMode={setMoveMode}
            onCollapse={collapse}
            onConfirmSplit={confirmSplitSelection}
            onClearSelection={clearSelection}
          />
        </div>

        {/* Center column: Board */}
        <div className="gp-col gp-col--center">
          {game ? (
            <>
              <Board
                game={game}
                onSquareClick={handleSquareClick}
                selectedSquares={selectedSquares}
              />
              {game.size === 2 && (
                <QuantumCircuit moves={game.moves} size={game.size} />
              )}
            </>
          ) : (
            <div className="gp-placeholder card">
              <div className="gp-placeholder-icon">&psi;</div>
              <h2 className="gp-placeholder-title">
                Quantum Qutrit Tic-Tac-Toe
              </h2>
              <p className="gp-placeholder-text">
                Configure your game settings and click Start to begin. Each
                square on the board is a qutrit — a three-level quantum system
                that can be in superposition of Empty, X, and O states.
              </p>
            </div>
          )}
        </div>

        {/* Right column: Outcomes */}
        <div className="gp-col gp-col--right">
          {game && (
            <OutcomePanel outcomes={outcomes} boardSize={game.size} />
          )}
        </div>
      </div>

      {/* Split Move Modal */}
      {showSplitModal && splitSquares.length >= 2 && game && (
        <SplitMoveModal
          squares={splitSquares}
          board={game.board}
          player={game.currentPlayer}
          onConfirm={(allocations) => makeSplitMove(allocations)}
          onCancel={closeSplitModal}
        />
      )}

      {/* Educational Info */}
      <div className="gp-edu">
        <h3 className="gp-edu-heading">Learn Quantum Mechanics</h3>
        <div className="gp-edu-cards">
          <div className="gp-edu-card card">
            <button
              className="gp-edu-card-header"
              onClick={() => toggleCard('qutrits')}
            >
              <span className="gp-edu-card-title">
                Qutrits vs Qubits
              </span>
              <span className="gp-edu-card-toggle">
                {expandedCards.qutrits ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {expandedCards.qutrits && (
              <div className="gp-edu-card-body fade-in">
                <p>
                  In standard quantum computing, the basic unit of information
                  is the <strong>qubit</strong> — a two-level quantum system
                  that can be in a superposition of |0&rang; and |1&rang;.
                </p>
                <p>
                  A <strong>qutrit</strong> extends this to three levels: |0&rang;,
                  |1&rang;, and |2&rang;. In our game, these represent the
                  states <em>Empty</em> (&phi;), <em>O</em>, and <em>X</em>
                  respectively. This gives each square richer quantum behavior
                  than a simple qubit.
                </p>
                <p>
                  Qutrits are studied in quantum information theory because they
                  can encode more information per particle and exhibit stronger
                  entanglement properties than qubits.
                </p>
              </div>
            )}
          </div>

          <div className="gp-edu-card card">
            <button
              className="gp-edu-card-header"
              onClick={() => toggleCard('superposition')}
            >
              <span className="gp-edu-card-title">
                Superposition in the Game
              </span>
              <span className="gp-edu-card-toggle">
                {expandedCards.superposition ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {expandedCards.superposition && (
              <div className="gp-edu-card-body fade-in">
                <p>
                  <strong>Superposition</strong> means a quantum system exists
                  in multiple states simultaneously until measured. In this
                  game, when you make a <em>split move</em>, you place your
                  mark across two squares at once.
                </p>
                <p>
                  For example, a split move might put 60% X probability on
                  square 0 and 40% X probability on square 3. Neither square
                  has a definite state — they are in superposition.
                </p>
                <p>
                  Classical moves are like definite measurements: the full
                  probability is placed on one square. Split moves leverage
                  quantum superposition for strategic advantage.
                </p>
              </div>
            )}
          </div>

          <div className="gp-edu-card card">
            <button
              className="gp-edu-card-header"
              onClick={() => toggleCard('collapse')}
            >
              <span className="gp-edu-card-title">
                Wavefunction Collapse
              </span>
              <span className="gp-edu-card-toggle">
                {expandedCards.collapse ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {expandedCards.collapse && (
              <div className="gp-edu-card-body fade-in">
                <p>
                  In quantum mechanics, <strong>measurement</strong> causes a
                  quantum system to "collapse" from superposition into a single
                  definite state. The probability of each outcome is determined
                  by the system's wavefunction.
                </p>
                <p>
                  In this game, once all n&sup2; moves have been played, the
                  board is full of probabilities. Pressing <em>Collapse</em>
                  performs a measurement on each qutrit: each square becomes
                  definitively X, O, or Empty based on its probability
                  distribution.
                </p>
                <p>
                  This is why strategy matters — you want to maximize the
                  probability of favorable outcomes. The Outcome Panel shows
                  you the most likely results before you collapse!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
