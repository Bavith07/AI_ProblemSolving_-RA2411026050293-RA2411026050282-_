import time
from collections import deque
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)


#  BFS — Breadth-First Search

def bfs(graph, start, goal):
    """
    Breadth-First Search.
    Explores nodes level-by-level using a queue.
    Guarantees the shortest path (fewest edges).

    Returns: (path, nodes_explored, exploration_order)
    """
    if start not in graph or goal not in graph:
        return None, 0, []

    visited = set()
    queue = deque()
    queue.append((start, [start]))
    visited.add(start)
    nodes_explored = 0
    exploration_order = []

    while queue:
        current, path = queue.popleft()
        nodes_explored += 1
        exploration_order.append(current)

        if current == goal:
            return path, nodes_explored, exploration_order

        for neighbor in sorted(graph.get(current, [])):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))

    return None, nodes_explored, exploration_order


#  DFS — Depth-First Search

def dfs(graph, start, goal):
    """
    Depth-First Search.
    Explores nodes by going as deep as possible before backtracking.
    Does NOT guarantee the shortest path.

    Returns: (path, nodes_explored, exploration_order)
    """
    if start not in graph or goal not in graph:
        return None, 0, []

    visited = set()
    stack = [(start, [start])]
    nodes_explored = 0
    exploration_order = []

    while stack:
        current, path = stack.pop()

        if current in visited:
            continue

        visited.add(current)
        nodes_explored += 1
        exploration_order.append(current)

        if current == goal:
            return path, nodes_explored, exploration_order

        # Push neighbors in reverse sorted order so that sorted order is explored first
        for neighbor in sorted(graph.get(current, []), reverse=True):
            if neighbor not in visited:
                stack.append((neighbor, path + [neighbor]))

    return None, nodes_explored, exploration_order


#  Flask Routes


@app.route("/")
def index():
    """Serve the main navigation page."""
    return render_template("index.html")


@app.route("/api/find-path", methods=["POST"])
def find_path():
    """
    Receive graph data, start, and goal — run BFS and DFS.

    Expected JSON:
    {
        "nodes": ["A", "B", "C", ...],
        "edges": [["A","B"], ["B","C"], ...],
        "start": "A",
        "goal": "C"
    }
    """
    data = request.get_json()
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    start = data.get("start", "")
    goal = data.get("goal", "")

    if not start or not goal:
        return jsonify({"error": "Start and Goal nodes are required"}), 400

    if start not in nodes or goal not in nodes:
        return jsonify({"error": "Start or Goal node not found in the graph"}), 400

    # Build adjacency list (undirected graph)
    graph = {node: [] for node in nodes}
    for edge in edges:
        a, b = edge[0], edge[1]
        if b not in graph[a]:
            graph[a].append(b)
        if a not in graph[b]:
            graph[b].append(a)

    # Run BFS
    start_time = time.perf_counter()
    bfs_path, bfs_nodes, bfs_order = bfs(graph, start, goal)
    bfs_time = (time.perf_counter() - start_time) * 1000

    # Run DFS
    start_time = time.perf_counter()
    dfs_path, dfs_nodes, dfs_order = dfs(graph, start, goal)
    dfs_time = (time.perf_counter() - start_time) * 1000

    # Determine optimality
    bfs_len = len(bfs_path) if bfs_path else 0
    dfs_len = len(dfs_path) if dfs_path else 0
    bfs_is_shorter = bfs_len <= dfs_len if (bfs_path and dfs_path) else False

    return jsonify({
        "bfs": {
            "path": bfs_path,
            "path_length": bfs_len,
            "nodes_explored": bfs_nodes,
            "exploration_order": bfs_order,
            "time_ms": round(bfs_time, 4),
            "is_optimal": True if bfs_path else False,
        },
        "dfs": {
            "path": dfs_path,
            "path_length": dfs_len,
            "nodes_explored": dfs_nodes,
            "exploration_order": dfs_order,
            "time_ms": round(dfs_time, 4),
            "is_optimal": bfs_len == dfs_len if (bfs_path and dfs_path) else (True if dfs_path else False),
        },
        "comparison": {
            "bfs_shorter": bfs_is_shorter,
            "path_difference": abs(bfs_len - dfs_len) if (bfs_path and dfs_path) else 0,
            "nodes_diff": abs(bfs_nodes - dfs_nodes),
            "bfs_explored_more": bfs_nodes > dfs_nodes,
        },
        "graph": graph,
    })



# Entry Point

if __name__ == "__main__":
    print("\n[*] Smart Navigation System")
    print("    Open http://127.0.0.1:5001 in your browser\n")
    app.run(debug=True, port=5001)
