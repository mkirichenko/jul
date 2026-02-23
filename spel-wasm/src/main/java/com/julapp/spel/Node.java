package com.julapp.spel;

/**
 * Abstract syntax tree node for SpEL expressions.
 *
 * <p>Each concrete subclass represents one kind of expression. The tree is produced by
 * {@link Parser} and consumed by {@link Evaluator}. No reflection is used.
 */
public abstract class Node {

    /** A literal value: {@link String}, {@link Long}, {@link Double}, {@link Boolean}, or null. */
    public static class Literal extends Node {
        public final Object value;

        public Literal(Object value) {
            this.value = value;
        }
    }

    /** A binary expression: {@code left op right}. */
    public static class BinaryOp extends Node {
        public final String op;
        public final Node left;
        public final Node right;

        public BinaryOp(String op, Node left, Node right) {
            this.op = op;
            this.left = left;
            this.right = right;
        }
    }

    /** A unary expression: {@code op operand}. Supported ops: {@code !}, {@code -}. */
    public static class UnaryOp extends Node {
        public final String op;
        public final Node operand;

        public UnaryOp(String op, Node operand) {
            this.op = op;
            this.operand = operand;
        }
    }

    /** A ternary conditional: {@code condition ? thenExpr : elseExpr}. */
    public static class Ternary extends Node {
        public final Node condition;
        public final Node thenExpr;
        public final Node elseExpr;

        public Ternary(Node condition, Node thenExpr, Node elseExpr) {
            this.condition = condition;
            this.thenExpr = thenExpr;
            this.elseExpr = elseExpr;
        }
    }

    /**
     * A {@code #name} variable reference looked up in the evaluation context's variable map.
     */
    public static class Variable extends Node {
        public final String name;

        public Variable(String name) {
            this.name = name;
        }
    }

    /**
     * A property access expression.
     *
     * <p>When {@code object} is null the property is read from the root of the evaluation
     * context. When {@code object} is another node (e.g. another {@code PropertyAccess}) it
     * represents a chained access like {@code user.address.city}.
     */
    public static class PropertyAccess extends Node {
        public final Node object;   // null → root context
        public final String property;

        public PropertyAccess(Node object, String property) {
            this.object = object;
            this.property = property;
        }
    }
}
