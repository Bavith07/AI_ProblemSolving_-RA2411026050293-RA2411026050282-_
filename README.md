# AI Problem Solving Assignment

A unified web interface for two core AI problem-solving tasks:
1.  **Tic-Tac-Toe AI**: Optimized with Minimax and Alpha-Beta Pruning.
2.  **Smart Navigation**: Pathfinding visualization using BFS and DFS.

---

## 📁 Project Structure

```
AI_ProblemSolving/
├── app.py                # Unified Backend (Flask)
├── static/               # Frontend Assets (CSS & JS)
│   ├── css/
│   │   ├── tictactoe.css
│   │   └── navigation.css
│   └── js/
│       ├── tictactoe.js
│       └── navigation.js
├── templates/            # HTML Interfaces
│   ├── gateway.html      # Main Dashboard
│   ├── tictactoe.html    # Problem 1 Interface
│   └── navigation.html   # Problem 2 Interface
├── requirements.txt      # Dependencies
└── README.md             # Project Documentation
```

---

## 🚀 How to Run

1.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Launch the application**:
    ```bash
    python app.py
    ```
3.  **Access in Browser**:
    [http://127.0.0.1:8080](http://127.0.0.1:8080)

---

## 🎮 Features & Algorithms

### Tic-Tac-Toe AI
*   **Minimax**: Full game tree exploration for optimal play.
*   **Alpha-Beta Pruning**: Significant optimization that skips irrelevant branches.
*   **Performance Tracking**: Real-time monitoring of nodes explored and speedup percentages.

### Smart Navigation
*   **Breadth-First Search (BFS)**: Guaranteed shortest path in unweighted graphs.
*   **Depth-First Search (DFS)**: Deep-first exploration strategy.
*   **Graph Builder**: Interactive canvas for creating custom node/edge networks.

---
*Submission for AI Problem Solving Assignment*
