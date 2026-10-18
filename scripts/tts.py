#!/usr/bin/env python3
"""Озвучка слов и примеров, у которых ещё нет аудио (запускается workflow «Озвучка» в GitHub Actions).

Что озвучивается — ровно то, что приложение показывает без кнопки звука. В армянской версии сначала это
весь словарь (≈4 100 слов и ≈12 500 примеров — несколько запусков по --limit), потом — только новые и
исправленные слова и примеры (data/word_fixes.csv, data/fixes.csv).
Список берётся из data/build/words.csv и examples.csv (результат scripts/build_vocab.py): строки с audio_ok = f,
кроме скрытых примеров и уже озвученных файлов из data/audio_voiced.txt.

Сервисы (--engine):
  espeak — eSpeak NG, голос hy: полностью бесплатно, без регистрации, работает прямо в GitHub Actions; звучит
           «по-роботски», зато разрешено и в платном приложении (по умолчанию);
  mms    — модель Meta MMS-TTS (facebook/mms-tts-hye): бесплатно, без регистрации, работает в GitHub Actions,
           звучит естественнее, НО лицензия CC-BY-NC 4.0 запрещает коммерческое использование;
  azure  — Microsoft Azure Speech (hy-AM-AnahitNeural / HaykNeural): лучший голос, бесплатный тариф F0
           (500 000 символов в месяц), но нужен аккаунт Azure и секреты AZURE_TTS_KEY, AZURE_TTS_REGION.
Бесплатный голос браузера Edge (edge-tts) и Google gTTS армянского не знают.
Имена файлов — как в приложении: word_<id>.mp3 и word_<id>_ex<n>.mp3.

Запуск: python3 scripts/tts.py --out out/audio [--engine espeak|mms|azure|edge|gtts] [--voice hy-AM-AnahitNeural] [--limit 3000]
Готовые имена дописываются в data/audio_voiced.txt — повторный запуск продолжает с того места, где остановился.
"""
import argparse
import asyncio
import csv
import os
import random
import subprocess
import sys
import tempfile
import wave
import time
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "data" / "build"
VOICED = ROOT / "data" / "audio_voiced.txt"


def speakable(text: str) -> str:
    """Для синтеза: армянский текст как есть (знаки ՞ ՛ синтезатор учитывает в интонации)."""
    return str(text).strip()


def todo_list():
    voiced = set()
    if VOICED.exists():
        voiced = {x.strip() for x in VOICED.read_text(encoding="utf-8").split() if x.strip()}
    items = []
    with open(BUILD / "words.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            name = f"word_{r['id']}.mp3"
            if r["audio_ok"] == "f" and name not in voiced:
                items.append((name, r["uz"]))
    with open(BUILD / "examples.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            name = f"word_{r['word_id']}_ex{r['n']}.mp3"
            if r["audio_ok"] == "f" and r["is_hidden"] == "f" and name not in voiced:
                items.append((name, r["uz"]))
    return items


def gtts_ok() -> bool:
    try:
        from gtts.lang import tts_langs
        return "hy" in tts_langs()
    except Exception as e:  # noqa: BLE001
        print("gTTS недоступен:", e)
        return False


def say_gtts(text: str, path: Path):
    from gtts import gTTS
    gTTS(speakable(text), lang="hy").save(str(path))


def say_edge(text: str, path: Path, voice: str):
    import edge_tts
    asyncio.run(edge_tts.Communicate(speakable(text), voice).save(str(path)))


def to_mp3(wav: Path, path: Path):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-codec:a", "libmp3lame",
                    "-b:a", "48k", str(path)], check=True)


def say_espeak(text: str, path: Path):
    with tempfile.TemporaryDirectory() as d:
        wav = Path(d) / "a.wav"
        subprocess.run(["espeak-ng", "-v", "hy", "-s", "140", "-w", str(wav), speakable(text)], check=True)
        to_mp3(wav, path)


_MMS = {}


def say_mms(text: str, path: Path):
    import numpy as np
    import torch
    if not _MMS:
        from transformers import AutoTokenizer, VitsModel
        _MMS["tok"] = AutoTokenizer.from_pretrained("facebook/mms-tts-hye")
        _MMS["model"] = VitsModel.from_pretrained("facebook/mms-tts-hye")
        if getattr(_MMS["tok"], "is_uroman", False):
            import uroman as ur
            _MMS["uroman"] = ur.Uroman()
    t = speakable(text)
    if "uroman" in _MMS:
        t = _MMS["uroman"].romanize_string(t)
    inputs = _MMS["tok"](t, return_tensors="pt")
    with torch.no_grad():
        audio = _MMS["model"](**inputs).waveform[0].numpy()
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes()
    with tempfile.TemporaryDirectory() as d:
        wav = Path(d) / "a.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(_MMS["model"].config.sampling_rate)
            w.writeframes(pcm)
        to_mp3(wav, path)


