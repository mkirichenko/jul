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
            backgroundColor: '#232946'
        },
        grid: {
            size: 20,
            color: '#2d3561'
        },
        nodes: {
            start: {
                width: 80,
                height: 80,
                fill: '#4ade80',
                shape: 'circle'
            },
            action: {
                width: 160,
                height: 80,
                fill: '#60a5fa',
                shape: 'rect'
            },
            condition: {
                width: 100,
                height: 100,
                fill: '#fbbf24',
                shape: 'diamond'
            },
            end: {
                width: 80,
                height: 80,
                fill: '#f87171',
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
        selectedNode: null
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
    // Node Creation
    // ============================================
    function createNode(type, x, y) {
        const config = CONFIG.nodes[type];
        if (!config) return null;

        const nodeId = `node_${state.nodeIdCounter++}`;
        let shape;
        let labelOffsetY = 0;

        switch (config.shape) {
            case 'circle':
                shape = new fabric.Circle({
                    radius: config.width / 2,
                    fill: config.fill,
                    originX: 'center',
                    originY: 'center'
                });
                break;

            case 'diamond':
                shape = new fabric.Rect({
                    width: config.width * 0.7,
                    height: config.height * 0.7,
                    fill: config.fill,
                    angle: 45,
                    originX: 'center',
                    originY: 'center'
                });
                break;

            case 'rect':
            default:
                shape = new fabric.Rect({
                    width: config.width,
                    height: config.height,
                    fill: config.fill,
                    rx: 8,
                    ry: 8,
                    originX: 'center',
                    originY: 'center'
                });
                break;
        }

        // Create label
        const label = new fabric.Text(getDefaultLabel(type), {
            fontSize: 14,
            fill: '#1a1a2e',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            top: labelOffsetY
        });

        // Create input port (top)
        const inputPort = new fabric.Circle({
            radius: 6,
            fill: '#60a5fa',
            stroke: '#1a1a2e',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            top: -config.height / 2 - 6,
            portType: 'input',
            selectable: false
        });

        // Create output port (bottom)
        const outputPort = new fabric.Circle({
            radius: 6,
            fill: '#60a5fa',
            stroke: '#1a1a2e',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            top: config.height / 2 + 6,
            portType: 'output',
            selectable: false
        });

        // Adjust ports for diamond shape
        if (config.shape === 'diamond') {
            inputPort.set({ top: -config.height / 2 - 10 });
            outputPort.set({ top: config.height / 2 + 10 });
        }

        // Group all elements
        const groupItems = [shape, label];

        // Start nodes don't have input ports, End nodes don't have output ports
        if (type !== 'start') {
            groupItems.push(inputPort);
        }
        if (type !== 'end') {
            groupItems.push(outputPort);
        }

        // Condition nodes have two output ports (true/false)
        if (type === 'condition') {
            const truePort = new fabric.Circle({
                radius: 6,
                fill: '#4ade80',
                stroke: '#1a1a2e',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                left: config.width / 2 + 10,
                top: 0,
                portType: 'output-true',
                selectable: false
            });
            const falsePort = new fabric.Circle({
                radius: 6,
                fill: '#f87171',
                stroke: '#1a1a2e',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                left: -config.width / 2 - 10,
                top: 0,
                portType: 'output-false',
                selectable: false
            });
            // Remove default output port for condition
            groupItems.pop();
            groupItems.push(truePort, falsePort);
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
    // Connection System
    // ============================================
    function createConnection(fromNode, toNode, portType = 'output') {
        const fromPoint = getPortPosition(fromNode, portType);
        const toPoint = getPortPosition(toNode, 'input');

        if (!fromPoint || !toPoint) return null;

        // Create a curved line (bezier)
        const midY = (fromPoint.y + toPoint.y) / 2;

        const path = new fabric.Path(
            `M ${fromPoint.x} ${fromPoint.y} ` +
            `C ${fromPoint.x} ${midY}, ${toPoint.x} ${midY}, ${toPoint.x} ${toPoint.y}`,
            {
                stroke: portType === 'output-true' ? '#4ade80' :
                        portType === 'output-false' ? '#f87171' :
                        CONFIG.connection.stroke,
                strokeWidth: CONFIG.connection.strokeWidth,
                fill: '',
                selectable: false,
                evented: false,
                fromNodeId: fromNode.nodeId,
                toNodeId: toNode.nodeId,
                portType: portType,
                isConnection: true
            }
        );

        // Add arrow at end
        const arrow = createArrow(toPoint.x, toPoint.y - 10, portType);

        state.connections.push({ line: path, arrow: arrow, fromNodeId: fromNode.nodeId, toNodeId: toNode.nodeId, portType });
        state.canvas.add(path);
        state.canvas.add(arrow);
        state.canvas.sendToBack(path);
        state.canvas.sendToBack(arrow);
        state.canvas.renderAll();

        return { line: path, arrow };
    }

    function createArrow(x, y, portType) {
        const color = portType === 'output-true' ? '#4ade80' :
                      portType === 'output-false' ? '#f87171' :
                      CONFIG.connection.stroke;

        return new fabric.Triangle({
            left: x,
            top: y,
            width: 12,
            height: 10,
            fill: color,
            angle: 180,
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
                // Remove orphaned connection
                state.canvas.remove(conn.line);
                state.canvas.remove(conn.arrow);
                return;
            }

            const fromPoint = getPortPosition(fromNode, conn.portType);
            const toPoint = getPortPosition(toNode, 'input');

            if (!fromPoint || !toPoint) return;

            const midY = (fromPoint.y + toPoint.y) / 2;
            const pathString =
                `M ${fromPoint.x} ${fromPoint.y} ` +
                `C ${fromPoint.x} ${midY}, ${toPoint.x} ${midY}, ${toPoint.x} ${toPoint.y}`;

            conn.line.set({ path: fabric.util.parsePath(pathString) });
            conn.arrow.set({ left: toPoint.x, top: toPoint.y - 10 });
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
