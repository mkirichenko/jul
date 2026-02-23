package com.julapp.spel;

import java.util.HashMap;
import java.util.Map;

/**
 * Holds the variables and root-object properties available during expression evaluation.
 *
 * <p>Variables are accessed with {@code #name} syntax. Root properties are accessed by plain
 * identifier (e.g. {@code age}, {@code user.address.city}).
 *
 * <p>Properties are stored as plain {@code Map<String, Object>} entries — no reflection is used,
 * making this class fully J2WASM-compatible.
 */
public class EvaluationContext {

    private final Map<String, Object> rootProperties;
    private final Map<String, Object> variables = new HashMap<>();

    public EvaluationContext(Map<String, Object> rootProperties) {
        this.rootProperties = rootProperties;
    }

    // -------------------------------------------------------------------------
    // Variable access (#name)
    // -------------------------------------------------------------------------

    public void setVariable(String name, Object value) {
        variables.put(name, value);
    }

    public Object getVariable(String name) {
        if (!variables.containsKey(name)) {
            throw new SpelException("Undefined variable: #" + name);
        }
        return variables.get(name);
    }

    // -------------------------------------------------------------------------
    // Root property access (plain identifier)
    // -------------------------------------------------------------------------

    public Object getRootProperty(String name) {
        if (!rootProperties.containsKey(name)) {
            throw new SpelException("Undefined property: " + name);
        }
        return rootProperties.get(name);
    }

    /**
     * Resolves a named property on an arbitrary object.
     *
     * <p>Supported object types:
     * <ul>
     *   <li>{@code Map<String, Object>} — property is a map key.</li>
     * </ul>
     *
     * <p>Additional types can be handled here as the application grows, without introducing
     * reflection.
     */
    @SuppressWarnings("unchecked")
    public Object getProperty(Object object, String property) {
        if (object instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) object;
            if (!map.containsKey(property)) {
                throw new SpelException("Property '" + property + "' not found in map");
            }
            return map.get(property);
        }
        throw new SpelException(
                "Cannot access property '" + property + "' on value of this type");
    }

    // -------------------------------------------------------------------------
    // Factory: parse a flat JSON object into a context
    // -------------------------------------------------------------------------

    /**
     * Creates an {@link EvaluationContext} from a flat JSON object string.
     *
     * <p>Supports a single-level JSON object with string, number (integer and float), boolean,
     * and null values. Nested objects are not supported at this level; pass them as nested
     * maps via {@link #setVariable} if needed.
     *
     * <p>Example: {@code {"name":"Alice","age":30,"active":true}}
     */
    public static EvaluationContext fromJson(String json) {
        Map<String, Object> map = new HashMap<>();
        if (json == null) {
            return new EvaluationContext(map);
        }
        json = json.trim();
        if (!json.startsWith("{") || !json.endsWith("}")) {
            return new EvaluationContext(map);
        }
        String content = json.substring(1, json.length() - 1).trim();
        if (!content.isEmpty()) {
            parseJsonPairs(content, map);
        }
        return new EvaluationContext(map);
    }

    /** Minimal JSON key-value pair parser (flat objects only, no nested objects/arrays). */
    private static void parseJsonPairs(String s, Map<String, Object> out) {
        int i = 0;
        while (i < s.length()) {
            // Skip whitespace / commas between entries
            while (i < s.length() &&
                   (Character.isWhitespace(s.charAt(i)) || s.charAt(i) == ',')) {
                i++;
            }
            if (i >= s.length()) break;

            // --- key (must be a double-quoted string) ---
            if (s.charAt(i) != '"') break;
            i++;
            int keyStart = i;
            while (i < s.length() && s.charAt(i) != '"') i++;
            String key = s.substring(keyStart, i);
            i++; // closing "

            // Skip whitespace and colon
            while (i < s.length() &&
                   (Character.isWhitespace(s.charAt(i)) || s.charAt(i) == ':')) {
                i++;
            }
            if (i >= s.length()) break;

            // --- value ---
            char vc = s.charAt(i);
            Object value;

            if (vc == '"') {
                // String value
                i++;
                int valStart = i;
                while (i < s.length() && s.charAt(i) != '"') i++;
                value = s.substring(valStart, i);
                i++; // closing "
            } else if (s.startsWith("true", i)) {
                value = Boolean.TRUE;
                i += 4;
            } else if (s.startsWith("false", i)) {
                value = Boolean.FALSE;
                i += 5;
            } else if (s.startsWith("null", i)) {
                value = null;
                i += 4;
            } else if (vc == '-' || Character.isDigit(vc)) {
                int numStart = i;
                if (vc == '-') i++;
                while (i < s.length() && Character.isDigit(s.charAt(i))) i++;
                boolean isFloat = i < s.length() && s.charAt(i) == '.';
                if (isFloat) {
                    i++;
                    while (i < s.length() && Character.isDigit(s.charAt(i))) i++;
                    value = Double.parseDouble(s.substring(numStart, i));
                } else {
                    value = Long.parseLong(s.substring(numStart, i));
                }
            } else {
                break; // unsupported value type — stop parsing
            }

            out.put(key, value);
        }
    }
}
