/**
 * Smart Navigation — Interactive Graph Builder + BFS/DFS Visualization
 */

// ─── State ─────────────────────────────────
let nodes = [];       // { id, name, x, y }
let edges = [];       // { from, to }
let startNode = null;
let goalNode = null;
let mode = "node";    // "node", "edge", "start", "goal"
let edgeFirst = null; // First node clicked when adding edge
let nodeCounter = 0;
let bfsResult = null;
let dfsResult = null;

const NODE_RADIUS = 22;
const COLORS = {
    node: "#818cf8",
    nodeStroke: "#6366f1",
    start: "#34d399",
    goal: "#f87171",
    edge: "rgba(129,140,248,0.3)",
    edgeHighlight: "#818cf8",
    bfsPath: "#22d3ee",
    dfsPath: "#f59e0b",
    text: "#e8e8f0",
    textDark: "#0a0a0f",
    bg: "#12121a",
    hoverRing: "rgba(129,140,248,0.25)",
};

// ─── Canvas Setup ──────────────────────────
const canvas = document.getElementById("graph-canvas");
const ctx = canvas.getContext("2d");
let canvasRect = canvas.getBoundingClientRect();

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = 460;
    canvasRect = canvas.getBoundingClientRect();
    draw();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ─── Mouse Events ──────────────────────────
let hoveredNode = null;

canvas.addEventListener("mousemove", (e) => {
    const { x, y } = getCanvasPos(e);
    hoveredNode = findNodeAt(x, y);
    canvas.style.cursor = hoveredNode ? "pointer" : "crosshair";
    draw();
});

canvas.addEventListener("click", (e) => {
    const { x, y } = getCanvasPos(e);
    const clicked = findNodeAt(x, y);

    if (mode === "node") {
        if (!clicked) {
            addNode(x, y);
        }
    } else if (mode === "edge") {
        if (clicked) {
            if (!edgeFirst) {
                edgeFirst = clicked;
                updateHint("Now click the second node to connect");
            } else {
                if (edgeFirst.id !== clicked.id) {
                    addEdge(edgeFirst, clicked);
                }
                edgeFirst = null;
                updateHint("Click a node to start an edge");
            }
        }
    } else if (mode === "start") {
        if (clicked) {
            startNode = clicked;
            document.getElementById("start-display").textContent = clicked.name;
            checkRunnable();
        }
    } else if (mode === "goal") {
        if (clicked) {
            goalNode = clicked;
            document.getElementById("goal-display").textContent = clicked.name;
            checkRunnable();
        }
    }
    draw();
});

// ─── Helpers ───────────────────────────────
function getCanvasPos(e) {
    canvasRect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - canvasRect.left) * (canvas.width / canvasRect.width),
        y: (e.clientY - canvasRect.top) * (canvas.height / canvasRect.height),
    };
}

function findNodeAt(x, y) {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dist = Math.hypot(n.x - x, n.y - y);
        if (dist <= NODE_RADIUS + 4) return n;
    }
    return null;
}

function addNode(x, y) {
    nodeCounter++;
    const name = String.fromCharCode(64 + nodeCounter); // A, B, C, ...
    if (nodeCounter > 26) return; // max 26 nodes
    nodes.push({ id: nodeCounter, name, x, y });
    draw();
}

function addEdge(a, b) {
    // Check for duplicate
    const exists = edges.some(
        (e) => (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id)
    );
    if (!exists) {
        edges.push({ from: a.id, to: b.id });
    }
    draw();
}

function checkRunnable() {
    const btn = document.getElementById("btn-run");
    btn.disabled = !(startNode && goalNode && nodes.length >= 2 && edges.length >= 1);
}

function updateHint(text) {
    document.getElementById("canvas-hint").textContent = text;
}

