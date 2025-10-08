document.addEventListener('DOMContentLoaded', () => {
    const canvas = new fabric.Canvas('canvas', {
        width: 800,
        height: 600,
        backgroundColor: '#fff'
    });

    const addRectBtn = document.getElementById('add-rect');
    const connectModeBtn = document.getElementById('connect-mode');
    let isConnectMode = false;
    let selectedShapes = [];
    let rectCounter = 0;

    addRectBtn.addEventListener('click', () => {
        const rect = new fabric.Rect({
            left: 100 + (rectCounter % 5) * 120,
            top: 100 + Math.floor(rectCounter / 5) * 120,
            fill: 'red',
            width: 100,
            height: 100,
            originX: 'left',
            originY: 'top',
            // Custom property to identify shapes
            id: 'rect_' + rectCounter
        });
        canvas.add(rect);
        rectCounter++;
    });

    window.connectRectsByIds = (id1, id2) => {
        const rect1 = canvas.getObjects().find(obj => obj.id === id1);
        const rect2 = canvas.getObjects().find(obj => obj.id === id2);

        if (rect1 && rect2) {
            const from = rect1.getCenterPoint();
            const to = rect2.getCenterPoint();

            const line = new fabric.Line([from.x, from.y, to.x, to.y], {
                stroke: 'black',
                strokeWidth: 2,
                selectable: false,
                evented: false,
                connects: { from: id1, to: id2 },
            });
            canvas.add(line);
            canvas.sendToBack(line);
            canvas.renderAll();
            return true;
        }
        return false;
    }

    connectModeBtn.addEventListener('click', () => {
        isConnectMode = !isConnectMode;
        if (isConnectMode) {
            connectModeBtn.textContent = 'Exit Connect Mode';
            canvas.selection = false; // Disable group selection
            canvas.discardActiveObject();
        } else {
            connectModeBtn.textContent = 'Connect';
            selectedShapes = [];
            canvas.selection = true;
        }
    });

    canvas.on('mouse:down', (options) => {
        if (isConnectMode && options.target && options.target.id.startsWith('rect_')) {
            selectedShapes.push(options.target);
            options.target.set('fill', 'blue'); // Highlight selected shape
            canvas.renderAll();

            if (selectedShapes.length === 2) {
                const from = selectedShapes[0].getCenterPoint();
                const to = selectedShapes[1].getCenterPoint();

                const line = new fabric.Line([from.x, from.y, to.x, to.y], {
                    stroke: 'black',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    connects: { from: selectedShapes[0].id, to: selectedShapes[1].id },
                });

                canvas.add(line);
                canvas.sendToBack(line);

                // Reset colors
                selectedShapes[0].set('fill', 'red');
                selectedShapes[1].set('fill', 'red');

                // Exit connect mode
                isConnectMode = false;
                connectModeBtn.textContent = 'Connect';
                selectedShapes = [];
                canvas.selection = true;
                canvas.renderAll();
            }
        }
    });

    canvas.on('object:moving', (e) => {
        const movedObject = e.target;
        if (!movedObject || !movedObject.id || !movedObject.id.startsWith('rect_')) {
            return;
        }

        const movedRectId = movedObject.id;

        canvas.getObjects('line').forEach(line => {
            if (line.connects && (line.connects.from === movedRectId || line.connects.to === movedRectId)) {
                const rect1 = canvas.getObjects().find(obj => obj.id === line.connects.from);
                const rect2 = canvas.getObjects().find(obj => obj.id === line.connects.to);

                if (rect1 && rect2) {
                    const fromPoint = rect1.getCenterPoint();
                    const toPoint = rect2.getCenterPoint();
                    line.set({ x1: fromPoint.x, y1: fromPoint.y, x2: toPoint.x, y2: toPoint.y });
                }
            }
        });
    });
});