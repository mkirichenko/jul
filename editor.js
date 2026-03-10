/**
 * Workflow Editor - Built with Fabric.js
 * A visual editor for workflow automation
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
            backgroundColor: 'rgba(35, 41, 70, 0.95)'
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
                width: 80,
                height: 80,
                fill: 'rgba(74, 222, 128, 0.25)',
                stroke: 'rgba(74, 222, 128, 0.6)',
                glowColor: 'rgba(74, 222, 128, 0.5)',
                accentColor: '#4ade80',
                shape: 'circle'
            },
            action: {
                width: 160,
                height: 80,
                fill: 'rgba(96, 165, 250, 0.2)',
                stroke: 'rgba(96, 165, 250, 0.5)',
                glowColor: 'rgba(96, 165, 250, 0.4)',
                accentColor: '#60a5fa',
                shape: 'rect'
            },
            condition: {
                width: 100,
                height: 100,
                fill: 'rgba(251, 191, 36, 0.2)',
                stroke: 'rgba(251, 191, 36, 0.5)',
                glowColor: 'rgba(251, 191, 36, 0.4)',
                accentColor: '#fbbf24',
                shape: 'diamond'
            },
            end: {
                width: 80,
                height: 80,
                fill: 'rgba(248, 113, 113, 0.25)',
                stroke: 'rgba(248, 113, 113, 0.6)',
                glowColor: 'rgba(248, 113, 113, 0.5)',
                accentColor: '#f87171',
                shape: 'circle'
            }
        },
        connection: {
            stroke: '#60a5fa',
            strokeWidth: 2,
            hoverStroke: '#e94560'
        }
    };

    // ============================================
    // State Management
    // ============================================
    const state = {
        canvas: null,
        nodes: new Map(),
        connections: [],
        nodeIdCounter: 0,
        connectionMode: false,
        connectionStart: null,
        selectedNode: null,
        zoomLevel: 1
    };

    // ============================================
    // Canvas Initialization
    // ============================================
    function initCanvas() {
        state.canvas = new fabric.Canvas('workflow-canvas', {
            width: CONFIG.canvas.width,
            height: CONFIG.canvas.height,
            backgroundColor: CONFIG.canvas.backgroundColor,
            selection: true,
            preserveObjectStacking: true
        });

        drawGrid();
        setupCanvasEvents();
    }

    function drawGrid() {
        const { width, height } = CONFIG.canvas;
        const { size, color } = CONFIG.grid;

        for (let x = 0; x <= width; x += size) {
            const line = new fabric.Line([x, 0, x, height], {
                stroke: color,
                strokeWidth: 1,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            state.canvas.add(line);
            state.canvas.sendToBack(line);
        }

        for (let y = 0; y <= height; y += size) {
            const line = new fabric.Line([0, y, width, y], {
                stroke: color,
                strokeWidth: 1,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            state.canvas.add(line);
            state.canvas.sendToBack(line);
        }
    }

    // ============================================
    // Node Creation - Glass Style
    // ============================================
    function createGlassShape(config) {
        const glowShadow = new fabric.Shadow({
            color: config.glowColor,
            blur: 20,
            offsetX: 0,
            offsetY: 0
        });

        const shapeProps = {
            fill: config.fill,
            stroke: config.stroke,
            strokeWidth: 2,
            shadow: glowShadow,
            originX: 'center',
            originY: 'center'
        };

        switch (config.shape) {
            case 'circle':
                return new fabric.Circle({
                    ...shapeProps,
                    radius: config.width / 2
                });
            case 'diamond':
                return new fabric.Rect({
                    ...shapeProps,
                    width: config.width * 0.7,
                    height: config.height * 0.7,
                    angle: 45
                });
            case 'rect':
            default:
                return new fabric.Rect({
                    ...shapeProps,
                    width: config.width,
                    height: config.height,
                    rx: 12,
                    ry: 12
                });
        }
    }

    function createHighlight(config) {
        // Inner highlight for glass reflection effect
        const highlightProps = {
            fill: 'rgba(255, 255, 255, 0.15)',
            stroke: '',
            originX: 'center',
            originY: 'center'
        };

        switch (config.shape) {
            case 'circle':
                return new fabric.Ellipse({
                    ...highlightProps,
                    rx: config.width / 3,
                    ry: config.width / 6,
                    top: -config.height / 6
                });
            case 'diamond':
                return new fabric.Rect({
                    ...highlightProps,
                    width: config.width * 0.35,
                    height: config.height * 0.15,
                    rx: 4,
                    ry: 4,
                    angle: 45,
                    top: -config.height / 5
                });
            case 'rect':
            default:
                return new fabric.Rect({
                    ...highlightProps,
                    width: config.width - 20,
                    height: 8,
                    rx: 4,
                    ry: 4,
                    top: -config.height / 2 + 12
                });
        }
    }

    function createGlassPort(x, y, color, portType) {
        return new fabric.Circle({
            radius: 7,
            fill: color,
            stroke: 'rgba(255, 255, 255, 0.3)',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            left: x,
            top: y,
            portType: portType,
            selectable: false,
            shadow: new fabric.Shadow({
                color: color,
                blur: 8,
                offsetX: 0,
                offsetY: 0
            })
        });
    }

    function createNode(type, x, y) {
        const config = CONFIG.nodes[type];
        if (!config) return null;

        const nodeId = `node_${state.nodeIdCounter++}`;

        // Create main glass shape
        const shape = createGlassShape(config);

        // Create inner highlight
        const highlight = createHighlight(config);

        // Create label with light text for glass
        const label = new fabric.Text(getDefaultLabel(type), {
            fontSize: 14,
            fill: 'rgba(255, 255, 255, 0.95)',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            top: 0,
            shadow: new fabric.Shadow({
                color: 'rgba(0, 0, 0, 0.5)',
                blur: 2,
                offsetX: 0,
                offsetY: 1
            })
        });

        // Group items: shape first, then highlight, then label
        const groupItems = [shape, highlight, label];

        // Create ports
        const portOffset = config.shape === 'diamond' ? 10 : 6;

        // Input port (top) - not for start nodes
        if (type !== 'start') {
            const inputPort = createGlassPort(0, -config.height / 2 - portOffset, config.accentColor, 'input');
            groupItems.push(inputPort);
        }

        // Output port (bottom) - not for end nodes
        if (type !== 'end') {
            if (type === 'condition') {
                // Condition has true (right) and false (left) ports
                const truePort = createGlassPort(config.width / 2 + 10, 0, '#4ade80', 'output-true');
                const falsePort = createGlassPort(-config.width / 2 - 10, 0, '#f87171', 'output-false');
                groupItems.push(truePort, falsePort);
            } else {
                const outputPort = createGlassPort(0, config.height / 2 + portOffset, config.accentColor, 'output');
                groupItems.push(outputPort);
            }
        }

        const node = new fabric.Group(groupItems, {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            hasControls: false,
            hasBorders: true,
            borderColor: '#e94560',
            borderScaleFactor: 2,
            nodeId: nodeId,
            nodeType: type,
            nodeData: {
                label: getDefaultLabel(type),
                description: '',
                actionType: type === 'action' ? 'http' : null,
                condition: type === 'condition' ? '' : null
            }
        });

        state.nodes.set(nodeId, node);
        state.canvas.add(node);
        state.canvas.setActiveObject(node);
        state.canvas.renderAll();

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

    // ============================================
    // Connection System - Orthogonal Routing
    // ============================================
    const ROUTE_STUB = 25; // minimum distance extending from a port

    function getPortDirection(portType) {
        switch (portType) {
            case 'output':       return { dx: 0, dy: 1 };   // down
            case 'output-true':  return { dx: 1, dy: 0 };   // right
            case 'output-false': return { dx: -1, dy: 0 };  // left
            case 'input':        return { dx: 0, dy: -1 };  // up
            default:             return { dx: 0, dy: 1 };
        }
    }

    function buildOrthogonalRoute(from, to, fromPortType) {
        const dir = getPortDirection(fromPortType);
        // Stub: short segment exiting the source port
        const stub = { x: from.x + dir.dx * ROUTE_STUB, y: from.y + dir.dy * ROUTE_STUB };
        // Entry: short segment before entering the target port (always from above)
        const entry = { x: to.x, y: to.y - ROUTE_STUB };

        const points = [from, stub];

        if (dir.dy !== 0) {
            // Exiting vertically (down from output port)
            routeVerticalExit(points, stub, entry, from, to);
        } else {
            // Exiting horizontally (left/right from condition ports)
            routeHorizontalExit(points, stub, entry, dir);
        }

        points.push(entry, to);
        return deduplicatePoints(points);
    }

    function routeVerticalExit(points, stub, entry, from, to) {
        if (stub.y < entry.y) {
            // Target is below - simple mid-level routing
            const midY = (stub.y + entry.y) / 2;
            points.push({ x: stub.x, y: midY });
            points.push({ x: entry.x, y: midY });
        } else {
            // Target is above or same level - detour sideways
            const detourX = from.x <= to.x
                ? Math.min(from.x, to.x) - 60
                : Math.max(from.x, to.x) + 60;
            points.push({ x: detourX, y: stub.y });
            points.push({ x: detourX, y: entry.y });
        }
    }

    function routeHorizontalExit(points, stub, entry, dir) {
        // Check if target x is "ahead" in exit direction
        const targetAhead = dir.dx > 0 ? stub.x < entry.x : stub.x > entry.x;

        if (targetAhead) {
            // Target is in the direction we're heading - go to target x, then down
            points.push({ x: entry.x, y: stub.y });
        } else {
            // Target is behind us - go vertically to midpoint, then across
            const midY = (stub.y + entry.y) / 2;
            points.push({ x: stub.x, y: midY });
            points.push({ x: entry.x, y: midY });
        }
    }

    function deduplicatePoints(points) {
        return points.filter((p, i) =>
            i === 0 || Math.abs(p.x - points[i - 1].x) > 0.5 || Math.abs(p.y - points[i - 1].y) > 0.5
        );
    }

    function pointsToSvgPath(points) {
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        return d;
    }

    function getConnectionColor(portType) {
        if (portType === 'output-true') return '#4ade80';
        if (portType === 'output-false') return '#f87171';
        return CONFIG.connection.stroke;
    }

    function createConnection(fromNode, toNode, portType = 'output') {
        const fromPoint = getPortPosition(fromNode, portType);
        const toPoint = getPortPosition(toNode, 'input');
        if (!fromPoint || !toPoint) return null;

        const routePoints = buildOrthogonalRoute(fromPoint, toPoint, portType);
        const pathString = pointsToSvgPath(routePoints);
        const color = getConnectionColor(portType);

        const path = new fabric.Path(pathString, {
            stroke: color,
            strokeWidth: CONFIG.connection.strokeWidth,
            fill: '',
            selectable: false,
            evented: false,
            fromNodeId: fromNode.nodeId,
            toNodeId: toNode.nodeId,
            portType: portType,
            isConnection: true
        });

        // Arrow at end, oriented to match the last segment
        const arrow = createArrowFromSegment(routePoints, color);

        state.connections.push({ line: path, arrow: arrow, fromNodeId: fromNode.nodeId, toNodeId: toNode.nodeId, portType });
        state.canvas.add(path);
        state.canvas.add(arrow);
        state.canvas.sendToBack(path);
        state.canvas.sendToBack(arrow);
        state.canvas.renderAll();

        return { line: path, arrow };
    }

    function createArrowFromSegment(points, color) {
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        const dx = last.x - prev.x;
        const dy = last.y - prev.y;
        // angle: fabric Triangle at 0deg points up, so rotate to match segment direction
        const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        // Position arrow slightly back from endpoint along the segment
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = len > 0 ? dx / len : 0;
        const ny = len > 0 ? dy / len : 0;

        return new fabric.Triangle({
            left: last.x - nx * 8,
            top: last.y - ny * 8,
            width: 12,
            height: 10,
            fill: color,
            angle: angle,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            isConnectionArrow: true
        });
    }

    function getPortPosition(node, portType) {
        const center = node.getCenterPoint();
        const config = CONFIG.nodes[node.nodeType];

        switch (portType) {
            case 'input':
                return { x: center.x, y: center.y - config.height / 2 - 6 };
            case 'output':
                return { x: center.x, y: center.y + config.height / 2 + 6 };
            case 'output-true':
                return { x: center.x + config.width / 2 + 10, y: center.y };
            case 'output-false':
                return { x: center.x - config.width / 2 - 10, y: center.y };
            default:
                return null;
        }
    }

    function updateConnections() {
        state.connections.forEach(conn => {
            const fromNode = state.nodes.get(conn.fromNodeId);
            const toNode = state.nodes.get(conn.toNodeId);

            if (!fromNode || !toNode) {
                state.canvas.remove(conn.line);
                state.canvas.remove(conn.arrow);
                return;
            }

            const fromPoint = getPortPosition(fromNode, conn.portType);
            const toPoint = getPortPosition(toNode, 'input');
            if (!fromPoint || !toPoint) return;

            const routePoints = buildOrthogonalRoute(fromPoint, toPoint, conn.portType);
            const pathString = pointsToSvgPath(routePoints);

            conn.line.set({ path: fabric.util.parsePath(pathString) });

            // Update arrow position and angle
            const last = routePoints[routePoints.length - 1];
            const prev = routePoints[routePoints.length - 2];
            const dx = last.x - prev.x;
            const dy = last.y - prev.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = len > 0 ? dx / len : 0;
            const ny = len > 0 ? dy / len : 0;

            conn.arrow.set({
                left: last.x - nx * 8,
                top: last.y - ny * 8,
                angle: angle
            });
        });

        state.canvas.renderAll();
    }

    // ============================================
    // Event Handlers
    // ============================================
    function setupCanvasEvents() {
        // Object moving - update connections
        state.canvas.on('object:moving', (e) => {
            if (e.target && e.target.nodeId) {
                updateConnections();
            }
        });

        // Selection
        state.canvas.on('selection:created', handleSelection);
        state.canvas.on('selection:updated', handleSelection);
        state.canvas.on('selection:cleared', handleDeselection);

        // Double-click for connection mode
        state.canvas.on('mouse:dblclick', (e) => {
            if (e.target && e.target.nodeId) {
                startConnectionMode(e.target);
            }
        });

        // Click to complete connection
        state.canvas.on('mouse:down', (e) => {
            if (state.connectionMode && e.target && e.target.nodeId) {
                if (e.target.nodeId !== state.connectionStart.nodeId) {
                    completeConnection(e.target);
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteSelected();
            }
            if (e.key === 'Escape' && state.connectionMode) {
                cancelConnectionMode();
            }
        });

        // Mouse wheel zoom
        state.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = state.canvas.getZoom();
            zoom *= 0.999 ** delta;

            // Clamp zoom level
            zoom = Math.min(Math.max(zoom, CONFIG.zoom.min), CONFIG.zoom.max);

            // Zoom to mouse pointer position
            state.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            state.zoomLevel = zoom;
            updateZoomDisplay();

            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
    }

    // ============================================
    // Zoom Controls
    // ============================================
    function zoomIn() {
        let zoom = state.canvas.getZoom() + CONFIG.zoom.step;
        zoom = Math.min(zoom, CONFIG.zoom.max);
        const center = { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height / 2 };
        state.canvas.zoomToPoint(center, zoom);
        state.zoomLevel = zoom;
        updateZoomDisplay();
    }

    function zoomOut() {
        let zoom = state.canvas.getZoom() - CONFIG.zoom.step;
        zoom = Math.max(zoom, CONFIG.zoom.min);
        const center = { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height / 2 };
        state.canvas.zoomToPoint(center, zoom);
        state.zoomLevel = zoom;
        updateZoomDisplay();
    }

    function zoomReset() {
        state.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        state.zoomLevel = 1;
        updateZoomDisplay();
    }

    function updateZoomDisplay() {
        const display = document.getElementById('zoom-level');
        if (display) {
            display.textContent = Math.round(state.zoomLevel * 100) + '%';
        }
    }

    function handleSelection(e) {
        const selected = e.selected?.[0];
        if (selected && selected.nodeId) {
            state.selectedNode = selected;
            showProperties(selected);
        }
    }

    function handleDeselection() {
        state.selectedNode = null;
        hideProperties();
    }

    function startConnectionMode(node) {
        // Don't allow connections from End nodes
        if (node.nodeType === 'end') return;

        state.connectionMode = true;
        state.connectionStart = node;
        state.canvas.defaultCursor = 'crosshair';
        state.canvas.hoverCursor = 'crosshair';

        // Visual feedback
        node.set({ borderColor: '#4ade80' });
        state.canvas.renderAll();
    }

    function completeConnection(toNode) {
        // Don't allow connections to Start nodes
        if (toNode.nodeType === 'start') {
            cancelConnectionMode();
            return;
        }

        const fromNode = state.connectionStart;

        // Determine port type for condition nodes
        let portType = 'output';
        if (fromNode.nodeType === 'condition') {
            // Simple heuristic: if target is to the right, use true port; else false
            const fromCenter = fromNode.getCenterPoint();
            const toCenter = toNode.getCenterPoint();
            portType = toCenter.x >= fromCenter.x ? 'output-true' : 'output-false';
        }

        createConnection(fromNode, toNode, portType);
        cancelConnectionMode();
    }

    function cancelConnectionMode() {
        if (state.connectionStart) {
            state.connectionStart.set({ borderColor: '#e94560' });
        }
        state.connectionMode = false;
        state.connectionStart = null;
        state.canvas.defaultCursor = 'default';
        state.canvas.hoverCursor = 'move';
        state.canvas.renderAll();
    }

    // ============================================
    // Properties Panel
    // ============================================
    function showProperties(node) {
        const panel = document.getElementById('properties-panel');
        const noSelection = panel.querySelector('.no-selection');
        const form = panel.querySelector('.properties-form');
        const conditionGroup = panel.querySelector('.condition-only');
        const actionGroup = panel.querySelector('.action-only');

        noSelection.style.display = 'none';
        form.style.display = 'flex';

        // Show/hide type-specific fields
        conditionGroup.style.display = node.nodeType === 'condition' ? 'flex' : 'none';
        actionGroup.style.display = node.nodeType === 'action' ? 'flex' : 'none';

        // Populate fields
        document.getElementById('node-label').value = node.nodeData.label || '';
        document.getElementById('node-description').value = node.nodeData.description || '';

        if (node.nodeType === 'condition') {
            document.getElementById('node-condition').value = node.nodeData.condition || '';
        }
        if (node.nodeType === 'action') {
            document.getElementById('node-action-type').value = node.nodeData.actionType || 'http';
        }
    }

    function hideProperties() {
        const panel = document.getElementById('properties-panel');
        const noSelection = panel.querySelector('.no-selection');
        const form = panel.querySelector('.properties-form');

        noSelection.style.display = 'block';
        form.style.display = 'none';
    }

    function setupPropertyListeners() {
        document.getElementById('node-label').addEventListener('input', (e) => {
            if (state.selectedNode) {
                state.selectedNode.nodeData.label = e.target.value;
                updateNodeLabel(state.selectedNode, e.target.value);
            }
        });

        document.getElementById('node-description').addEventListener('input', (e) => {
            if (state.selectedNode) {
                state.selectedNode.nodeData.description = e.target.value;
            }
        });

        document.getElementById('node-condition').addEventListener('input', (e) => {
            if (state.selectedNode && state.selectedNode.nodeType === 'condition') {
                state.selectedNode.nodeData.condition = e.target.value;
            }
        });

        document.getElementById('node-action-type').addEventListener('change', (e) => {
            if (state.selectedNode && state.selectedNode.nodeType === 'action') {
                state.selectedNode.nodeData.actionType = e.target.value;
            }
        });
    }

    function updateNodeLabel(node, newLabel) {
        const textObj = node.getObjects().find(obj => obj.type === 'text');
        if (textObj) {
            textObj.set({ text: newLabel || getDefaultLabel(node.nodeType) });
            state.canvas.renderAll();
        }
    }

    // ============================================
    // Toolbar Actions
    // ============================================
    function deleteSelected() {
        const activeObj = state.canvas.getActiveObject();
        if (!activeObj || !activeObj.nodeId) return;

        const nodeId = activeObj.nodeId;

        // Remove connections associated with this node
        state.connections = state.connections.filter(conn => {
            if (conn.fromNodeId === nodeId || conn.toNodeId === nodeId) {
                state.canvas.remove(conn.line);
                state.canvas.remove(conn.arrow);
                return false;
            }
            return true;
        });

        // Remove node
        state.nodes.delete(nodeId);
        state.canvas.remove(activeObj);
        state.canvas.discardActiveObject();
        state.canvas.renderAll();
        hideProperties();
    }

    function clearCanvas() {
        if (!confirm('Are you sure you want to clear the entire canvas?')) return;

        // Remove all nodes and connections
        state.nodes.forEach((node) => {
            state.canvas.remove(node);
        });
        state.connections.forEach(conn => {
            state.canvas.remove(conn.line);
            state.canvas.remove(conn.arrow);
        });

        state.nodes.clear();
        state.connections = [];
        state.nodeIdCounter = 0;
        state.canvas.renderAll();
        hideProperties();
    }

    // ============================================
    // Drag and Drop from Palette
    // ============================================
    function setupDragAndDrop() {
        const paletteItems = document.querySelectorAll('.palette-item');
        const canvasWrapper = document.querySelector('.canvas-wrapper');

        paletteItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', item.dataset.nodeType);
            });

            // Also support click to add
            item.addEventListener('click', () => {
                const type = item.dataset.nodeType;
                const centerX = CONFIG.canvas.width / 2;
                const centerY = CONFIG.canvas.height / 2;
                createNode(type, centerX + (Math.random() - 0.5) * 200, centerY + (Math.random() - 0.5) * 200);
            });
        });

        // Make palette items draggable
        paletteItems.forEach(item => {
            item.setAttribute('draggable', 'true');
        });

        // Handle drop on canvas
        canvasWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvasWrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('nodeType');
            if (!nodeType) return;

            const rect = state.canvas.getElement().getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            createNode(nodeType, x, y);
        });
    }

    // ============================================
    // Initialization
    // ============================================
    function init() {
        initCanvas();
        setupDragAndDrop();
        setupPropertyListeners();

        // Toolbar buttons
        document.getElementById('btn-delete').addEventListener('click', deleteSelected);
        document.getElementById('btn-clear').addEventListener('click', clearCanvas);

        // Zoom buttons
        document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
        document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);
        document.getElementById('btn-zoom-reset').addEventListener('click', zoomReset);

        // Create a sample workflow
        createSampleWorkflow();
    }

    function createSampleWorkflow() {
        // Create some initial nodes for demonstration
        const startNode = createNode('start', 500, 80);
        const actionNode = createNode('action', 500, 220);
        const conditionNode = createNode('condition', 500, 380);
        const action2Node = createNode('action', 700, 520);
        const endNode = createNode('end', 300, 520);

        // Connect them
        setTimeout(() => {
            createConnection(startNode, actionNode);
            createConnection(actionNode, conditionNode);
            createConnection(conditionNode, action2Node, 'output-true');
            createConnection(conditionNode, endNode, 'output-false');
        }, 100);
    }

    // Start the editor when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    // Expose API for external use
    window.WorkflowEditor = {
        createNode,
        createConnection,
        deleteSelected,
        clearCanvas,
        zoomIn,
        zoomOut,
        zoomReset,
        getZoom: () => state.zoomLevel,
        getNodes: () => Array.from(state.nodes.values()),
        getConnections: () => state.connections,
        exportWorkflow: () => ({
            nodes: Array.from(state.nodes.entries()).map(([id, node]) => ({
                id,
                type: node.nodeType,
                position: { x: node.left, y: node.top },
                data: node.nodeData
            })),
            connections: state.connections.map(c => ({
                from: c.fromNodeId,
                to: c.toNodeId,
                portType: c.portType
            }))
        })
    };
})();