// ─── Drawing ───────────────────────────────
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid dots
    ctx.fillStyle = "rgba(129,140,248,0.04)";
    for (let gx = 30; gx < canvas.width; gx += 40) {
        for (let gy = 30; gy < canvas.height; gy += 40) {
            ctx.beginPath();
            ctx.arc(gx, gy, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw edges
    edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.from);
        const b = nodes.find((n) => n.id === e.to);
        if (!a || !b) return;

        const isBFS = bfsResult && isEdgeInPath(bfsResult, a.name, b.name);
        const isDFS = dfsResult && isEdgeInPath(dfsResult, a.name, b.name);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (isBFS && isDFS) {
            ctx.strokeStyle = COLORS.edgeHighlight;
            ctx.lineWidth = 3;
        } else if (isBFS) {
            ctx.strokeStyle = COLORS.bfsPath;
            ctx.lineWidth = 3;
        } else if (isDFS) {
            ctx.strokeStyle = COLORS.dfsPath;
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = COLORS.edge;
            ctx.lineWidth = 1.5;
        }
        ctx.stroke();
    });

    // Edge-mode highlight
    if (mode === "edge" && edgeFirst && hoveredNode && edgeFirst.id !== hoveredNode.id) {
        ctx.beginPath();
        ctx.moveTo(edgeFirst.x, edgeFirst.y);
        ctx.lineTo(hoveredNode.x, hoveredNode.y);
        ctx.strokeStyle = "rgba(129,140,248,0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw nodes
    nodes.forEach((n) => {
        const isStart = startNode && startNode.id === n.id;
        const isGoal = goalNode && goalNode.id === n.id;
        const isHovered = hoveredNode && hoveredNode.id === n.id;
        const isEdgeSelected = mode === "edge" && edgeFirst && edgeFirst.id === n.id;

        let fillColor = COLORS.node;
        if (isStart) fillColor = COLORS.start;
        if (isGoal) fillColor = COLORS.goal;

        // Glow ring
        if (isHovered || isEdgeSelected) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS + 8, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.hoverRing;
            ctx.fill();
        }

        // Shadow
        ctx.beginPath();
        ctx.arc(n.x, n.y + 2, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(n.x - 5, n.y - 5, 2, n.x, n.y, NODE_RADIUS);
        grad.addColorStop(0, lighten(fillColor, 30));
        grad.addColorStop(1, fillColor);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border
        ctx.strokeStyle = isStart ? COLORS.start : isGoal ? COLORS.goal : COLORS.nodeStroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.name, n.x, n.y);

        // Start/Goal labels
        if (isStart) {
            ctx.fillStyle = COLORS.start;
            ctx.font = "600 10px Inter";
            ctx.fillText("START", n.x, n.y + NODE_RADIUS + 14);
        }
        if (isGoal) {
            ctx.fillStyle = COLORS.goal;
            ctx.font = "600 10px Inter";
            ctx.fillText("GOAL", n.x, n.y + NODE_RADIUS + 14);
        }
    });
}

function isEdgeInPath(pathResult, nameA, nameB) {
    if (!pathResult || !pathResult.path) return false;
    const p = pathResult.path;
    for (let i = 0; i < p.length - 1; i++) {
        if ((p[i] === nameA && p[i+1] === nameB) || (p[i] === nameB && p[i+1] === nameA)) {
            return true;
        }
    }
    return false;
}

function lighten(hex, pct) {
    const num = parseInt(hex.replace("#",""), 16);
    const r = Math.min(255, (num >> 16) + pct);
    const g = Math.min(255, ((num >> 8) & 0xff) + pct);
    const b = Math.min(255, (num & 0xff) + pct);
    return `rgb(${r},${g},${b})`;
}

// ─── Mode Switching ────────────────────────
function setMode(m) {
    mode = m;
    edgeFirst = null;
    document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
    const btnMap = { node: "btn-add-node", edge: "btn-add-edge", start: "btn-set-start", goal: "btn-set-goal" };
    const btn = document.getElementById(btnMap[m]);
    if (btn) btn.classList.add("active");

    const hints = {
        node: "Click on the canvas to add nodes",
        edge: "Click a node to start an edge",
        start: "Click a node to set as Start",
        goal: "Click a node to set as Goal",
    };
    updateHint(hints[m] || "");
    draw();
}

// ─── Clear ─────────────────────────────────
function clearGraph() {
    nodes = []; edges = []; startNode = null; goalNode = null;
    edgeFirst = null; nodeCounter = 0;
    bfsResult = null; dfsResult = null;
    document.getElementById("start-display").textContent = "Not set";
    document.getElementById("goal-display").textContent = "Not set";
    document.getElementById("btn-run").disabled = true;
    document.getElementById("compare-panel").style.display = "none";
    resetResults();
    draw();
}

function resetResults() {
    ["bfs-path","bfs-len","bfs-nodes","bfs-time","bfs-optimal","dfs-path","dfs-len","dfs-nodes","dfs-time","dfs-optimal"].forEach((id) => {
        document.getElementById(id).textContent = "—";
    });
    document.getElementById("bfs-order").innerHTML = "";
    document.getElementById("dfs-order").innerHTML = "";
}

