package com.julapp.spel;

/** Runtime exception thrown when a SpEL expression cannot be parsed or evaluated. */
public class SpelException extends RuntimeException {
    public SpelException(String message) {
        super(message);
    }
}
