package com.julapp.spel;

import java.util.ArrayList;
import java.util.List;

/**
 * Lexer for a Spring Expression Language (SpEL) subset.
 *
 * <p>Converts a raw expression string into a flat list of {@link Token}s terminated by
 * {@link TokenKind#EOF}. No reflection is used; this class is J2WASM-compatible.
 */
public class Tokenizer {
    private final String input;
    private int pos;

    public Tokenizer(String input) {
        this.input = input;
        this.pos = 0;
    }

    public List<Token> tokenize() {
        List<Token> tokens = new ArrayList<>();
        while (pos < input.length()) {
            skipWhitespace();
            if (pos >= input.length()) break;
            tokens.add(nextToken());
        }
        tokens.add(new Token(TokenKind.EOF, ""));
        return tokens;
    }

    private void skipWhitespace() {
        while (pos < input.length() && Character.isWhitespace(input.charAt(pos))) {
            pos++;
        }
    }

    private Token nextToken() {
        char c = input.charAt(pos);

        if (c == '\'') return readString();
        if (Character.isDigit(c)) return readNumber();
        if (Character.isLetter(c) || c == '_') return readIdent();
        if (c == '#') return readHashIdent();

        pos++;
        switch (c) {
            case '+': return new Token(TokenKind.PLUS, "+");
            case '-': return new Token(TokenKind.MINUS, "-");
            case '*': return new Token(TokenKind.STAR, "*");
            case '/': return new Token(TokenKind.SLASH, "/");
            case '%': return new Token(TokenKind.PERCENT, "%");
            case '?': return new Token(TokenKind.QUESTION, "?");
            case ':': return new Token(TokenKind.COLON, ":");
            case '.': return new Token(TokenKind.DOT, ".");
            case '(': return new Token(TokenKind.LPAREN, "(");
            case ')': return new Token(TokenKind.RPAREN, ")");
            case '!':
                if (pos < input.length() && input.charAt(pos) == '=') {
                    pos++;
                    return new Token(TokenKind.NEQ, "!=");
                }
                return new Token(TokenKind.BANG, "!");
            case '=':
                if (pos < input.length() && input.charAt(pos) == '=') {
                    pos++;
                    return new Token(TokenKind.EQ, "==");
                }
                throw new SpelException("Unexpected '=' at position " + (pos - 1) +
                        "; did you mean '=='?");
            case '<':
                if (pos < input.length() && input.charAt(pos) == '=') {
                    pos++;
                    return new Token(TokenKind.LE, "<=");
                }
                return new Token(TokenKind.LT, "<");
            case '>':
                if (pos < input.length() && input.charAt(pos) == '=') {
                    pos++;
                    return new Token(TokenKind.GE, ">=");
                }
                return new Token(TokenKind.GT, ">");
            case '&':
                if (pos < input.length() && input.charAt(pos) == '&') {
                    pos++;
                    return new Token(TokenKind.AND, "&&");
                }
                throw new SpelException("Single '&' is not supported; use '&&'");
            case '|':
                if (pos < input.length() && input.charAt(pos) == '|') {
                    pos++;
                    return new Token(TokenKind.OR, "||");
                }
                throw new SpelException("Single '|' is not supported; use '||'");
            default:
                throw new SpelException("Unexpected character '" + c +
                        "' at position " + (pos - 1));
        }
    }

    /** Reads a single-quoted string literal. Supports \n, \t, \', \\ escapes. */
    private Token readString() {
        pos++; // skip opening '
        StringBuilder sb = new StringBuilder();
        while (pos < input.length()) {
            char c = input.charAt(pos);
            if (c == '\'') {
                pos++;
                break;
            }
            if (c == '\\' && pos + 1 < input.length()) {
                pos++;
                char esc = input.charAt(pos);
                switch (esc) {
                    case 'n':  sb.append('\n'); break;
                    case 't':  sb.append('\t'); break;
                    case '\'': sb.append('\''); break;
                    case '\\': sb.append('\\'); break;
                    default:   sb.append('\\'); sb.append(esc); break;
                }
            } else {
                sb.append(c);
            }
            pos++;
        }
        return new Token(TokenKind.STRING_LITERAL, sb.toString());
    }

    /** Reads an integer or floating-point literal. */
    private Token readNumber() {
        int start = pos;
        while (pos < input.length() && Character.isDigit(input.charAt(pos))) pos++;
        if (pos < input.length() && input.charAt(pos) == '.') {
            pos++;
            while (pos < input.length() && Character.isDigit(input.charAt(pos))) pos++;
            return new Token(TokenKind.FLOAT_LITERAL, input.substring(start, pos));
        }
        return new Token(TokenKind.INT_LITERAL, input.substring(start, pos));
    }

    /** Reads an identifier and classifies keywords (true, false, null). */
    private Token readIdent() {
        int start = pos;
        while (pos < input.length() &&
               (Character.isLetterOrDigit(input.charAt(pos)) || input.charAt(pos) == '_')) {
            pos++;
        }
        String text = input.substring(start, pos);
        switch (text) {
            case "true":  return new Token(TokenKind.TRUE, text);
            case "false": return new Token(TokenKind.FALSE, text);
            case "null":  return new Token(TokenKind.NULL, text);
            default:      return new Token(TokenKind.IDENT, text);
        }
    }

    /** Reads a #-prefixed variable reference (e.g. {@code #count}). */
    private Token readHashIdent() {
        pos++; // skip '#'
        int start = pos;
        while (pos < input.length() &&
               (Character.isLetterOrDigit(input.charAt(pos)) || input.charAt(pos) == '_')) {
            pos++;
        }
        if (pos == start) {
            throw new SpelException("Expected identifier after '#'");
        }
        return new Token(TokenKind.HASH_IDENT, input.substring(start, pos));
    }
}