// ─── Presets ───────────────────────────────
function loadPreset(type) {
    clearGraph();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (type === "simple") {
        const positions = [
            { x: cx-200, y: cy-80 }, { x: cx-60, y: cy-120 },
            { x: cx+80, y: cy-80 }, { x: cx-120, y: cy+60 },
            { x: cx+40, y: cy+80 }, { x: cx+180, y: cy },
        ];
        positions.forEach((p) => addNode(p.x, p.y));
        [[1,2],[2,3],[3,6],[1,4],[4,5],[5,6],[2,5],[2,4]].forEach(([a,b]) => {
            edges.push({ from: a, to: b });
        });
        startNode = nodes[0]; goalNode = nodes[5];
    } else if (type === "complex") {
        const positions = [
            { x: cx-250, y: cy-100 }, { x: cx-120, y: cy-140 },
            { x: cx+20, y: cy-100 }, { x: cx+160, y: cy-130 },
            { x: cx-180, y: cy+20 }, { x: cx-40, y: cy },
            { x: cx+100, y: cy+20 }, { x: cx+230, y: cy-20 },
            { x: cx-100, y: cy+120 }, { x: cx+60, y: cy+130 },
        ];
        positions.forEach((p) => addNode(p.x, p.y));
        [[1,2],[2,3],[3,4],[1,5],[2,6],[3,7],[4,8],[5,6],[6,7],[5,9],[6,10],[7,8],[9,10]].forEach(([a,b]) => {
            edges.push({ from: a, to: b });
        });
        startNode = nodes[0]; goalNode = nodes[7];
    } else if (type === "grid") {
        const size = 3;
        const spacing = 100;
        const ox = cx - spacing;
        const oy = cy - spacing;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                addNode(ox + c * spacing, oy + r * spacing);
            }
        }
        // Horizontal edges
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                edges.push({ from: r * size + c + 1, to: r * size + c + 2 });
            }
        }
        // Vertical edges
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                edges.push({ from: r * size + c + 1, to: (r + 1) * size + c + 1 });
            }
        }
        startNode = nodes[0]; goalNode = nodes[nodes.length - 1];
    }

    document.getElementById("start-display").textContent = startNode ? startNode.name : "Not set";
    document.getElementById("goal-display").textContent = goalNode ? goalNode.name : "Not set";
    checkRunnable();
    draw();
}

// ─── Run Pathfinding ───────────────────────
async function runPathfinding() {
    if (!startNode || !goalNode) return;

    const nodeNames = nodes.map((n) => n.name);
    const edgeNames = edges.map((e) => {
        const a = nodes.find((n) => n.id === e.from);
        const b = nodes.find((n) => n.id === e.to);
        return [a.name, b.name];
    });

    try {
        const res = await fetch("/api/find-path", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nodes: nodeNames,
                edges: edgeNames,
                start: startNode.name,
                goal: goalNode.name,
            }),
        });
        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        bfsResult = data.bfs;
        dfsResult = data.dfs;
        displayResults(data);
        draw();
    } catch (err) {
        console.error(err);
        alert("Error connecting to server");
    }
}

function displayResults(data) {
    const bfs = data.bfs;
    const dfs = data.dfs;

    // BFS
    document.getElementById("bfs-path").textContent = bfs.path ? bfs.path.join(" → ") : "No path found";
    document.getElementById("bfs-len").textContent = bfs.path ? bfs.path_length + " nodes" : "—";
    document.getElementById("bfs-nodes").textContent = bfs.nodes_explored;
    document.getElementById("bfs-time").textContent = bfs.time_ms.toFixed(3) + " ms";
    document.getElementById("bfs-optimal").textContent = bfs.is_optimal ? "✓ Yes" : "✗ No";
    document.getElementById("bfs-optimal").style.color = bfs.is_optimal ? "#34d399" : "#f87171";
    renderOrder("bfs-order", bfs.exploration_order, bfs.path);

    // DFS
    document.getElementById("dfs-path").textContent = dfs.path ? dfs.path.join(" → ") : "No path found";
    document.getElementById("dfs-len").textContent = dfs.path ? dfs.path_length + " nodes" : "—";
    document.getElementById("dfs-nodes").textContent = dfs.nodes_explored;
    document.getElementById("dfs-time").textContent = dfs.time_ms.toFixed(3) + " ms";
    document.getElementById("dfs-optimal").textContent = dfs.is_optimal ? "✓ Yes" : "✗ No";
    document.getElementById("dfs-optimal").style.color = dfs.is_optimal ? "#34d399" : "#f87171";
    renderOrder("dfs-order", dfs.exploration_order, dfs.path);

    // Comparison
    const cmp = data.comparison;
    document.getElementById("compare-panel").style.display = "block";
    document.getElementById("cmp-shorter").textContent = cmp.bfs_shorter ? "BFS" : (cmp.path_difference === 0 ? "Equal" : "DFS");
    document.getElementById("cmp-fewer").textContent = cmp.bfs_explored_more ? "DFS" : (cmp.nodes_diff === 0 ? "Equal" : "BFS");
    document.getElementById("cmp-diff").textContent = cmp.path_difference + " node(s)";

    // Bars
    const maxN = Math.max(bfs.nodes_explored, dfs.nodes_explored, 1);
    document.getElementById("bar-bfs").style.width = ((bfs.nodes_explored / maxN) * 100) + "%";
    document.getElementById("bar-dfs").style.width = ((dfs.nodes_explored / maxN) * 100) + "%";
    document.getElementById("bar-bfs-val").textContent = bfs.nodes_explored;
    document.getElementById("bar-dfs-val").textContent = dfs.nodes_explored;
}

function renderOrder(containerId, order, path) {
    const container = document.getElementById(containerId);
    container.innerHTML = order.map((n) => {
        const inPath = path && path.includes(n);
        return `<span class="eo-node${inPath ? ' in-path' : ''}">${n}</span>`;
    }).join("");
}

// Initial draw
draw();
