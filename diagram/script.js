document.addEventListener('DOMContentLoaded', () => {
    const CSS_WIDTH = 800;
    const CSS_HEIGHT = 600;

    const canvasEl = document.getElementById('canvas');
    const ctx = canvasEl.getContext('2d');

    const state = {
        dpr: 1,
        rects: [],
        lines: [],
        selected: null,
        drag: null,
        rectCounter: 0,
        isConnectMode: false,
        connectSelection: [],
        rafId: null
    };

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        state.dpr = dpr;
        canvasEl.style.width = CSS_WIDTH + 'px';
        canvasEl.style.height = CSS_HEIGHT + 'px';
        canvasEl.width = Math.round(CSS_WIDTH * dpr);
        canvasEl.height = Math.round(CSS_HEIGHT * dpr);
        requestRender();
    }

    function requestRender() {
        if (state.rafId !== null) return;
        state.rafId = requestAnimationFrame(() => {
            state.rafId = null;
            render();
        });
    }

    function render() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        // Lines below rectangles
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        for (const l of state.lines) {
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
        }

        for (const r of state.rects) {
            ctx.fillStyle = r.fill;
            ctx.fillRect(r.x, r.y, r.width, r.height);
        }
    }

    function getCanvasPoint(e) {
        const rect = canvasEl.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function hitTest(x, y) {
        for (let i = state.rects.length - 1; i >= 0; i--) {
            const r = state.rects[i];
            if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return r;
        }
        return null;
    }

    function rectCenter(r) {
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }

    // ============================================
    // UI hooks
    // ============================================
    const addRectBtn = document.getElementById('add-rect');
    const connectModeBtn = document.getElementById('connect-mode');

    addRectBtn.addEventListener('click', () => {
        const rect = {
            id: 'rect_' + state.rectCounter,
            x: 100 + (state.rectCounter % 5) * 120,
            y: 100 + Math.floor(state.rectCounter / 5) * 120,
            width: 100,
            height: 100,
            fill: 'red'
        };
        state.rects.push(rect);
        state.rectCounter++;
        requestRender();
    });

    connectModeBtn.addEventListener('click', () => {
        state.isConnectMode = !state.isConnectMode;
        if (state.isConnectMode) {
            connectModeBtn.textContent = 'Exit Connect Mode';
            state.connectSelection = [];
            state.selected = null;
            state.drag = null;
        } else {
            connectModeBtn.textContent = 'Connect';
            for (const r of state.connectSelection) r.fill = 'red';
            state.connectSelection = [];
        }
        requestRender();
    });

    canvasEl.addEventListener('mousedown', (e) => {
        const p = getCanvasPoint(e);
        const hit = hitTest(p.x, p.y);

        if (state.isConnectMode) {
            if (!hit) return;
            state.connectSelection.push(hit);
            hit.fill = 'blue';
            requestRender();

            if (state.connectSelection.length === 2) {
                const [a, b] = state.connectSelection;
                const from = rectCenter(a);
                const to = rectCenter(b);
                state.lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
                a.fill = 'red';
                b.fill = 'red';
                state.isConnectMode = false;
                connectModeBtn.textContent = 'Connect';
                state.connectSelection = [];
                requestRender();
            }
            return;
        }

        if (hit) {
            state.selected = hit;
            state.drag = { rect: hit, offsetX: p.x - hit.x, offsetY: p.y - hit.y };
            // Bring to front
            const idx = state.rects.indexOf(hit);
            if (idx !== -1) {
                state.rects.splice(idx, 1);
                state.rects.push(hit);
            }
            requestRender();
        } else {
            state.selected = null;
        }
    });

    canvasEl.addEventListener('mousemove', (e) => {
        if (!state.drag) return;
        const p = getCanvasPoint(e);
        state.drag.rect.x = p.x - state.drag.offsetX;
        state.drag.rect.y = p.y - state.drag.offsetY;
        requestRender();
    });

    const endDrag = () => { state.drag = null; };
    canvasEl.addEventListener('mouseup', endDrag);
    canvasEl.addEventListener('mouseleave', endDrag);

    // ============================================
    // Programmatic connect by id (preserves existing API)
    // ============================================
    window.connectRectsByIds = (id1, id2) => {
        const r1 = state.rects.find(r => r.id === id1);
        const r2 = state.rects.find(r => r.id === id2);
        if (!r1 || !r2) return false;
        const from = rectCenter(r1);
        const to = rectCenter(r2);
        state.lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
        requestRender();
        return true;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});
