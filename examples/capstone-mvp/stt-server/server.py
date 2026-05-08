"""
Mock Streaming STT Server — Railway deployment ready.
CORS enabled, listens on PORT env var.
Text files bundled from texts/ directory.
"""

import asyncio
import json
import logging
import os
import random
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sst-mock")

TEXT_DIR = Path(__file__).parent / "texts"
DEFAULT_CHUNK_DELAY = 0.1
DEFAULT_WORDS_PER_CHUNK = 15
AUDIO_BYTES_PER_SEGMENT = 32000


@dataclass
class SessionConfig:
    sample_rate: int = 16000
    language: str = "ko"
    text_file: Optional[str] = None
    text_content: Optional[str] = None
    chunk_delay: float = DEFAULT_CHUNK_DELAY
    words_per_chunk: int = DEFAULT_WORDS_PER_CHUNK
    confidence_base: float = 0.85
    confidence_variance: float = 0.12


@dataclass
class TranscriptionSession:
    config: SessionConfig
    full_text: str = ""
    words: list = field(default_factory=list)
    current_index: int = 0
    audio_bytes_received: int = 0
    is_finished: bool = False


def split_into_sentences(text: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?。！？\n])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 5]


def split_words(text: str) -> list[str]:
    tokens = re.split(r'(\s+)', text.strip())
    return [t for t in tokens if t.strip()]


def create_session(config: SessionConfig) -> TranscriptionSession:
    session = TranscriptionSession(config=config)

    if config.text_content:
        session.full_text = config.text_content
    elif config.text_file:
        path = TEXT_DIR / config.text_file
        if not path.is_absolute():
            path = TEXT_DIR / config.text_file
        if path.exists():
            session.full_text = path.read_text(encoding="utf-8")
        else:
            files = sorted(TEXT_DIR.glob("*.txt"))
            if files:
                session.full_text = files[0].read_text(encoding="utf-8")

    if not session.full_text:
        session.full_text = "이것은 목업 음성 인식 서버의 기본 텍스트입니다."

    session.words = split_words(session.full_text)
    return session


