import type { GameOutcome, BoardSize } from '../../types';
import './OutcomePanel.css';

interface OutcomePanelProps {
  outcomes: GameOutcome[];
  boardSize: BoardSize;
}

function MiniBoard({
  board,
  size,
}: {
  board: GameOutcome['board'];
  size: BoardSize;
}) {
  return (
    <div
      className="mini-board"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
      }}
    >
      {board.map((cell, i) => (
        <div
          key={i}
          className={`mini-cell ${
            cell === 'X'
              ? 'mini-cell--x'
              : cell === 'O'
                ? 'mini-cell--o'
                : 'mini-cell--empty'
          }`}
        >
          {cell === 'empty' ? '' : cell}
        </div>
      ))}
    </div>
  );
}

export function OutcomePanel({ outcomes, boardSize }: OutcomePanelProps) {
  const displayed = outcomes.slice(0, 64);
  const totalCount = outcomes.length;

  if (displayed.length === 0) {
    return (
      <div className="outcome-panel card">
        <h3 className="op-title">Most Likely Outcomes</h3>
        <p className="op-empty">
          Make some moves to see possible outcomes and their probabilities.
        </p>
      </div>
    );
  }

  return (
    <div className="outcome-panel card">
      <h3 className="op-title">
        Most Likely Outcomes
        <span className="op-count">{totalCount}</span>
      </h3>
      <div className="op-list">
        {displayed.map((outcome, idx) => {
          const pct = Math.round(outcome.probability * 10000) / 100;
          const winnerLabel =
            outcome.winner === 'X'
              ? 'X wins'
              : outcome.winner === 'O'
                ? 'O wins'
                : outcome.winner === 'draw'
                  ? 'Draw'
                  : 'No winner';
          const winnerClass =
            outcome.winner === 'X'
              ? 'op-badge--x'
              : outcome.winner === 'O'
                ? 'op-badge--o'
                : 'op-badge--draw';

          return (
            <div key={idx} className="op-item">
              <div className="op-item-left">
                <MiniBoard board={outcome.board} size={boardSize} />
              </div>
              <div className="op-item-right">
                <div className="op-item-prob">
                  <span className="op-item-pct">{pct}%</span>
                  <div className="op-item-bar-track">
                    <div
                      className="op-item-bar-fill"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
                <span className={`op-badge ${winnerClass}`}>
                  {winnerLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
