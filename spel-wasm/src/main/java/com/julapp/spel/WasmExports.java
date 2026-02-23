package com.julapp.spel;

/**
 * Static entry points exported from the WebAssembly module.
 *
 * <p>Each public static method listed in the {@code j2wasm_application} BUILD target's
 * {@code entry_points} attribute becomes an export in the compiled {@code .wasm} binary and
 * is callable from JavaScript as {@code instance.exports["methodName"](...)}.
 *
 * <p>Supported parameter/return types across the WASM boundary: primitive types and
 * {@code String} (handled by J2WASM's WasmGC runtime).
 */
public class WasmExports {

    /**
     * Evaluates a SpEL expression against a JSON context object.
     *
     * <p>Called from JavaScript as:
     * <pre>
     *   instance.exports["evaluate"](expression, contextJson)
     * </pre>
     *
     * @param expression  SpEL expression, e.g. {@code "name + ' is ' + age + ' years old'"}
     * @param contextJson flat JSON object supplying root properties,
     *                    e.g. {@code {"name":"Alice","age":30}}
     * @return evaluation result serialised to a string; or an {@code "ERROR: …"} message.
     */
    public static String evaluate(String expression, String contextJson) {
        try {
            String preprocessed = new Preprocessor().preprocess(expression);
            EvaluationContext ctx = EvaluationContext.fromJson(contextJson);
            Node ast = new Parser(new Tokenizer(preprocessed).tokenize()).parse();
            Object result = new Evaluator().evaluate(ast, ctx);
            return result == null ? "null" : result.toString();
        } catch (SpelException e) {
            return "ERROR: " + e.getMessage();
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Evaluates a SpEL expression with no external context (literals and operators only).
     *
     * <p>Called from JavaScript as:
     * <pre>
     *   instance.exports["evaluateSimple"](expression)
     * </pre>
     *
     * @param expression SpEL expression, e.g. {@code "2 + 2"} or {@code "'hello' + ' world'"}
     * @return evaluation result as a string.
     */
    public static String evaluateSimple(String expression) {
        return evaluate(expression, "{}");
    }
}
