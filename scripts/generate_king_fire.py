"""Generate original soft fire-spread cues using only Python's standard library."""

import math
from pathlib import Path
import random
import struct
import wave


def generate(filename, duration, seed, warning=False):
    rate = 22050
    rng = random.Random(seed)
    low = warm = hiss = 0.0
    crackle = 0.0
    samples = []
    # A mid/high-frequency flame bed: no bass impact, explosive transient, or samples.
    alpha_low = 1 - math.exp(-2 * math.pi * 350 / rate)
    alpha_warm = 1 - math.exp(-2 * math.pi * 2400 / rate)
    alpha_hiss = 1 - math.exp(-2 * math.pi * 6000 / rate)
    for i in range(round(rate * duration)):
        t = i / rate
        noise = rng.uniform(-1, 1)
        low += alpha_low * (noise - low)
        warm += alpha_warm * (noise - warm)
        hiss += alpha_hiss * (noise - hiss)
        flutter = 0.72 + 0.12 * math.sin(t * 23) + 0.08 * math.sin(t * 51 + 0.8)
        if rng.random() < 12 / rate:
            crackle = rng.uniform(0.05, 0.12)
        crackle *= 0.985
        flame = ((warm - low) * 0.8 + (hiss - warm) * 0.25) * flutter
        flame += (hiss - warm) * crackle
        attack = min(1.0, t / (0.28 if warning else 0.35))
        attack = attack * attack * (3 - 2 * attack)
        fade = min(1.0, (duration - t) / (0.35 if warning else 1.05))
        fade = fade * fade * (3 - 2 * fade)
        flame *= attack * fade
        # A gentle stereo sweep makes the fire feel as though it is spreading.
        pan = -0.55 + 1.1 * t / duration
        angle = (pan + 1) * math.pi / 4
        samples.append((flame * math.cos(angle), flame * math.sin(angle)))
    peak = max(abs(value) for frame in samples for value in frame)
    scale = 0.8 * 32767 / peak
    frames = b"".join(struct.pack("<hh", round(left * scale), round(right * scale)) for left, right in samples)
    with wave.open(str(filename), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(frames)


if __name__ == "__main__":
    sounds = Path(__file__).resolve().parents[1] / "public" / "sounds"
    generate(sounds / "kingFireWarning.wav", 0.85, 2501, warning=True)
    generate(sounds / "kingFireSpread.wav", 1.8, 2502)