class Throttled(Exception):
    """Azure ответил «слишком много запросов» — подождать указанное время."""
    def __init__(self, wait):
        super().__init__(f"лимит запросов Azure, ждём {wait:.0f} c")
        self.wait = wait


def say_azure(text: str, path: Path, voice: str):
    key = os.environ.get("AZURE_TTS_KEY", "").strip()
    region = os.environ.get("AZURE_TTS_REGION", "").strip()
    if not key or not region:
        raise SystemExit("Не заданы секреты AZURE_TTS_KEY и AZURE_TTS_REGION — см. README, раздел «Озвучка».")
    ssml = (f"<speak version='1.0' xml:lang='hy-AM'><voice name='{voice}'>"
            f"{escape(speakable(text))}</voice></speak>").encode("utf-8")
    req = urllib.request.Request(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1", data=ssml, method="POST",
        headers={"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
                 "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "armenian-tutor-tts"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            path.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 429:
            raise Throttled(float(e.headers.get("Retry-After") or 20)) from None
        if e.code in (401, 403):
            raise SystemExit(f"Azure отклонил ключ ({e.code}): проверьте AZURE_TTS_KEY и AZURE_TTS_REGION.") from None
        raise RuntimeError(f"Azure HTTP {e.code}: {e.read()[:200]!r}") from None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="out/audio")
    ap.add_argument("--engine", default="espeak", choices=["espeak", "mms", "azure", "edge", "gtts"])
    ap.add_argument("--voice", default="hy-AM-AnahitNeural")
    ap.add_argument("--limit", type=int, default=3000, help="не больше стольких файлов за запуск (защита от лимитов сервиса)")
    a = ap.parse_args()

    items = todo_list()
    print(f"Без аудио: {len(items)} файлов; за этот запуск — до {a.limit}")
    if not items:
        return
    engine = a.engine
    if engine == "gtts" and not gtts_ok():
        print("Google не озвучивает армянский через gTTS — переключаюсь на eSpeak NG")
        engine = "espeak"

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    done, failed = [], []
    for k, (name, text) in enumerate(items[: a.limit], start=1):
        path = out / name
        attempt = 0
        while attempt < 4:
            try:
                if engine == "gtts":
                    say_gtts(text, path)
                elif engine == "edge":
                    say_edge(text, path, a.voice)
                elif engine == "espeak":
                    say_espeak(text, path)
                elif engine == "mms":
                    say_mms(text, path)
                else:
                    say_azure(text, path, a.voice)
                if path.stat().st_size < 500:
                    raise RuntimeError("слишком короткий файл")
                done.append(name)
                break
            except Throttled as e:                   # лимит бесплатного тарифа: ждём, попытку не считаем
                print(f"  {name}: {e}")
                time.sleep(e.wait)
            except Exception as e:  # noqa: BLE001 — сеть: ждём и пробуем снова
                attempt += 1
                wait = 5 * attempt + random.random() * 3
                print(f"  {name}: {e} — повтор через {wait:.0f} c")
                time.sleep(wait)
        else:
            failed.append(name)
        # первые 5 файлов не получились — дальше не мучаем сервис, а сразу сообщаем об ошибке
        if k == 5 and len(failed) == 5:
            print("Первые 5 файлов не озвучены — остановка. Проверьте голос и секреты (см. ошибки выше).")
            sys.exit(1)
        if engine == "gtts":
            time.sleep(0.4 + random.random() * 0.4)     # бережно к бесплатному сервису
        if k % 50 == 0:
            print(f"  {k}/{min(len(items), a.limit)}")
            # сохраняем по ходу: если запуск прервётся, готовое не потеряется
            with open(VOICED, "a", encoding="utf-8") as f:
                f.write("".join(n + "\n" for n in done))
            done = []

    with open(VOICED, "a", encoding="utf-8") as f:
        f.write("".join(n + "\n" for n in done))
    left = len(items) - min(len(items), a.limit) + len(failed)
    label = {"gtts": "Google (gTTS)", "espeak": "eSpeak NG (hy)", "mms": "Meta MMS-TTS (hye)"}.get(engine, "Microsoft " + a.voice)
    print(f"Готово. Голос: {label}. Ошибок: {len(failed)}. Осталось: {left}")
    if failed:
        print("Не получилось:", ", ".join(failed[:30]))
    if failed and len(failed) == min(len(items), a.limit):
        sys.exit(1)


if __name__ == "__main__":
    main()
