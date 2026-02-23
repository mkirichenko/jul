package com.julapp.spel;

/**
 * Preprocessor that transforms application-specific syntax into standard SpEL before parsing.
 *
 * <p>This is the primary extension point for the custom expression dialect. The default
 * implementation is a passthrough. Add transformation rules here as the language evolves.
 *
 * <p>Example transformations that can be added:
 * <ul>
 *   <li>Expand shorthand operators ({@code ~} → {@code !=}, {@code eq} → {@code ==})</li>
 *   <li>Replace custom function names with SpEL equivalents</li>
 *   <li>Unwrap template strings ({@code "Hello ${name}"} → {@code 'Hello ' + name})</li>
 *   <li>Add implicit root-object prefix to bare identifiers</li>
 * </ul>
 */
public class Preprocessor {

    /**
     * Applies all preprocessing rules to the given expression string.
     *
     * @param expression raw expression (may contain application-specific syntax)
     * @return a standard SpEL expression ready for the {@link Tokenizer}
     */
    public String preprocess(String expression) {
        if (expression == null) return "";
        String result = expression.trim();
        result = expandTemplateStrings(result);
        return result;
    }

    /**
     * Expands double-quoted template strings with {@code ${…}} interpolations into
     * SpEL string concatenation.
     *
     * <p>Example: {@code "Hello ${name}!"} → {@code 'Hello ' + name + '!'}</p>
     *
     * <p>This allows the application to write more natural template expressions while still
     * using the standard SpEL evaluator underneath.
     */
    private String expandTemplateStrings(String expr) {
        if (!expr.startsWith("\"")) return expr;

        // Strip the outer double quotes
        String content = expr.substring(1, expr.endsWith("\"") ? expr.length() - 1 : expr.length());
        StringBuilder sb = new StringBuilder();
        int i = 0;
        boolean firstSegment = true;

        while (i < content.length()) {
            int interpStart = content.indexOf("${", i);
            if (interpStart < 0) {
                // Remaining literal text
                String literal = content.substring(i);
                if (!literal.isEmpty()) {
                    if (!firstSegment) sb.append(" + ");
                    sb.append('\'').append(escapeSingle(literal)).append('\'');
                    firstSegment = false;
                }
                break;
            }

            // Literal segment before ${
            String literal = content.substring(i, interpStart);
            if (!literal.isEmpty()) {
                if (!firstSegment) sb.append(" + ");
                sb.append('\'').append(escapeSingle(literal)).append('\'');
                firstSegment = false;
            }

            // Find closing }
            int interpEnd = content.indexOf("}", interpStart + 2);
            if (interpEnd < 0) {
                // Malformed interpolation — treat the rest as literal
                String rest = content.substring(interpStart);
                if (!firstSegment) sb.append(" + ");
                sb.append('\'').append(escapeSingle(rest)).append('\'');
                firstSegment = false;
                break;
            }

            String innerExpr = content.substring(interpStart + 2, interpEnd).trim();
            if (!firstSegment) sb.append(" + ");
            sb.append(innerExpr);
            firstSegment = false;

            i = interpEnd + 1;
        }

        // If nothing was produced (e.g. empty string), return an empty SpEL string literal
        return sb.length() == 0 ? "''" : sb.toString();
    }

    /** Escapes single quotes within a string literal segment. */
    private static String escapeSingle(String s) {
        return s.replace("\\", "\\\\").replace("'", "\\'");
    }
}
