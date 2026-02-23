package com.julapp.spel;

/**
 * Tree-walking evaluator for the SpEL AST produced by {@link Parser}.
 *
 * <p>Result types: {@link String}, {@link Long}, {@link Double}, {@link Boolean}, or {@code null}.
 * No reflection is used; this class is J2WASM-compatible.
 */
public class Evaluator {

    /**
     * Evaluates {@code node} against the given context and returns the result.
     *
     * @throws SpelException if the expression is semantically invalid.
     */
    public Object evaluate(Node node, EvaluationContext ctx) {
        if (node instanceof Node.Literal) {
            return ((Node.Literal) node).value;
        }
        if (node instanceof Node.Variable) {
            return ctx.getVariable(((Node.Variable) node).name);
        }
        if (node instanceof Node.PropertyAccess) {
            Node.PropertyAccess pa = (Node.PropertyAccess) node;
            if (pa.object == null) {
                return ctx.getRootProperty(pa.property);
            }
            Object obj = evaluate(pa.object, ctx);
            return ctx.getProperty(obj, pa.property);
        }
        if (node instanceof Node.UnaryOp) {
            Node.UnaryOp uo = (Node.UnaryOp) node;
            return evaluateUnary(uo.op, evaluate(uo.operand, ctx));
        }
        if (node instanceof Node.BinaryOp) {
            return evaluateBinary((Node.BinaryOp) node, ctx);
        }
        if (node instanceof Node.Ternary) {
            Node.Ternary t = (Node.Ternary) node;
            Object cond = evaluate(t.condition, ctx);
            return evaluate(isTruthy(cond) ? t.thenExpr : t.elseExpr, ctx);
        }
        throw new SpelException("Unknown AST node type");
    }

    // -------------------------------------------------------------------------
    // Unary
    // -------------------------------------------------------------------------

    private Object evaluateUnary(String op, Object val) {
        if ("!".equals(op)) {
            return !isTruthy(val);
        }
        if ("-".equals(op)) {
            if (val instanceof Long) return -(Long) val;
            if (val instanceof Double) return -(Double) val;
            throw new SpelException("Unary '-' requires a numeric operand, got: " + val);
        }
        throw new SpelException("Unknown unary operator: " + op);
    }

    // -------------------------------------------------------------------------
    // Binary
    // -------------------------------------------------------------------------

    private Object evaluateBinary(Node.BinaryOp bo, EvaluationContext ctx) {
        // Short-circuit logical operators (evaluate left first)
        if ("&&".equals(bo.op)) {
            return isTruthy(evaluate(bo.left, ctx)) && isTruthy(evaluate(bo.right, ctx));
        }
        if ("||".equals(bo.op)) {
            return isTruthy(evaluate(bo.left, ctx)) || isTruthy(evaluate(bo.right, ctx));
        }

        Object left  = evaluate(bo.left,  ctx);
        Object right = evaluate(bo.right, ctx);

        switch (bo.op) {
            case "+":  return add(left, right);
            case "-":  return subtract(left, right);
            case "*":  return multiply(left, right);
            case "/":  return divide(left, right);
            case "%":  return modulo(left, right);
            case "==": return valuesEqual(left, right);
            case "!=": return !valuesEqual(left, right);
            case "<":  return compare(left, right) < 0;
            case ">":  return compare(left, right) > 0;
            case "<=": return compare(left, right) <= 0;
            case ">=": return compare(left, right) >= 0;
            default:   throw new SpelException("Unknown binary operator: " + bo.op);
        }
    }

    // -------------------------------------------------------------------------
    // Arithmetic helpers
    // -------------------------------------------------------------------------

    private Object add(Object l, Object r) {
        // String concatenation takes priority when either side is a String
        if (l instanceof String || r instanceof String) {
            return stringify(l) + stringify(r);
        }
        if (l instanceof Double || r instanceof Double) {
            return toDouble(l) + toDouble(r);
        }
        if (l instanceof Long && r instanceof Long) {
            return (Long) l + (Long) r;
        }
        throw new SpelException("Cannot apply '+' to: " + l + ", " + r);
    }

    private Object subtract(Object l, Object r) {
        if (l instanceof Double || r instanceof Double) {
            return toDouble(l) - toDouble(r);
        }
        if (l instanceof Long && r instanceof Long) {
            return (Long) l - (Long) r;
        }
        throw new SpelException("Cannot apply '-' to: " + l + ", " + r);
    }

    private Object multiply(Object l, Object r) {
        if (l instanceof Double || r instanceof Double) {
            return toDouble(l) * toDouble(r);
        }
        if (l instanceof Long && r instanceof Long) {
            return (Long) l * (Long) r;
        }
        throw new SpelException("Cannot apply '*' to: " + l + ", " + r);
    }

    private Object divide(Object l, Object r) {
        if (l instanceof Double || r instanceof Double) {
            double denom = toDouble(r);
            if (denom == 0.0) throw new SpelException("Division by zero");
            return toDouble(l) / denom;
        }
        if (l instanceof Long && r instanceof Long) {
            long denom = (Long) r;
            if (denom == 0L) throw new SpelException("Division by zero");
            return (Long) l / denom;
        }
        throw new SpelException("Cannot apply '/' to: " + l + ", " + r);
    }

    private Object modulo(Object l, Object r) {
        if (l instanceof Long && r instanceof Long) {
            long denom = (Long) r;
            if (denom == 0L) throw new SpelException("Modulo by zero");
            return (Long) l % denom;
        }
        throw new SpelException("Cannot apply '%' to: " + l + ", " + r);
    }

    // -------------------------------------------------------------------------
    // Comparison helpers
    // -------------------------------------------------------------------------

    private boolean valuesEqual(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a instanceof Number && b instanceof Number) {
            return toDouble(a) == toDouble(b);
        }
        return a.equals(b);
    }

    @SuppressWarnings("unchecked")
    private int compare(Object a, Object b) {
        if (a instanceof Number && b instanceof Number) {
            return Double.compare(toDouble(a), toDouble(b));
        }
        if (a instanceof Comparable && b instanceof Comparable) {
            return ((Comparable<Object>) a).compareTo(b);
        }
        throw new SpelException("Cannot compare values: " + a + ", " + b);
    }

    // -------------------------------------------------------------------------
    // Utility helpers
    // -------------------------------------------------------------------------

    private boolean isTruthy(Object val) {
        if (val == null) return false;
        if (val instanceof Boolean) return (Boolean) val;
        if (val instanceof Long) return (Long) val != 0L;
        if (val instanceof Double) return (Double) val != 0.0;
        if (val instanceof String) return !((String) val).isEmpty();
        return true;
    }

    private double toDouble(Object val) {
        if (val instanceof Long) return (double) (Long) val;
        if (val instanceof Double) return (Double) val;
        throw new SpelException("Expected number, got: " + val);
    }

    private String stringify(Object val) {
        return val == null ? "null" : val.toString();
    }
}
