package com.julapp.spel;

import java.util.List;

/**
 * Recursive-descent parser for a SpEL expression subset.
 *
 * <p>Grammar (operator precedence, lowest → highest):
 * <pre>
 *   expr          → ternary
 *   ternary       → logical ( '?' expr ':' expr )?
 *   logical       → comparison ( ('&&' | '||') comparison )*
 *   comparison    → additive  ( ('==' | '!=' | '<' | '>' | '<=' | '>=') additive )?
 *   additive      → multiplicative ( ('+' | '-') multiplicative )*
 *   multiplicative→ unary     ( ('*' | '/' | '%') unary )*
 *   unary         → ('!' | '-') unary | primary
 *   primary       → INT_LITERAL | FLOAT_LITERAL | STRING_LITERAL
 *                 | 'true' | 'false' | 'null'
 *                 | '(' expr ')'
 *                 | '#' IDENT
 *                 | IDENT ('.' IDENT)*
 * </pre>
 *
 * <p>No reflection is used; this class is J2WASM-compatible.
 */
public class Parser {
    private final List<Token> tokens;
    private int pos;

    public Parser(List<Token> tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    /** Parses the full token stream and returns the root AST node. */
    public Node parse() {
        Node result = parseExpr();
        expect(TokenKind.EOF);
        return result;
    }

    // -------------------------------------------------------------------------
    // Recursive descent rules
    // -------------------------------------------------------------------------

    private Node parseExpr() {
        return parseTernary();
    }

    private Node parseTernary() {
        Node cond = parseLogical();
        if (peek().kind == TokenKind.QUESTION) {
            consume(); // '?'
            Node thenExpr = parseExpr();
            expect(TokenKind.COLON);
            Node elseExpr = parseExpr();
            return new Node.Ternary(cond, thenExpr, elseExpr);
        }
        return cond;
    }

    private Node parseLogical() {
        Node left = parseComparison();
        while (peek().kind == TokenKind.AND || peek().kind == TokenKind.OR) {
            String op = consume().text;
            Node right = parseComparison();
            left = new Node.BinaryOp(op, left, right);
        }
        return left;
    }

    private Node parseComparison() {
        Node left = parseAdditive();
        TokenKind k = peek().kind;
        if (k == TokenKind.EQ  || k == TokenKind.NEQ ||
            k == TokenKind.LT  || k == TokenKind.GT  ||
            k == TokenKind.LE  || k == TokenKind.GE) {
            String op = consume().text;
            Node right = parseAdditive();
            return new Node.BinaryOp(op, left, right);
        }
        return left;
    }

    private Node parseAdditive() {
        Node left = parseMultiplicative();
        while (peek().kind == TokenKind.PLUS || peek().kind == TokenKind.MINUS) {
            String op = consume().text;
            Node right = parseMultiplicative();
            left = new Node.BinaryOp(op, left, right);
        }
        return left;
    }

    private Node parseMultiplicative() {
        Node left = parseUnary();
        while (peek().kind == TokenKind.STAR  ||
               peek().kind == TokenKind.SLASH ||
               peek().kind == TokenKind.PERCENT) {
            String op = consume().text;
            Node right = parseUnary();
            left = new Node.BinaryOp(op, left, right);
        }
        return left;
    }

    private Node parseUnary() {
        if (peek().kind == TokenKind.BANG) {
            consume();
            return new Node.UnaryOp("!", parseUnary());
        }
        if (peek().kind == TokenKind.MINUS) {
            consume();
            return new Node.UnaryOp("-", parseUnary());
        }
        return parsePrimary();
    }

    private Node parsePrimary() {
        Token t = peek();

        // Grouped sub-expression
        if (t.kind == TokenKind.LPAREN) {
            consume();
            Node inner = parseExpr();
            expect(TokenKind.RPAREN);
            return inner;
        }

        // Integer literal
        if (t.kind == TokenKind.INT_LITERAL) {
            consume();
            return new Node.Literal(Long.parseLong(t.text));
        }

        // Floating-point literal
        if (t.kind == TokenKind.FLOAT_LITERAL) {
            consume();
            return new Node.Literal(Double.parseDouble(t.text));
        }

        // String literal (single-quoted, already unescaped by the tokenizer)
        if (t.kind == TokenKind.STRING_LITERAL) {
            consume();
            return new Node.Literal(t.text);
        }

        // Boolean / null keywords
        if (t.kind == TokenKind.TRUE) {
            consume();
            return new Node.Literal(Boolean.TRUE);
        }
        if (t.kind == TokenKind.FALSE) {
            consume();
            return new Node.Literal(Boolean.FALSE);
        }
        if (t.kind == TokenKind.NULL) {
            consume();
            return new Node.Literal(null);
        }

        // Variable reference: #name
        if (t.kind == TokenKind.HASH_IDENT) {
            consume();
            return new Node.Variable(t.text);
        }

        // Identifier: root property or chained property access (a.b.c)
        if (t.kind == TokenKind.IDENT) {
            consume();
            Node node = new Node.PropertyAccess(null, t.text);
            while (peek().kind == TokenKind.DOT) {
                consume(); // '.'
                Token prop = expect(TokenKind.IDENT);
                node = new Node.PropertyAccess(node, prop.text);
            }
            return node;
        }

        throw new SpelException("Unexpected token: " + t);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Token peek() {
        return tokens.get(pos);
    }

    private Token consume() {
        return tokens.get(pos++);
    }

    private Token expect(TokenKind kind) {
        Token t = consume();
        if (t.kind != kind) {
            throw new SpelException("Expected " + kind + " but got " + t);
        }
        return t;
    }
}
