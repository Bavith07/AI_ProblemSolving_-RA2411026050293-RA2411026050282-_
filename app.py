import time
import copy
from collections import deque
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# ==========================================
#  Tic-Tac-Toe Logic (Minimax & Alpha-Beta)
# ==========================================

EMPTY = ""
PLAYER_X = "X"  # Human
PLAYER_O = "O"  # AI

def check_winner(board):
    lines = [
        [board[0], board[1], board[2]], [board[3], board[4], board[5]], [board[6], board[7], board[8]],
        [board[0], board[3], board[6]], [board[1], board[4], board[7]], [board[2], board[5], board[8]],
        [board[0], board[4], board[8]], [board[2], board[4], board[6]],
    ]
    for line in lines:
        if line[0] == line[1] == line[2] and line[0] != EMPTY:
            return line[0]
    if all(cell != EMPTY for cell in board):
        return "draw"
    return None

def get_available_moves(board):
    return [i for i, cell in enumerate(board) if cell == EMPTY]

class MinimaxSolver:
    def __init__(self): self.nodes_explored = 0
    def minimax(self, board, depth, is_maximizing):
        self.nodes_explored += 1
        result = check_winner(board)
        if result == PLAYER_O: return 10 - depth
        elif result == PLAYER_X: return depth - 10
        elif result == "draw": return 0
        if is_maximizing:
            best_score = float("-inf")
            for move in get_available_moves(board):
                board[move] = PLAYER_O
                score = self.minimax(board, depth + 1, False)
                board[move] = EMPTY
                best_score = max(best_score, score)
            return best_score
        else:
            best_score = float("inf")
            for move in get_available_moves(board):
                board[move] = PLAYER_X
                score = self.minimax(board, depth + 1, True)
                board[move] = EMPTY
                best_score = min(best_score, score)
            return best_score
    def find_best_move(self, board):
        self.nodes_explored = 0
        best_score, best_move = float("-inf"), None
        for move in get_available_moves(board):
            board[move] = PLAYER_O
            score = self.minimax(board, 0, False)
            board[move] = EMPTY
            if score > best_score: best_score, best_move = score, move
        return best_move

class AlphaBetaSolver:
    def __init__(self): self.nodes_explored = 0
    def alphabeta(self, board, depth, alpha, beta, is_maximizing):
        self.nodes_explored += 1
        result = check_winner(board)
        if result == PLAYER_O: return 10 - depth
        elif result == PLAYER_X: return depth - 10
        elif result == "draw": return 0
        if is_maximizing:
            best_score = float("-inf")
            for move in get_available_moves(board):
                board[move] = PLAYER_O
                score = self.alphabeta(board, depth + 1, alpha, beta, False)
                board[move] = EMPTY
                best_score = max(best_score, score)
                alpha = max(alpha, best_score)
                if beta <= alpha: break
            return best_score
        else:
            best_score = float("inf")
            for move in get_available_moves(board):
                board[move] = PLAYER_X
                score = self.alphabeta(board, depth + 1, alpha, beta, True)
                board[move] = EMPTY
                best_score = min(best_score, score)
                beta = min(beta, best_score)
                if beta <= alpha: break
            return best_score
    def find_best_move(self, board):
        self.nodes_explored = 0
        best_score, best_move = float("-inf"), None
        for move in get_available_moves(board):
            board[move] = PLAYER_O
            score = self.alphabeta(board, 0, float("-inf"), float("inf"), False)
            board[move] = EMPTY
            if score > best_score: best_score, best_move = score, move
        return best_move

# ==========================================
#  Navigation Logic (BFS & DFS)
# ==========================================

def bfs(graph, start, goal):
    if start not in graph or goal not in graph: return None, 0, []
    visited, queue = {start}, deque([(start, [start])])
    nodes_explored, exploration_order = 0, []
    while queue:
        current, path = queue.popleft()
        nodes_explored += 1
        exploration_order.append(current)
        if current == goal: return path, nodes_explored, exploration_order
        for neighbor in sorted(graph.get(current, [])):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return None, nodes_explored, exploration_order

