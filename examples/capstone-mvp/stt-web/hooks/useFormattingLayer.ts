"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const CHUNK_SIZE = 2000;
const MIN_BUFFER = 200;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

interface FormattingState {
  formattedText: string;
  cursor: number;
  isProcessing: boolean;
  processedChars: number;
  totalChars: number;
  error: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useFormattingLayer(rawText: string) {
  const [state, setState] = useState<FormattingState>({
    formattedText: "",
    cursor: 0,
    isProcessing: false,
    processedChars: 0,
    totalChars: 0,
    error: null,
  });

  const cursorRef = useRef(0);
  const formattedRef = useRef("");
  const processedRef = useRef(0);
  const busyRef = useRef(false);
  const rawTextRef = useRef(rawText);
  rawTextRef.current = rawText;

  const reset = useCallback(() => {
    cursorRef.current = 0;
    formattedRef.current = "";
    processedRef.current = 0;
    busyRef.current = false;
    setState({
      formattedText: "",
      cursor: 0,
      isProcessing: false,
      processedChars: 0,
      totalChars: 0,
      error: null,
    });
  }, []);

  const processChunk = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      while (true) {
        const cursor = cursorRef.current;
        const remaining = rawTextRef.current.slice(cursor);

        if (remaining.length < MIN_BUFFER) {
          setState((prev) => ({ ...prev, isProcessing: false }));
          break;
        }

        const chunk = remaining.slice(0, CHUNK_SIZE);

        setState((prev) => ({
          ...prev,
          isProcessing: true,
          totalChars: rawTextRef.current.length,
          error: null,
        }));

        // Exponential backoff retry
        let success = false;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
            await sleep(delay);
          }

          try {
            const res = await fetch("/api/format", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: chunk, cursor }),
            });

            if (!res.ok) {
              // Retryable errors: 502, 503, 504, 429
              if ([502, 503, 504, 429].includes(res.status) && attempt < MAX_RETRIES - 1) {
                continue;
              }
              const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
              throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const newFormatted = data.formatted || chunk;
            const newCursor = data.new_cursor || cursor + chunk.length;
            const processed = data.processed_chars || chunk.length;

            cursorRef.current = newCursor;
            formattedRef.current = formattedRef.current + newFormatted;
            processedRef.current = processedRef.current + processed;

            setState((prev) => ({
              ...prev,
              formattedText: formattedRef.current,
              cursor: newCursor,
              processedChars: processedRef.current,
              totalChars: rawTextRef.current.length,
            }));

            success = true;
            break;
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            // Retryable: network errors, timeouts, 502/503/504
            const isRetryable = message.includes("Failed to fetch") ||
              message.includes("502") ||
              message.includes("503") ||
              message.includes("504") ||
              message.includes("429") ||
              message.includes("timeout") ||
              message.includes("NetworkError");

            if (isRetryable && attempt < MAX_RETRIES - 1) {
              continue;
            }

            // Non-retryable or max retries exceeded — skip chunk
            cursorRef.current = cursor + chunk.length;
            processedRef.current = processedRef.current + chunk.length;
            formattedRef.current = formattedRef.current + chunk;
            setState((prev) => ({
              ...prev,
              cursor: cursorRef.current,
              processedChars: processedRef.current,
              formattedText: formattedRef.current,
              isProcessing: false,
              error: attempt >= MAX_RETRIES - 1 ? `${message} (${MAX_RETRIES}회 재시도 실패)` : message,
            }));
            break;
          }
        }

        if (!success) break;

        const nextRemaining = rawTextRef.current.slice(cursorRef.current);
        if (nextRemaining.length < MIN_BUFFER) {
          setState((prev) => ({ ...prev, isProcessing: false }));
          break;
        }
      }
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (rawText.length === 0) {
      reset();
      return;
    }

    const unprocessed = rawText.length - cursorRef.current;
    if (unprocessed >= MIN_BUFFER && !busyRef.current) {
      processChunk();
    }
  }, [rawText, processChunk, reset]);

  return {
    formattedText: state.formattedText,
    isFormatting: state.isProcessing,
    processedChars: state.processedChars,
    totalChars: state.totalChars,
    formatError: state.error,
    resetFormatting: reset,
  };
}
