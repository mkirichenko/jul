package com.julapp.spel;

/** Kinds of tokens produced by the {@link Tokenizer}. */
public enum TokenKind {
    // Literals
    INT_LITERAL,
    FLOAT_LITERAL,
    STRING_LITERAL,

    // Keywords
    TRUE,
    FALSE,
    NULL,

    // Identifiers
    /** Plain identifier: used for root-property access (e.g. {@code name}, {@code user}). */
    IDENT,
    /** Hash-prefixed variable: e.g. {@code #count}. */
    HASH_IDENT,

    // Arithmetic operators
    PLUS,
    MINUS,
    STAR,
    SLASH,
    PERCENT,

    // Comparison operators
    EQ,   // ==
    NEQ,  // !=
    LT,   // <
    GT,   // >
    LE,   // <=
    GE,   // >=

    // Logical operators
    AND,  // &&
    OR,   // ||
    BANG, // !

    // Punctuation
    QUESTION, // ?
    COLON,    // :
    DOT,      // .
    LPAREN,   // (
    RPAREN,   // )

    EOF
}
