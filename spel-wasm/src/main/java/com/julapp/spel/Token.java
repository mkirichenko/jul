package com.julapp.spel;

/** A single token produced by the {@link Tokenizer}. */
public class Token {
    public final TokenKind kind;
    /** Raw text of the token as it appeared in the source (for literals, the parsed value). */
    public final String text;

    public Token(TokenKind kind, String text) {
        this.kind = kind;
        this.text = text;
    }

    @Override
    public String toString() {
        return kind + "(" + text + ")";
    }
}
