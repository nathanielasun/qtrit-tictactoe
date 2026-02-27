# Quantum Qutrit Tic-Tac-Toe

A quantum tic-tac-toe game using **qutrits** (three-state quantum systems) instead of traditional qubits to represent each square on the board. Players can superposition their moves across multiple squares, creating probabilistic game states that are ultimately collapsed via quantum measurement.

## Quantum Mechanics

### What is a Qutrit?

Unlike a qubit (2 states: |0> and |1>), a **qutrit** has three basis states. In this game, each square is a qutrit with states:

| State | Symbol | Meaning |
|-------|--------|---------|
| \|phi> | Empty | Square has not been claimed |
| \|0> | O | Square has O amplitude |
| \|1> | X | Square has X amplitude |

Each square stores a probability distribution `(p_empty, p_O, p_X)` where `p_empty + p_O + p_X = 1`.

### How Moves Work

**Classical Move**: A player selects one fully empty square and fills it entirely (100% probability) with their mark. This is equivalent to projecting the qutrit into a definite state.

**Split Move (Superposition)**: A player distributes their move across two squares with probabilities `a` and `b` where `a + b = 1`. For example, placing 60% X on square 3 and 40% X on square 5. The constraint is that each square must have enough remaining empty probability to accept the assigned amount.

### Collapse (Measurement)

After all `n^2` turns are played (filling all empty probability), the board enters a superposition of possible outcomes. Pressing **Collapse** performs a quantum measurement: each square independently collapses to X or O based on its probability distribution. The resulting classical board is then evaluated for a winner.

### Win Conditions

- **X wins**: At least one complete line of X's (row, column, or diagonal) with no complete line of O's
- **O wins**: At least one complete line of O's with no complete line of X's
- **Draw**: Both players have a winning line, or neither does

## Features

- **Three board sizes**: 2x2 (4 qutrits), 3x3 (9 qutrits), 4x4 (16 qutrits)
- **Two game modes**: Player vs Player (PvP) and Player vs AI (PvA)
- **Outcome probability panel**: Shows the top 64 most likely game outcomes in real-time
- **Quantum circuit visualization**: 2x2 mode displays an interactive quantum circuit diagram showing how each move corresponds to quantum gates
- **AI training dashboard**: Train the AI opponent with adjustable hyperparameters, visualize learning curves, and monitor strategy development
- **Educational content**: Collapsible cards explaining qutrits, superposition, and wavefunction collapse

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

Start both the backend and frontend in separate terminals:

```bash
# Terminal 1: Start backend (port 3001)
cd backend
npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Gameplay Instructions

1. **Select board size**: Choose 2x2, 3x3, or 4x4
2. **Select game mode**: PvP (two human players) or PvA (play against AI)
3. **Click "Start Game"**
4. **Make moves**:
   - **Classical mode** (default): Click any fully empty square to claim it entirely
   - **Split mode**: Toggle to "Split" mode, click two squares, then use the slider to set the probability distribution
5. **Watch the outcomes panel**: See which game results are most likely given current positions
6. **Collapse**: When all moves are played, click the pulsing "Collapse!" button to measure the quantum state
7. **See the result**: The board collapses to a classical state and a winner is determined

## AI Training

Navigate to the **AI Training** page (`/training`) to:

- **Adjust hyperparameters**: Learning rate, exploration rate, discount factor, batch size
- **Run training batches**: Simulate games where AI plays against random opponents
- **Monitor progress**: View win rate, average reward, and exploration rate over training epochs
- **Reset**: Clear all training data to start fresh

The AI uses a multi-layered strategy:
1. Heuristic evaluation (center/corner preference, blocking, winning moves)
2. Outcome-based position scoring using the probability calculator
3. Exploration vs exploitation (configurable exploration rate)
4. Pattern learning from recorded games

## Project Structure

```
qtrit-tictactoe/
├── backend/                        # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── engine/                 # Core game engine
│   │   │   ├── types.ts            # Shared type definitions
│   │   │   ├── GameState.ts        # Game state management & move validation
│   │   │   ├── Collapse.ts         # Quantum measurement / board collapse
│   │   │   ├── WinDetector.ts      # Win condition evaluation
│   │   │   └── OutcomeCalculator.ts# Top-k outcome probability calculation
│   │   ├── ai/                     # AI system
│   │   │   ├── AIPlayer.ts         # AI move selection strategy
│   │   │   ├── StrategyDB.ts       # In-memory strategy database
│   │   │   └── Trainer.ts          # Training batch simulation
│   │   ├── routes/                 # REST API
│   │   │   ├── game.ts             # Game CRUD & move endpoints
│   │   │   └── training.ts         # AI config & training endpoints
│   │   └── index.ts                # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                       # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board/              # Game board grid + individual squares
│   │   │   ├── GameControls/       # Setup panel, move mode toggle, collapse
│   │   │   ├── Navbar/             # Navigation bar
│   │   │   ├── OutcomePanel/       # Top-k outcome probability display
│   │   │   ├── QuantumCircuit/     # SVG quantum circuit diagram (2x2)
│   │   │   └── SplitMoveModal/     # Split probability slider modal
│   │   ├── hooks/
│   │   │   └── useGame.ts          # Game state management hook
│   │   ├── pages/
│   │   │   ├── GamePage.tsx        # Main game page layout
│   │   │   └── TrainingPage.tsx    # AI training dashboard
│   │   ├── api.ts                  # Backend API client
│   │   ├── types.ts                # Shared type definitions
│   │   ├── App.tsx                 # Router + layout
│   │   ├── App.css                 # Global styles + CSS variables
│   │   └── main.tsx                # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── CLAUDE.md                       # Project specification
├── LICENSE
└── README.md
```

## API Reference

### Game Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/game/new` | Create a new game |
| POST | `/api/game/:id/move` | Make a move |
| POST | `/api/game/:id/collapse` | Collapse the board |
| GET | `/api/game/:id` | Get game state |
| GET | `/api/game/:id/outcomes` | Get top 64 probable outcomes |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/config` | Get AI configuration |
| POST | `/api/ai/config` | Update AI configuration |
| POST | `/api/ai/train` | Run training batch |
| GET | `/api/ai/stats` | Get training statistics |
| POST | `/api/ai/reset` | Reset training data |

## Design

- **Dark theme** with glassmorphism card effects
- **Blue** (#4a9eff) for X, **Red** (#ff4a6a) for O, **Gray** (#3a3a4a) for empty
- **Purple** (#6c5ce7) accent for interactive elements
- Responsive layout supporting desktop and tablet
- Pulsing glow animation on the Collapse button
- Smooth transitions on all interactive elements

## Technical Details

### Outcome Calculation

The outcome calculator uses a **max-heap priority queue** approach to efficiently find the top-k most probable outcomes without enumerating all `3^(n^2)` possibilities:

1. Start with the single most likely outcome (each cell at its highest-probability state)
2. Pop the most probable unexplored outcome from the heap
3. Generate variants by changing one cell to its next-most-likely state
4. Deduplicate using string keys
5. Repeat until 64 outcomes are found

### Game State Invariants

- Each square: `p_empty + p_O + p_X = 1` (always)
- Each move adds exactly 1 unit of probability to the board
- After `n^2` moves: all squares have `p_empty = 0`
- Total filled probability = number of moves played
