# SpEL WASM module build targets.
#
# NOTE: J2WASM is experimental. Requires Chrome 119+ (WasmGC support).
#
# Build the WASM binary:
#   bazel build //src/main/java/com/julapp/spel:spel_app
#
# Serve the demo with live reload (install ibazel first):
#   bazel run  //src/main/java/com/julapp/spel:spel_jsapp_dev_server
# or:
#   ibazel run //src/main/java/com/julapp/spel:spel_jsapp_dev_server

load(
    "@j2cl//build_defs:rules.bzl",
    "j2cl_application",
    "j2wasm_application",
    "j2wasm_library",
)
load("@rules_closure//closure:defs.bzl", "closure_js_library")

package(default_visibility = ["//visibility:public"])

# ---------------------------------------------------------------------------
# 1. Java → WASM library
# ---------------------------------------------------------------------------
j2wasm_library(
    name = "spel_lib",
    srcs = glob(["*.java"]),
)

# ---------------------------------------------------------------------------
# 2. Link the WASM application; each listed entry_point is exported as a
#    function in the .wasm binary callable from JavaScript.
# ---------------------------------------------------------------------------
j2wasm_application(
    name = "spel_app",
    entry_points = [
        "com.julapp.spel.WasmExports#evaluate",
        "com.julapp.spel.WasmExports#evaluateSimple",
    ],
    deps = [":spel_lib"],
)

# ---------------------------------------------------------------------------
# 3. JavaScript Closure library that loads and drives the WASM module
# ---------------------------------------------------------------------------
closure_js_library(
    name = "spel_js",
    srcs = ["spel.js"],
    lenient = True,
    deps = [":spel_app"],
)

# ---------------------------------------------------------------------------
# 4. Full JS+WASM application served by the Bazel dev server
# ---------------------------------------------------------------------------
j2cl_application(
    name = "spel_jsapp",
    entry_points = ["spelEntry"],
    extra_dev_resources = [
        ":spel_app_dev.wasm",
        "index.html",
    ],
    deps = [":spel_js"],
)