def dfs(graph, start, goal):
    if start not in graph or goal not in graph: return None, 0, []
    visited, stack = set(), [(start, [start])]
    nodes_explored, exploration_order = 0, []
    while stack:
        current, path = stack.pop()
        if current in visited: continue
        visited.add(current)
        nodes_explored += 1
        exploration_order.append(current)
        if current == goal: return path, nodes_explored, exploration_order
        for neighbor in sorted(graph.get(current, []), reverse=True):
            if neighbor not in visited: stack.append((neighbor, path + [neighbor]))
    return None, nodes_explored, exploration_order

# ==========================================
#  Unified Routes
# ==========================================

@app.route("/")
def gateway():
    return render_template("gateway.html")

@app.route("/tictactoe")
def tictactoe():
    return render_template("tictactoe.html")

@app.route("/navigation")
def navigation():
    return render_template("navigation.html")

# --- Tic-Tac-Toe APIs ---

@app.route("/api/ttt/move", methods=["POST"])
def ttt_move():
    data = request.get_json()
    board = data.get("board", [""] * 9)
    winner = check_winner(board)
    if winner: return jsonify({"error": "Game is already over", "winner": winner})
    
    mm_solver, ab_solver = MinimaxSolver(), AlphaBetaSolver()
    
    s_mm = time.perf_counter()
    move_mm = mm_solver.find_best_move(list(board))
    e_mm = time.perf_counter()
    
    s_ab = time.perf_counter()
    move_ab = ab_solver.find_best_move(list(board))
    e_ab = time.perf_counter()
    
    best_move = move_ab
    board[best_move] = PLAYER_O
    winner = check_winner(board)
    
    t_mm, t_ab = (e_mm-s_mm)*1000, (e_ab-s_ab)*1000
    n_mm, n_ab = mm_solver.nodes_explored, ab_solver.nodes_explored
    
    return jsonify({
        "move": best_move, "board": board, "winner": winner,
        "metrics": {
            "minimax": {"time_ms": round(t_mm, 4), "nodes_explored": n_mm},
            "alpha_beta": {"time_ms": round(t_ab, 4), "nodes_explored": n_ab},
            "speedup": round(t_mm / t_ab, 2) if t_ab > 0 else 0,
            "nodes_saved": n_mm - n_ab,
            "prune_percentage": round(((n_mm - n_ab) / n_mm) * 100, 1) if n_mm > 0 else 0,
        },
    })

@app.route("/api/ttt/reset", methods=["POST"])
def ttt_reset():
    return jsonify({"board": [""] * 9, "winner": None})

# --- Navigation APIs ---

@app.route("/api/nav/find-path", methods=["POST"])
def nav_find_path():
    data = request.get_json()
    nodes, edges = data.get("nodes", []), data.get("edges", [])
    start, goal = data.get("start", ""), data.get("goal", "")
    
    if not start or not goal: return jsonify({"error": "Start/Goal required"}), 400
    graph = {node: [] for node in nodes}
    for a, b in edges:
        if b not in graph[a]: graph[a].append(b)
        if a not in graph[b]: graph[b].append(a)
    
    s_bfs = time.perf_counter()
    b_path, b_nodes, b_order = bfs(graph, start, goal)
    t_bfs = (time.perf_counter() - s_bfs) * 1000
    
    s_dfs = time.perf_counter()
    d_path, d_nodes, d_order = dfs(graph, start, goal)
    t_dfs = (time.perf_counter() - s_dfs) * 1000
    
    b_len, d_len = len(b_path) if b_path else 0, len(d_path) if d_path else 0
    
    return jsonify({
        "bfs": {"path": b_path, "path_length": b_len, "nodes_explored": b_nodes, "exploration_order": b_order, "time_ms": round(t_bfs, 4), "is_optimal": True if b_path else False},
        "dfs": {"path": d_path, "path_length": d_len, "nodes_explored": d_nodes, "exploration_order": d_order, "time_ms": round(t_dfs, 4), "is_optimal": b_len == d_len if (b_path and d_path) else (True if d_path else False)},
        "comparison": {"bfs_shorter": b_len <= d_len if (b_path and d_path) else False, "path_difference": abs(b_len - d_len), "nodes_diff": abs(b_nodes - d_nodes), "bfs_explored_more": b_nodes > d_nodes},
        "graph": graph,
    })

if __name__ == "__main__":
    print("\n[*] Unified AI Portal Active")
    print("    Open http://127.0.0.1:8080 in your browser\n")
    app.run(debug=True, port=8080)
