import type { GameState } from '../../types';
import { Square } from './Square';
import './Board.css';

interface BoardProps {
  game: GameState;
  onSquareClick: (index: number) => void;
  selectedSquares: number[];
}

export function Board({ game, onSquareClick, selectedSquares }: BoardProps) {
  const { board, size, gamePhase, collapsedBoard } = game;
  const isPlayable = gamePhase === 'playing';

  return (
    <div className="board-wrapper">
      <div
        className={`board board--size-${size} ${gamePhase === 'collapsed' ? 'board--collapsed' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {board.map((qutrit, index) => (
          <Square
            key={index}
            qutrit={qutrit}
            index={index}
            onClick={() => onSquareClick(index)}
            isSelected={selectedSquares.includes(index)}
            isClickable={isPlayable}
            collapsedState={collapsedBoard ? collapsedBoard[index] : undefined}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}
