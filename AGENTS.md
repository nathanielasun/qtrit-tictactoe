This game will contain a quantum tic-tac-toe implementation using the (slightly
less common) "qutrit" (three possible quantum states) instead of qubits to 
represent each square on the board.

The constraints of the game are as follows:
The tic-tac-toe game is played like classical tic-tac-toe, with a quantum twist:
the X and O players can superposition their moves across two squares at a time 
instead of just one. This works because each square has three potential states:
|\phi> (representing an empty square, which the whole board is initially set to),
|0> (represents an O amplitude in the square) and |1> (represents an X amplitude).
When player X moves, they can choose to classically select an entire square to
be an X square (applies a 1 amplitude to the wavefunction qutrit position representing
that square) or choose a superposition between two spaces. Using a so-called
"split operator" between the two target qutrits, the player can force probability
a of square 1 collapsing to X, and probability b of square 2 collapsing to X,
where a+b = 1. This way player X and O can superposition each square on the board
until there is a 100% probability that each square will either collapse to X or O,
instead of remaining in the empty state. Ensure additionally that all player plays
must sum to a 100% probability across played squares, such that there are always
a total of n^2 turns (in an nxn game). Once all squares are full, the game will unlock
a "collapse" button that will probabilistically measure the game, collapsing it
to a single outcome. Classically reading the grid, the game is won by player X if there
is at least one line of 3 Xs in a row (and no similar lines for O), and vice versa for O.
If there is a line for both X and O or there are no such winning lines, then the game is a draw.

Since this game is educational, at all points there should be a panel in the window next to the game keeping track of the most likely
game outcomes (top 64 is sufficient, shown by probability of outcome. This panel shows the players who will likely win, given the current positions played.
For example, if the split for square 3 is 40% X, 20% O, and 40% empty, the square has a higher probabilty of collapsing into an X.

The game page should be represented as follows: a react.js and node.js backend for logic and processing,
and a typescript and CSS frontend for styling. The board game should have 3 modes (2x2 - 4 qutrits), (3x3 - 9 qutrits), (4x4 - 16 qutrits).

There should be two game modes - Player VS. AI (where X/O and starting order is randomly selected at the beginning), and Player vs player.
The AI should have its own training panel on a second page in the website. The AI should initially play players using basic tic-tac-toe logic and quantum mechanics,
but it should learn from strategies players use against it to win games (common splits, tactics, blocks, etc) in order to become more robust.
Training settings such as parameter tuning, data harvesting, and monitoring game learning, and paramter fine-tuning speed should be adjustable in the 
AI training page with statistics and visual plots as necessary.

The game should be styled with reddish squares representing O, and blue-ish squares representing X.
Empty (uninitialized) squares should be grayish. The game front-end page should be sleek and modern, aiming to educate users additionally on quantum mechanics and the use of qutrits (along with gates and superpositions) in quantum computing.
The 2x2 game case (for educational purposes) should also feature a window demonstrating construction of a quantum circuit
througout gameplay (untouched by the player and automatically updated per round, demonstrating how each move has a corresponding operator on the quantum circuit).

Follow these constraints, and be creative as necessary. Feel free to create planning files to organize, remember, and improve your work.

Ensure all updates to the code are documented and explained in the README.md, along with gameplay instructions.
Ensure the directory is also mapped in the readme. After each major update, write to the README to ensure context persistence, and refer to this when necessary.

