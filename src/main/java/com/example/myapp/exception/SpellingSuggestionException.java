package com.example.myapp.exception;

public class SpellingSuggestionException extends IllegalArgumentException {
    private final String suggestion;

    public SpellingSuggestionException(String suggestion) {
        super("The word you searched for might be misspelled. Did you mean: " + suggestion + "?");
        this.suggestion = suggestion;
    }

    public String getSuggestion() {
        return suggestion;
    }
}
