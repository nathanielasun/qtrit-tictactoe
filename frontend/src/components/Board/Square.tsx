import type { QutritState, CellState, BoardSize } from '../../types';
import './Square.css';

interface SquareProps {
  qutrit: QutritState;
  index: number;
  onClick: () => void;
  isSelected: boolean;
  isClickable: boolean;
  collapsedState?: CellState;
  size: BoardSize;
}

export function Square({
  qutrit,
  index,
  onClick,
  isSelected,
  isClickable,
  collapsedState,
  size,
}: SquareProps) {
  const { probX, probO, probEmpty } = qutrit;

  // Compute background tint based on probabilities
  const r = Math.round(255 * probO * 0.15 + 58 * probEmpty * 0.3);
  const g = Math.round(158 * probX * 0.15 + 58 * probEmpty * 0.3);
  const b = Math.round(255 * probX * 0.2 + 106 * probO * 0.1 + 74 * probEmpty * 0.3);
  const bgTint = `rgba(${r}, ${g}, ${b}, 0.25)`;

  if (collapsedState) {
    const colorClass =
      collapsedState === 'X'
        ? 'square--x-collapsed'
        : collapsedState === 'O'
          ? 'square--o-collapsed'
          : 'square--empty-collapsed';
    return (
      <div className={`square square--collapsed ${colorClass}`}>
        <span className="square-index">{index}</span>
        <span className="square-collapsed-letter">
          {collapsedState === 'empty' ? '-' : collapsedState}
        </span>
      </div>
    );
  }

  const pctX = Math.round(probX * 100);
  const pctO = Math.round(probO * 100);
  const pctE = Math.round(probEmpty * 100);
  const isSmall = size === 4;

  return (
    <div
      className={`square ${isSelected ? 'square--selected' : ''} ${isClickable ? 'square--clickable' : ''}`}
      style={{ background: bgTint }}
      onClick={isClickable ? onClick : undefined}
    >
      <span className="square-index">{index}</span>
      <div className="square-bars">
        {pctX > 0 && (
          <div className="square-bar-row">
            <div
              className="square-bar square-bar--x"
              style={{ width: `${probX * 100}%` }}
            />
            {!isSmall && <span className="square-bar-label square-bar-label--x">X: {pctX}%</span>}
            {isSmall && <span className="square-bar-label square-bar-label--x">{pctX}%</span>}
          </div>
        )}
        {pctO > 0 && (
          <div className="square-bar-row">
            <div
              className="square-bar square-bar--o"
              style={{ width: `${probO * 100}%` }}
            />
            {!isSmall && <span className="square-bar-label square-bar-label--o">O: {pctO}%</span>}
            {isSmall && <span className="square-bar-label square-bar-label--o">{pctO}%</span>}
          </div>
        )}
        {pctE > 0 && (
          <div className="square-bar-row">
            <div
              className="square-bar square-bar--empty"
              style={{ width: `${probEmpty * 100}%` }}
            />
            {!isSmall && (
              <span className="square-bar-label square-bar-label--empty">
                {'\u2205'}: {pctE}%
              </span>
            )}
            {isSmall && (
              <span className="square-bar-label square-bar-label--empty">{pctE}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
