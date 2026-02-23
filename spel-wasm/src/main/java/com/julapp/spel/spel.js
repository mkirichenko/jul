/**
 * @fileoverview SpEL WASM module loader.
 *
 * This Closure module loads the J2WASM-compiled SpEL evaluator and wires it up
 * to the demo page UI. It is the entry point for the j2cl_application target.
 *
 * The exported `spelEntry` symbol is the Closure Compiler entry point referenced
 * in the BUILD file's j2cl_application `entry_points` attribute.
 */

goog.module('spelEntry');

const spelApp = goog.require('spel_app.j2wasm');

// ---------------------------------------------------------------------------
// Load the WASM binary
// ---------------------------------------------------------------------------

spelApp.instantiateStreaming('spel_app_dev.wasm')
    .then((instance) => {
        initUi(instance.exports);
    })
    .catch((err) => {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Failed to load WASM module: ' + err;
            status.className = 'status error';
        }
        throw err;
    });

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------

/**
 * @param {!Object} exports  The WASM instance exports object.
 */
function initUi(exports) {
    const status = document.getElementById('status');
    const expressionInput = document.getElementById('expression');
    const contextInput = document.getElementById('context');
    const evaluateBtn = document.getElementById('evaluate-btn');
    const outputDiv = document.getElementById('output');

    if (status) {
        status.textContent = 'WASM module loaded.';
        status.className = 'status ok';
    }

    if (evaluateBtn) {
        evaluateBtn.addEventListener('click', () => {
            const expr = expressionInput ? expressionInput.value.trim() : '';
            const ctx  = contextInput  ? contextInput.value.trim()  : '{}';
            try {
                const result = exports['evaluate'](expr, ctx || '{}');
                if (outputDiv) outputDiv.textContent = result;
            } catch (e) {
                if (outputDiv) outputDiv.textContent = 'JS error: ' + e.message;
            }
        });
    }
}

/** @export */
function spelEntry() {}
