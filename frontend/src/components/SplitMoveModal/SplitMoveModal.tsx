import { useState, useMemo } from 'react';
import type { Player, QutritState, Allocation } from '../../types';
import './SplitMoveModal.css';

interface SplitMoveModalProps {
  squares: number[];
  board: QutritState[];
  player: Player;
  onConfirm: (allocations: Allocation[]) => void;
  onCancel: () => void;
}

export function SplitMoveModal({
  squares,
  board,
  player,
  onConfirm,
  onCancel,
}: SplitMoveModalProps) {
  const maxProbs = useMemo(
    () => squares.map((sq) => board[sq].probEmpty),
    [squares, board]
  );

  // Initialize: distribute evenly (capped by max)
  const initialAllocs = useMemo(() => {
    const n = squares.length;
    const result = new Array(n).fill(0);
    let toDistribute = 1.0;
    let uncapped = new Set(Array.from({ length: n }, (_, i) => i));

    for (let iter = 0; iter < n && uncapped.size > 0; iter++) {
      const share = toDistribute / uncapped.size;
      const nextUncapped = new Set(uncapped);
      let distributed = 0;
      for (const i of uncapped) {
        if (share > maxProbs[i]) {
          result[i] = maxProbs[i];
          distributed += maxProbs[i];
          nextUncapped.delete(i);
        } else {
          result[i] = share;
          distributed += share;
        }
      }
      toDistribute -= distributed;
      uncapped = nextUncapped;
      if (Math.abs(toDistribute) < 0.001) break;
    }
    return result;
  }, [squares, maxProbs]);

  const [probs, setProbs] = useState<number[]>(initialAllocs);

  const total = probs.reduce((s, p) => s + p, 0);
  const remaining = 1.0 - total;
  const isValid = Math.abs(remaining) < 0.005;

  const isX = player === 'X';
  const colorClass = isX ? 'split-modal--x' : 'split-modal--o';

  const handleSliderChange = (index: number, value: number) => {
    setProbs((prev) => {
      const next = [...prev];
      next[index] = Math.min(value, maxProbs[index]);
      return next;
    });
  };

  const distributeEvenly = () => {
    const n = squares.length;
    const newProbs = new Array(n).fill(0);
    let toDistribute = 1.0;
    let uncapped = new Set(Array.from({ length: n }, (_, i) => i));

    for (let iter = 0; iter < n && uncapped.size > 0; iter++) {
      const share = toDistribute / uncapped.size;
      const nextUncapped = new Set(uncapped);
      let distributed = 0;
      for (const i of uncapped) {
        if (share > maxProbs[i]) {
          newProbs[i] = maxProbs[i];
          distributed += maxProbs[i];
          nextUncapped.delete(i);
        } else {
          newProbs[i] = share;
          distributed += share;
        }
      }
      toDistribute -= distributed;
      uncapped = nextUncapped;
      if (Math.abs(toDistribute) < 0.001) break;
    }
    setProbs(newProbs);
  };

  const autoFillRemaining = () => {
    const newProbs = [...probs];
    let rem = 1.0 - newProbs.reduce((s, p) => s + p, 0);
    for (let i = 0; i < newProbs.length && rem > 0.001; i++) {
      const capacity = maxProbs[i] - newProbs[i];
      if (capacity > 0.001) {
        const add = Math.min(capacity, rem);
        newProbs[i] += add;
        rem -= add;
      }
    }
    setProbs(newProbs);
  };

  return (
    <div className="split-modal-overlay" onClick={onCancel}>
      <div
        className={`split-modal-card card ${colorClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="split-modal-title">Split Move</h3>
        <p className="split-modal-subtitle">
          Distribute <strong>{player}</strong> probability across{' '}
          {squares.length} squares (must total 100%)
        </p>

        <div className="split-modal-remaining">
          <span
            className={`split-modal-remaining-value ${isValid ? 'valid' : remaining > 0 ? 'under' : 'over'}`}
          >
            {isValid
              ? 'Fully distributed'
              : remaining > 0
                ? `${Math.round(remaining * 100)}% remaining`
                : `${Math.round(-remaining * 100)}% over`}
          </span>
        </div>

        <div className="split-modal-squares">
          {squares.map((sq, i) => {
            const pct = Math.round(probs[i] * 100);
            const maxPct = Math.round(maxProbs[i] * 100);
            return (
              <div key={sq} className="split-modal-sq">
                <div className="split-modal-sq-header">
                  <span className="split-modal-sq-label">Square {sq}</span>
                  <span className="split-modal-sq-max">max {maxPct}%</span>
                </div>
                <span
                  className={`split-modal-sq-pct ${isX ? 'text-x' : 'text-o'}`}
                >
                  {pct}%
                </span>
                <div className="split-modal-sq-bar-track">
                  <div
                    className={`split-modal-sq-bar ${isX ? 'bar-x' : 'bar-o'}`}
                    style={{
                      width: `${(probs[i] / Math.max(maxProbs[i], 0.01)) * 100}%`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  className={`split-modal-slider ${isX ? 'slider-x' : 'slider-o'}`}
                  min={0}
                  max={maxProbs[i]}
                  step={0.01}
                  value={probs[i]}
                  onChange={(e) =>
                    handleSliderChange(i, parseFloat(e.target.value))
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="split-modal-helpers">
          <button
            className="btn btn-secondary btn-sm"
            onClick={distributeEvenly}
          >
            Distribute Evenly
          </button>
          {remaining > 0.005 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={autoFillRemaining}
            >
              Auto-fill Remaining
            </button>
          )}
        </div>

        <div className="split-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${isX ? 'btn-x' : 'btn-o'}`}
            onClick={() =>
              onConfirm(
                squares.map((sq, i) => ({ square: sq, prob: probs[i] }))
              )
            }
            disabled={!isValid}
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  );
}
