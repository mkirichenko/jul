/**
 * Workflow Editor - native Canvas 2D
 * Visual editor for workflow automation, rendered directly on <canvas>.
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        canvas: {
            width: 1000,
            height: 700,
            backgroundColor: 'rgba(35, 41, 70, 1.0)'
        },
        grid: {
            size: 20,
            color: 'rgba(45, 53, 97, 0.3)'
        },
        zoom: {
            min: 0.25,
            max: 3,
            step: 0.1
        },
        nodes: {
            start: {
                width: 80, height: 80,
                fill: 'rgba(74, 222, 128, 0.25)',
                stroke: 'rgba(74, 222, 128, 0.6)',
                glowColor: 'rgba(74, 222, 128, 0.5)',
                accentColor: '#4ade80',
                shape: 'circle'
            },
            action: {
                width: 160, height: 80,
                fill: 'rgba(96, 165, 250, 0.2)',
                stroke: 'rgba(96, 165, 250, 0.5)',
                glowColor: 'rgba(96, 165, 250, 0.4)',
                accentColor: '#60a5fa',
                shape: 'rect'
            },
            condition: {
                width: 100, height: 100,
                fill: 'rgba(251, 191, 36, 0.2)',
                stroke: 'rgba(251, 191, 36, 0.5)',
                glowColor: 'rgba(251, 191, 36, 0.4)',
                accentColor: '#fbbf24',
                shape: 'diamond'
            },
            end: {
                width: 80, height: 80,
                fill: 'rgba(248, 113, 113, 0.25)',
                stroke: 'rgba(248, 113, 113, 0.6)',
                glowColor: 'rgba(248, 113, 113, 0.5)',
                accentColor: '#f87171',
                shape: 'circle'
            }
        },
        connection: {
            stroke: '#60a5fa',
            strokeWidth: 2
        },
        selection: {
            color: '#e94560',
            activeColor: '#4ade80',
            width: 2,
            padding: 6
        }
    };

    // ============================================
    // State
    // ============================================
    const state = {
        canvasEl: null,
        ctx: null,
        dpr: 1,
        viewport: { x: 0, y: 0, scale: 1 }, // world -> screen: screen = world * scale + translate
        nodes: new Map(),      // id -> node
        nodesOrder: [],        // rendering order (last = top)
        connections: [],       // { fromNodeId, toNodeId, portType }
        nodeIdCounter: 0,
        selectedNodeId: null,
        connectionMode: false,
        connectionStartId: null,
        drag: null,            // { nodeId, offsetX, offsetY, moved }
        rafId: null
    };

    // ============================================
    // Canvas setup + HiDPI
    // ============================================
    function initCanvas() {
        state.canvasEl = document.getElementById('workflow-canvas');
        state.ctx = state.canvasEl.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        setupCanvasEvents();
        requestRender();
    }

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = CONFIG.canvas;
        state.dpr = dpr;
        state.canvasEl.style.width = width + 'px';
        state.canvasEl.style.height = height + 'px';
        state.canvasEl.width = Math.round(width * dpr);
        state.canvasEl.height = Math.round(height * dpr);
        requestRender();
    }

    // ============================================
    // Coordinate helpers
    // ============================================
    function screenToWorld(sx, sy) {
        return {
            x: (sx - state.viewport.x) / state.viewport.scale,
            y: (sy - state.viewport.y) / state.viewport.scale
        };
    }

    function getCanvasPoint(e) {
        const rect = state.canvasEl.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    // ============================================
    // Render loop
    // ============================================
    function requestRender() {
        if (state.rafId !== null) return;
        state.rafId = requestAnimationFrame(() => {
            state.rafId = null;
            render();
        });
    }

    function render() {
        const ctx = state.ctx;
        const { dpr, viewport } = state;
        const w = state.canvasEl.width;
        const h = state.canvasEl.height;

        // Clear in device space
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = CONFIG.canvas.backgroundColor;
        ctx.fillRect(0, 0, w, h);

        // World transform: combine DPR with viewport transform in one matrix
        const s = dpr * viewport.scale;
        ctx.setTransform(s, 0, 0, s, dpr * viewport.x, dpr * viewport.y);

        drawGrid(ctx);

        // Connections render beneath nodes
        for (const conn of state.connections) drawConnection(ctx, conn);

        for (const id of state.nodesOrder) {
            const node = state.nodes.get(id);
            if (node) drawNode(ctx, node);
        }
    }

    // ============================================
    // Grid
    // ============================================
    function drawGrid(ctx) {
        const { width, height } = CONFIG.canvas;
        const { size, color } = CONFIG.grid;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 / state.viewport.scale;

        const topLeft = screenToWorld(0, 0);
        const bottomRight = screenToWorld(width, height);
        const startX = Math.ceil(topLeft.x / size) * size;
        const endX = Math.ceil(bottomRight.x / size) * size;
        const startY = Math.ceil(topLeft.y / size) * size;
        const endY = Math.ceil(bottomRight.y / size) * size;

        ctx.beginPath();
        for (let x = startX; x <= endX; x += size) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += size) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    }

    // ============================================
    // Node drawing
    // ============================================
    function pathNodeShape(ctx, cfg) {
        ctx.beginPath();
        switch (cfg.shape) {
            case 'circle':
                ctx.arc(0, 0, cfg.width / 2, 0, Math.PI * 2);
                break;
            case 'diamond': {
                const d = (cfg.width * 0.7) / Math.SQRT2;
                ctx.moveTo(0, -d);
                ctx.lineTo(d, 0);
                ctx.lineTo(0, d);
                ctx.lineTo(-d, 0);
                ctx.closePath();
                break;
            }
            case 'rect':
            default:
                roundRectPath(ctx, -cfg.width / 2, -cfg.height / 2, cfg.width, cfg.height, 12);
                break;
        }
    }

    function pathHighlight(ctx, cfg) {
        ctx.beginPath();
        switch (cfg.shape) {
            case 'circle':
                ellipsePath(ctx, 0, -cfg.height / 6, cfg.width / 3, cfg.width / 6);
                break;
            case 'diamond': {
                const w = cfg.width * 0.35;
                const h = cfg.height * 0.15;
                const cy = -cfg.height / 5;
                ctx.save();
                ctx.translate(0, cy);
                ctx.rotate(Math.PI / 4);
                roundRectPath(ctx, -w / 2, -h / 2, w, h, 4);
                ctx.restore();
                break;
            }
            case 'rect':
            default: {
                const w = cfg.width - 20;
                const h = 8;
                const cy = -cfg.height / 2 + 12;
                roundRectPath(ctx, -w / 2, cy - h / 2, w, h, 4);
                break;
            }
        }
    }

    function drawNode(ctx, node) {
        const cfg = CONFIG.nodes[node.type];
        ctx.save();
        ctx.translate(node.x, node.y);

        // Main shape with glow
        ctx.shadowColor = cfg.glowColor;
        ctx.shadowBlur = 20;
        ctx.fillStyle = cfg.fill;
        pathNodeShape(ctx, cfg);
        ctx.fill();
        // Crisp stroke without shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = cfg.stroke;
        ctx.lineWidth = 2;
        pathNodeShape(ctx, cfg);
        ctx.stroke();

        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        pathHighlight(ctx, cfg);
        ctx.fill();

        // Ports
        drawNodePorts(ctx, node, cfg);

        // Label
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.data.label || getDefaultLabel(node.type), 0, 0);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Selection / active-connection border
        const isSelected = state.selectedNodeId === node.id;
        const isConnStart = state.connectionStartId === node.id;
        if (isSelected || isConnStart) {
            ctx.strokeStyle = isConnStart ? CONFIG.selection.activeColor : CONFIG.selection.color;
            ctx.lineWidth = CONFIG.selection.width * 2;
            pathSelectionBounds(ctx, cfg);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawNodePorts(ctx, node, cfg) {
        const portOffset = cfg.shape === 'diamond' ? 10 : 6;
        if (node.type !== 'start') {
            drawPort(ctx, 0, -cfg.height / 2 - portOffset, cfg.accentColor);
        }
        if (node.type !== 'end') {
            if (node.type === 'condition') {
                drawPort(ctx, cfg.width / 2 + 10, 0, '#4ade80');
                drawPort(ctx, -cfg.width / 2 - 10, 0, '#f87171');
            } else {
                drawPort(ctx, 0, cfg.height / 2 + portOffset, cfg.accentColor);
            }
        }
    }

    function drawPort(ctx, x, y, color) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function pathSelectionBounds(ctx, cfg) {
        const p = CONFIG.selection.padding;
        let w, h;
        if (cfg.shape === 'circle') {
            w = cfg.width + p * 2;
            h = cfg.height + p * 2;
        } else if (cfg.shape === 'diamond') {
            // axis-aligned bbox around the rotated square's extent + port extent
            const d = (cfg.width * 0.7) / Math.SQRT2;
            w = d * 2 + p * 2;
            h = d * 2 + p * 2;
        } else {
            w = cfg.width + p * 2;
            h = cfg.height + p * 2;
        }
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
    }

    // ============================================
    // Path helpers
    // ============================================
    function roundRectPath(ctx, x, y, w, h, r) {
        const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.arcTo(x + w, y, x + w, y + rr, rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
        ctx.lineTo(x + rr, y + h);
        ctx.arcTo(x, y + h, x, y + h - rr, rr);
        ctx.lineTo(x, y + rr);
        ctx.arcTo(x, y, x + rr, y, rr);
        ctx.closePath();
    }

    function ellipsePath(ctx, cx, cy, rx, ry) {
        if (typeof ctx.ellipse === 'function') {
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        } else {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(rx, ry);
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.restore();
        }
    }

    // ============================================
    // Node creation / management
    // ============================================
    function createNode(type, x, y) {
        if (!CONFIG.nodes[type]) return null;
        const id = `node_${state.nodeIdCounter++}`;
        const node = {
            id,
            type,
            x, y,
            data: {
                label: getDefaultLabel(type),
                description: '',
                actionType: type === 'action' ? 'http' : null,
                condition: type === 'condition' ? '' : null
            }
        };
        state.nodes.set(id, node);
        state.nodesOrder.push(id);
        selectNode(id);
        requestRender();
        return node;
    }

    function getDefaultLabel(type) {
        switch (type) {
            case 'start': return 'Start';
            case 'action': return 'Action';
            case 'condition': return 'Condition';
            case 'end': return 'End';
            default: return 'Node';
        }
    }

    function bringToFront(id) {
        const idx = state.nodesOrder.indexOf(id);
        if (idx === -1 || idx === state.nodesOrder.length - 1) return;
        state.nodesOrder.splice(idx, 1);
        state.nodesOrder.push(id);
    }

    // ============================================
    // Hit testing
    // ============================================
    function hitTestNode(wx, wy) {
        // Top-down: iterate in reverse z-order
        for (let i = state.nodesOrder.length - 1; i >= 0; i--) {
            const node = state.nodes.get(state.nodesOrder[i]);
            if (!node) continue;
            if (pointInNode(wx, wy, node)) return node;
        }
        return null;
    }

    function pointInNode(wx, wy, node) {
        const cfg = CONFIG.nodes[node.type];
        const dx = wx - node.x;
        const dy = wy - node.y;
        switch (cfg.shape) {
            case 'circle': {
                const r = cfg.width / 2;
                return dx * dx + dy * dy <= r * r;
            }
            case 'diamond': {
                const d = (cfg.width * 0.7) / Math.SQRT2;
                return Math.abs(dx) + Math.abs(dy) <= d;
            }
            case 'rect':
            default:
                return Math.abs(dx) <= cfg.width / 2 && Math.abs(dy) <= cfg.height / 2;
        }
    }

    // ============================================
    // Connection routing (orthogonal)
    // ============================================
    const ROUTE_STUB = 25;

    function getPortDirection(portType) {
        switch (portType) {
            case 'output':       return { dx: 0, dy: 1 };
            case 'output-true':  return { dx: 1, dy: 0 };
            case 'output-false': return { dx: -1, dy: 0 };
            case 'input':        return { dx: 0, dy: -1 };
            default:             return { dx: 0, dy: 1 };
        }
    }

    function buildOrthogonalRoute(from, to, fromPortType) {
        const dir = getPortDirection(fromPortType);
        const stub = { x: from.x + dir.dx * ROUTE_STUB, y: from.y + dir.dy * ROUTE_STUB };
        const entry = { x: to.x, y: to.y - ROUTE_STUB };
        const points = [from, stub];

        if (dir.dy !== 0) {
            if (stub.y < entry.y) {
                const midY = (stub.y + entry.y) / 2;
                points.push({ x: stub.x, y: midY });
                points.push({ x: entry.x, y: midY });
            } else {
                const detourX = from.x <= to.x
                    ? Math.min(from.x, to.x) - 60
                    : Math.max(from.x, to.x) + 60;
                points.push({ x: detourX, y: stub.y });
                points.push({ x: detourX, y: entry.y });
            }
        } else {
            const targetAhead = dir.dx > 0 ? stub.x < entry.x : stub.x > entry.x;
            if (targetAhead) {
                points.push({ x: entry.x, y: stub.y });
            } else {
                const midY = (stub.y + entry.y) / 2;
                points.push({ x: stub.x, y: midY });
                points.push({ x: entry.x, y: midY });
            }
        }

        points.push(entry, to);
        return deduplicatePoints(points);
    }

    function deduplicatePoints(points) {
        return points.filter((p, i) =>
            i === 0 || Math.abs(p.x - points[i - 1].x) > 0.5 || Math.abs(p.y - points[i - 1].y) > 0.5
        );
    }

    function getPortPosition(node, portType) {
        const cfg = CONFIG.nodes[node.type];
        switch (portType) {
            case 'input':
                return { x: node.x, y: node.y - cfg.height / 2 - 6 };
            case 'output':
                return { x: node.x, y: node.y + cfg.height / 2 + 6 };
            case 'output-true':
                return { x: node.x + cfg.width / 2 + 10, y: node.y };
            case 'output-false':
                return { x: node.x - cfg.width / 2 - 10, y: node.y };
            default:
                return null;
        }
    }

    function getConnectionColor(portType) {
        if (portType === 'output-true') return '#4ade80';
        if (portType === 'output-false') return '#f87171';
        return CONFIG.connection.stroke;
    }

    function drawConnection(ctx, conn) {
        const fromNode = state.nodes.get(conn.fromNodeId);
        const toNode = state.nodes.get(conn.toNodeId);
        if (!fromNode || !toNode) return;

        const from = getPortPosition(fromNode, conn.portType);
        const to = getPortPosition(toNode, 'input');
        if (!from || !to) return;

        const points = buildOrthogonalRoute(from, to, conn.portType);
        const color = getConnectionColor(conn.portType);

        ctx.strokeStyle = color;
        ctx.lineWidth = CONFIG.connection.strokeWidth;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        drawArrowHead(ctx, points, color);
    }

    function drawArrowHead(ctx, points, color) {
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        const dx = last.x - prev.x;
        const dy = last.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len;
        const ny = dy / len;
        // Arrow: 12 wide, 10 tall; tip just shy of `last` so it sits outside the port visually
        const tipX = last.x - nx * 3;
        const tipY = last.y - ny * 3;
        const baseX = tipX - nx * 10;
        const baseY = tipY - ny * 10;
        const px = -ny;
        const py = nx;
        const halfW = 6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX + px * halfW, baseY + py * halfW);
        ctx.lineTo(baseX - px * halfW, baseY - py * halfW);
        ctx.closePath();
        ctx.fill();
    }

    function createConnection(fromNode, toNode, portType = 'output') {
        if (!fromNode || !toNode) return null;
        const conn = {
            fromNodeId: fromNode.id,
            toNodeId: toNode.id,
            portType
        };
        state.connections.push(conn);
        requestRender();
        return conn;
    }

    // ============================================
    // Selection
    // ============================================
    function selectNode(id) {
        const changed = state.selectedNodeId !== id;
        state.selectedNodeId = id;
        if (id) bringToFront(id);
        if (changed) {
            if (id) showProperties(state.nodes.get(id));
            else hideProperties();
        }
        requestRender();
    }

    function deselect() {
        if (state.selectedNodeId !== null) {
            state.selectedNodeId = null;
            hideProperties();
            requestRender();
        }
    }

    // ============================================
    // Connection mode
    // ============================================
    function startConnectionMode(node) {
        if (node.type === 'end') return;
        state.connectionMode = true;
        state.connectionStartId = node.id;
        state.canvasEl.style.cursor = 'crosshair';
        requestRender();
    }

    function completeConnection(toNode) {
        const fromNode = state.nodes.get(state.connectionStartId);
        if (!fromNode || !toNode) {
            cancelConnectionMode();
            return;
        }
        if (toNode.type === 'start' || toNode.id === fromNode.id) {
            cancelConnectionMode();
            return;
        }

        let portType = 'output';
        if (fromNode.type === 'condition') {
            portType = toNode.x >= fromNode.x ? 'output-true' : 'output-false';
        }
        createConnection(fromNode, toNode, portType);
        cancelConnectionMode();
    }

    function cancelConnectionMode() {
        state.connectionMode = false;
        state.connectionStartId = null;
        state.canvasEl.style.cursor = '';
        requestRender();
    }

    // ============================================
    // Canvas events
    // ============================================
    function setupCanvasEvents() {
        const el = state.canvasEl;

        el.addEventListener('mousedown', (e) => {
            const p = getCanvasPoint(e);
            const w = screenToWorld(p.x, p.y);
            const node = hitTestNode(w.x, w.y);

            if (state.connectionMode) {
                if (node && node.id !== state.connectionStartId) {
                    completeConnection(node);
                } else {
                    cancelConnectionMode();
                }
                return;
            }

            if (node) {
                selectNode(node.id);
                state.drag = {
                    nodeId: node.id,
                    offsetX: w.x - node.x,
                    offsetY: w.y - node.y,
                    moved: false
                };
            } else {
                deselect();
            }
        });

        el.addEventListener('mousemove', (e) => {
            if (!state.drag) return;
            const p = getCanvasPoint(e);
            const w = screenToWorld(p.x, p.y);
            const node = state.nodes.get(state.drag.nodeId);
            if (!node) { state.drag = null; return; }
            node.x = w.x - state.drag.offsetX;
            node.y = w.y - state.drag.offsetY;
            state.drag.moved = true;
            requestRender();
        });

        const endDrag = () => { state.drag = null; };
        el.addEventListener('mouseup', endDrag);
        el.addEventListener('mouseleave', endDrag);

        el.addEventListener('dblclick', (e) => {
            const p = getCanvasPoint(e);
            const w = screenToWorld(p.x, p.y);
            const node = hitTestNode(w.x, w.y);
            if (node) startConnectionMode(node);
        });

        document.addEventListener('keydown', (e) => {
            const active = document.activeElement;
            const tag = active && active.tagName;
            const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable);
            if (typing) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteSelected();
                return;
            }
            if (e.key === 'Escape' && state.connectionMode) {
                cancelConnectionMode();
                return;
            }

            const step = e.shiftKey ? 100 : 30;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowLeft')  dx =  step;
            if (e.key === 'ArrowRight') dx = -step;
            if (e.key === 'ArrowUp')    dy =  step;
            if (e.key === 'ArrowDown')  dy = -step;
            if (dx || dy) {
                state.viewport.x += dx;
                state.viewport.y += dy;
                e.preventDefault();
                requestRender();
            }
        });

        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            const p = getCanvasPoint(e);
            const world = screenToWorld(p.x, p.y);
            let zoom = state.viewport.scale * (0.999 ** e.deltaY);
            zoom = Math.min(Math.max(zoom, CONFIG.zoom.min), CONFIG.zoom.max);
            // Pin the same world point under the cursor
            state.viewport.scale = zoom;
            state.viewport.x = p.x - world.x * zoom;
            state.viewport.y = p.y - world.y * zoom;
            updateZoomDisplay();
            requestRender();
        }, { passive: false });
    }

    // ============================================
    // Zoom controls
    // ============================================
    function zoomAtCenter(newScale) {
        const cx = CONFIG.canvas.width / 2;
        const cy = CONFIG.canvas.height / 2;
        const world = screenToWorld(cx, cy);
        state.viewport.scale = newScale;
        state.viewport.x = cx - world.x * newScale;
        state.viewport.y = cy - world.y * newScale;
        updateZoomDisplay();
        requestRender();
    }

    function zoomIn() {
        const z = Math.min(state.viewport.scale + CONFIG.zoom.step, CONFIG.zoom.max);
        zoomAtCenter(z);
    }

    function zoomOut() {
        const z = Math.max(state.viewport.scale - CONFIG.zoom.step, CONFIG.zoom.min);
        zoomAtCenter(z);
    }

    function zoomReset() {
        state.viewport = { x: 0, y: 0, scale: 1 };
        updateZoomDisplay();
        requestRender();
    }

    function updateZoomDisplay() {
        const display = document.getElementById('zoom-level');
        if (display) display.textContent = Math.round(state.viewport.scale * 100) + '%';
    }

    // ============================================
    // Property panel
    // ============================================
    function showProperties(node) {
        const panel = document.getElementById('properties-panel');
        const noSelection = panel.querySelector('.no-selection');
        const form = panel.querySelector('.properties-form');
        const conditionGroup = panel.querySelector('.condition-only');
        const actionGroup = panel.querySelector('.action-only');

        noSelection.style.display = 'none';
        form.style.display = 'flex';
        conditionGroup.style.display = node.type === 'condition' ? 'flex' : 'none';
        actionGroup.style.display = node.type === 'action' ? 'flex' : 'none';

        document.getElementById('node-label').value = node.data.label || '';
        document.getElementById('node-description').value = node.data.description || '';
        if (node.type === 'condition') {
            document.getElementById('node-condition').value = node.data.condition || '';
        }
        if (node.type === 'action') {
            document.getElementById('node-action-type').value = node.data.actionType || 'http';
        }
    }

    function hideProperties() {
        const panel = document.getElementById('properties-panel');
        panel.querySelector('.no-selection').style.display = 'block';
        panel.querySelector('.properties-form').style.display = 'none';
    }

    function setupPropertyListeners() {
        document.getElementById('node-label').addEventListener('input', (e) => {
            const node = state.nodes.get(state.selectedNodeId);
            if (!node) return;
            node.data.label = e.target.value;
            requestRender();
        });

        document.getElementById('node-description').addEventListener('input', (e) => {
            const node = state.nodes.get(state.selectedNodeId);
            if (!node) return;
            node.data.description = e.target.value;
        });

        document.getElementById('node-condition').addEventListener('input', (e) => {
            const node = state.nodes.get(state.selectedNodeId);
            if (node && node.type === 'condition') node.data.condition = e.target.value;
        });

        document.getElementById('node-action-type').addEventListener('change', (e) => {
            const node = state.nodes.get(state.selectedNodeId);
            if (node && node.type === 'action') node.data.actionType = e.target.value;
        });
    }

    // ============================================
    // Toolbar actions
    // ============================================
    function deleteSelected() {
        const id = state.selectedNodeId;
        if (!id) return;
        state.connections = state.connections.filter(c => c.fromNodeId !== id && c.toNodeId !== id);
        state.nodes.delete(id);
        state.nodesOrder = state.nodesOrder.filter(n => n !== id);
        state.selectedNodeId = null;
        hideProperties();
        requestRender();
    }

    function clearCanvas() {
        if (!confirm('Are you sure you want to clear the entire canvas?')) return;
        state.nodes.clear();
        state.nodesOrder = [];
        state.connections = [];
        state.nodeIdCounter = 0;
        state.selectedNodeId = null;
        hideProperties();
        requestRender();
    }

    // ============================================
    // Drag-and-drop from palette
    // ============================================
    function setupDragAndDrop() {
        const paletteItems = document.querySelectorAll('.palette-item');
        const canvasWrapper = document.querySelector('.canvas-wrapper');

        paletteItems.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', item.dataset.nodeType);
            });
            item.addEventListener('click', () => {
                const type = item.dataset.nodeType;
                const cx = CONFIG.canvas.width / 2;
                const cy = CONFIG.canvas.height / 2;
                const world = screenToWorld(cx, cy);
                createNode(type, world.x + (Math.random() - 0.5) * 200, world.y + (Math.random() - 0.5) * 200);
            });
        });

        canvasWrapper.addEventListener('dragover', (e) => e.preventDefault());
        canvasWrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('nodeType');
            if (!type) return;
            const rect = state.canvasEl.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const world = screenToWorld(sx, sy);
            createNode(type, world.x, world.y);
        });
    }

    // ============================================
    // Init
    // ============================================
    function init() {
        initCanvas();
        setupDragAndDrop();
        setupPropertyListeners();

        document.getElementById('btn-delete').addEventListener('click', deleteSelected);
        document.getElementById('btn-clear').addEventListener('click', clearCanvas);
        document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
        document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);
        document.getElementById('btn-zoom-reset').addEventListener('click', zoomReset);

        createSampleWorkflow();
    }

    function createSampleWorkflow() {
        const startNode = createNode('start', 500, 80);
        const actionNode = createNode('action', 500, 220);
        const conditionNode = createNode('condition', 500, 380);
        const action2Node = createNode('action', 700, 520);
        const endNode = createNode('end', 300, 520);

        createConnection(startNode, actionNode);
        createConnection(actionNode, conditionNode);
        createConnection(conditionNode, action2Node, 'output-true');
        createConnection(conditionNode, endNode, 'output-false');

        // Clear initial selection so the user starts fresh
        state.selectedNodeId = null;
        hideProperties();
        requestRender();
    }

    document.addEventListener('DOMContentLoaded', init);

    // ============================================
    // Public API
    // ============================================
    window.WorkflowEditor = {
        createNode,
        createConnection,
        deleteSelected,
        clearCanvas,
        zoomIn,
        zoomOut,
        zoomReset,
        getZoom: () => state.viewport.scale,
        getNodes: () => Array.from(state.nodes.values()),
        getConnections: () => state.connections.slice(),
        exportWorkflow: () => ({
            nodes: Array.from(state.nodes.values()).map(n => ({
                id: n.id,
                type: n.type,
                position: { x: n.x, y: n.y },
                data: n.data
            })),
            connections: state.connections.map(c => ({
                from: c.fromNodeId,
                to: c.toNodeId,
                portType: c.portType
            }))
        })
    };
})();
