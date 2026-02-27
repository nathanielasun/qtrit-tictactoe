import type { Move, BoardSize } from '../../types';
import './QuantumCircuit.css';

interface QuantumCircuitProps {
  moves: Move[];
  size: BoardSize;
}

export function QuantumCircuit({ moves, size }: QuantumCircuitProps) {
  // Only render for 2x2 games
  if (size !== 2) return null;

  const numWires = 4;
  const wireSpacing = 50;
  const gateWidth = 44;
  const gateSpacing = 60;
  const leftMargin = 70;
  const topMargin = 30;
  const rightPadding = 40;

  const svgWidth = leftMargin + moves.length * gateSpacing + rightPadding + gateWidth;
  const svgHeight = topMargin + (numWires - 1) * wireSpacing + 40;

  const wireY = (wireIndex: number) => topMargin + wireIndex * wireSpacing;
  const gateX = (moveIndex: number) => leftMargin + moveIndex * gateSpacing + gateSpacing / 2;

  return (
    <div className="qc-wrapper card">
      <h3 className="qc-title">Quantum Circuit</h3>
      <p className="qc-subtitle">
        Each move corresponds to a quantum gate applied to the qutrit wires
      </p>
      <div className="qc-scroll">
        <svg
          className="qc-svg"
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          {/* Wire lines */}
          {Array.from({ length: numWires }).map((_, i) => (
            <g key={`wire-${i}`}>
              <line
                x1={leftMargin - 10}
                y1={wireY(i)}
                x2={svgWidth - rightPadding + 10}
                y2={wireY(i)}
                stroke="rgba(136, 136, 170, 0.3)"
                strokeWidth={1.5}
              />
              <text
                x={10}
                y={wireY(i) + 1}
                fill="#8888aa"
                fontSize={13}
                fontFamily="system-ui, sans-serif"
                dominantBaseline="middle"
              >
                |q
                <tspan fontSize={9} dy={3}>
                  {i}
                </tspan>
                <tspan dy={-3}>{'\u27E9'}</tspan>
              </text>
            </g>
          ))}

          {/* Gates for each move */}
          {moves.map((move, mi) => {
            const x = gateX(mi);
            const isX = move.player === 'X';
            const fillColor = isX
              ? 'rgba(74, 158, 255, 0.15)'
              : 'rgba(255, 74, 106, 0.15)';
            const strokeColor = isX
              ? 'rgba(74, 158, 255, 0.6)'
              : 'rgba(255, 74, 106, 0.6)';
            const textColor = isX ? '#4a9eff' : '#ff4a6a';

            if (move.type === 'classical') {
              const y = wireY(move.square);
              return (
                <g key={`gate-${mi}`}>
                  <rect
                    x={x - gateWidth / 2}
                    y={y - 16}
                    width={gateWidth}
                    height={32}
                    rx={6}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={1.2}
                  />
                  <text
                    x={x}
                    y={y + 1}
                    fill={textColor}
                    fontSize={14}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    {move.player}
                  </text>
                  {/* Move index below */}
                  <text
                    x={x}
                    y={wireY(numWires - 1) + 28}
                    fill="#666"
                    fontSize={9}
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    M{mi + 1}
                  </text>
                </g>
              );
            } else {
              // Split move — render a gate on each allocated wire
              const wireYs = move.allocations.map((a) => wireY(a.square));
              const topY = Math.min(...wireYs);
              const botY = Math.max(...wireYs);
              return (
                <g key={`gate-${mi}`}>
                  {/* Connector line between outermost gates */}
                  <line
                    x1={x}
                    y1={topY}
                    x2={x}
                    y2={botY}
                    stroke={strokeColor}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                  {/* Gate for each allocation */}
                  {move.allocations.map((alloc) => {
                    const y = wireY(alloc.square);
                    const pct = Math.round(alloc.prob * 100);
                    return (
                      <g key={`gate-${mi}-sq-${alloc.square}`}>
                        <rect
                          x={x - gateWidth / 2}
                          y={y - 16}
                          width={gateWidth}
                          height={32}
                          rx={6}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={1.2}
                        />
                        <text
                          x={x}
                          y={y + 1}
                          fill={textColor}
                          fontSize={10}
                          fontWeight={600}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily="system-ui, sans-serif"
                        >
                          {move.player} {pct}%
                        </text>
                      </g>
                    );
                  })}
                  {/* Move index */}
                  <text
                    x={x}
                    y={wireY(numWires - 1) + 28}
                    fill="#666"
                    fontSize={9}
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    M{mi + 1}
                  </text>
                </g>
              );
            }
          })}
        </svg>
      </div>
      <div className="qc-legend">
        <div className="qc-legend-item">
          <div className="qc-legend-swatch qc-legend-swatch--classical" />
          <span>Classical Gate (full placement)</span>
        </div>
        <div className="qc-legend-item">
          <div className="qc-legend-swatch qc-legend-swatch--split" />
          <span>Split Gate (superposition across qutrits)</span>
        </div>
        <div className="qc-legend-item">
          <span className="qc-legend-wire">---</span>
          <span>Qutrit wire (3-level quantum system)</span>
        </div>
      </div>
    </div>
  );
}