app = FastAPI(title="Mock Streaming STT Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Mock Streaming STT",
        "version": "1.0.0",
        "endpoints": {
            "ws": "/stt/stream",
            "ws_simulate": "/stt/simulate",
            "health": "/health",
            "texts": "/texts",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/texts")
async def list_texts():
    texts = []
    if TEXT_DIR.exists():
        for f in sorted(TEXT_DIR.glob("*.txt")):
            size = f.stat().st_size
            texts.append({"name": f.name, "size": size, "chars": size})
    return {"texts": texts, "directory": str(TEXT_DIR)}


@app.websocket("/stt/stream")
async def stt_stream(
    websocket: WebSocket,
    text_file: Optional[str] = Query(default=None),
    language: str = Query(default="ko"),
    sample_rate: int = Query(default=16000),
    chunk_delay: float = Query(default=DEFAULT_CHUNK_DELAY),
    words_per_chunk: int = Query(default=DEFAULT_WORDS_PER_CHUNK),
):
    await websocket.accept()

    config = SessionConfig(
        sample_rate=sample_rate, language=language,
        text_file=text_file, chunk_delay=chunk_delay,
        words_per_chunk=words_per_chunk,
    )
    session = create_session(config)

    await websocket.send_json({
        "type": "listening",
        "sample_rate": config.sample_rate,
        "language": config.language,
        "text_length": len(session.full_text),
    })

    logger.info(f"Stream session: file={text_file}, text={len(session.full_text)} chars")

    try:
        while True:
            data = await websocket.receive()

            if "bytes" in data and data["bytes"]:
                audio_bytes = data["bytes"]
                session.audio_bytes_received += len(audio_bytes)

                if session.current_index < len(session.words):
                    end_idx = min(session.current_index + config.words_per_chunk, len(session.words))
                    chunk_words = session.words[session.current_index:end_idx]
                    chunk_text = "".join(chunk_words)

                    bytes_per_word = AUDIO_BYTES_PER_SEGMENT / max(config.words_per_chunk, 1)
                    expected_bytes = (session.current_index // config.words_per_chunk + 1) * AUDIO_BYTES_PER_SEGMENT

                    if session.audio_bytes_received >= expected_bytes:
                        confidence = round(config.confidence_base + random.uniform(0, config.confidence_variance), 3)
                        await websocket.send_json({
                            "type": "final", "text": chunk_text.strip(),
                            "index": session.current_index // config.words_per_chunk,
                            "confidence": confidence, "words": len(chunk_words),
                        })
                        session.current_index = end_idx
                    else:
                        await websocket.send_json({
                            "type": "interim", "text": chunk_text.strip(),
                            "index": session.current_index // config.words_per_chunk,
                        })

                    await asyncio.sleep(config.chunk_delay * 0.3)

            elif "text" in data and data["text"]:
                try:
                    msg = json.loads(data["text"])
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                    continue

                if msg.get("type") == "config":
                    if msg.get("text_content"):
                        session.full_text = msg["text_content"]
                        session.words = split_words(session.full_text)
                        session.current_index = 0
                    if msg.get("chunk_delay"):
                        config.chunk_delay = msg["chunk_delay"]
                    await websocket.send_json({"type": "config_ack", "config_received": True})

                elif msg.get("type") == "terminate":
                    await websocket.send_json({
                        "type": "speech_ended",
                        "total_index": session.current_index,
                        "total_audio_bytes": session.audio_bytes_received,
                    })
                    await asyncio.sleep(0.05)
                    return

                elif msg.get("type") == "flush":
                    if session.current_index < len(session.words):
                        remaining = "".join(session.words[session.current_index:])
                        await websocket.send_json({
                            "type": "final", "text": remaining.strip(),
                            "index": session.current_index // config.words_per_chunk,
                            "confidence": round(config.confidence_base + 0.05, 3),
                            "flushed": True,
                        })
                        session.current_index = len(session.words)

    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Error: {e}")


@app.websocket("/stt/simulate")
async def stt_simulate(
    websocket: WebSocket,
    text_file: Optional[str] = Query(default=None),
    language: str = Query(default="ko"),
    speed: float = Query(default=1.0),
):
    await websocket.accept()

    config = SessionConfig(language=language, text_file=text_file)
    session = create_session(config)

    await websocket.send_json({
        "type": "listening", "mode": "simulate",
        "text_length": len(session.full_text),
    })

    logger.info(f"Simulate session: file={text_file}, text={len(session.full_text)} chars")

    try:
        sentences = split_into_sentences(session.full_text)
        if not sentences:
            sentences = [session.full_text]

        cumulative_text = ""
        for i, sentence in enumerate(sentences):
            words = split_words(sentence)
            interim_text = ""
            for j, word in enumerate(words):
                interim_text += word
                if j % 3 == 0 and j > 0:
                    await websocket.send_json({
                        "type": "interim",
                        "text": (cumulative_text + " " + interim_text).strip(),
                        "index": i,
                        "progress": (i * len(words) + j) / (len(sentences) * len(words)) * 100,
                    })
                    # ~0.15s per word at speed=1 ≈ natural Korean speech pace
                    await asyncio.sleep(0.45 / speed)

            cumulative_text = (cumulative_text + " " + sentence).strip()
            await websocket.send_json({
                "type": "final", "text": sentence.strip(), "index": i,
                "confidence": round(0.85 + random.uniform(0, 0.12), 3),
                "cumulative_text": cumulative_text,
                "progress": ((i + 1) / len(sentences)) * 100,
            })
            # Natural pause between sentences
            await asyncio.sleep(0.6 / speed)

        await websocket.send_json({
            "type": "speech_ended",
            "total_index": len(sentences),
            "full_text": cumulative_text,
        })
        await asyncio.sleep(0.05)

    except WebSocketDisconnect:
        logger.info("Simulate client disconnected")
    except Exception as e:
        logger.error(f"Simulate error: {e}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
