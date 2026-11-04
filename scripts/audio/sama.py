"""Sama — the ambient bed behind the site, generated from source, not sampled.

    pip install numpy lameenc
    python3 scripts/audio/sama.py

Everything is synthesised here: a breathing D-minor drone, a reed-filtered
harmonic layer, a quiet upper pad, filtered air and sparse struck bells, all
sent through a synthetic hall. Nothing is licensed from anyone, so the file
carries no attribution requirement.

The loop is seamless by construction: every slow oscillator completes whole
cycles within the 180-second loop, and the last 15 seconds are cross-folded
into the head, so the reverb tail of the final bell is already playing when
the file restarts. Output: 44.1 kHz mono, 112 kbps, ~2.4 MB.

Changing LOOP, the DRONE table or the NOTES pool changes the piece; the
defaults are the shipped version. Keep the peak below -3 dBFS and the RMS
near -20 dBFS, or the soundtrack will sit too high under a reading voice.
"""
import os

import numpy as np
import lameenc

SR = 44100
LOOP = 180.0          # seconds that play on repeat
TAIL = 15.0           # seconds rendered past the end, folded into the head
N = int((LOOP + TAIL) * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)

def sine(freq, amp, phase=0.0):
    return amp * np.sin(2 * np.pi * freq * t + phase)

def slow(period, phase=0.0, lo=0.0, hi=1.0):
    return lo + (hi - lo) * (0.5 + 0.5 * np.sin(2 * np.pi * t / period + phase))

# ---------------------------------------------------------------- drone
# two detuned voices per pitch, each with its own swell period that divides
# the loop, so the chord never lands in the same place twice within a listen
DRONE = [
    (73.42, 0.080, 45.0, 0.0),    # D2
    (110.00, 0.070, 60.0, 1.7),   # A2
    (146.83, 0.115, 30.0, 0.4),   # D3
    (174.61, 0.070, 45.0, 2.9),   # F3
    (220.00, 0.055, 60.0, 4.1),   # A3
    (261.63, 0.030, 90.0, 5.2),   # C4
    (329.63, 0.020, 90.0, 0.9),   # E4
]
drone = np.zeros(N)
for freq, amp, period, phase in DRONE:
    swell = slow(period, phase, 0.62, 1.0)
    drone += amp * swell * (
        np.sin(2 * np.pi * freq * (1 + 0.00055) * t + phase)
        + 0.85 * np.sin(2 * np.pi * freq * (1 - 0.0007) * t + 1.1 + phase)
    )

# a very slow pitch drift, like a hand on a tuning peg
drift = 1 + 0.0004 * np.sin(2 * np.pi * t / 90.0)
drone *= drift

# ---------------------------------------------------------------- reed
# band-limited harmonic stack (tanpura-ish), low-passed by 1/n^1.7
reed = np.zeros(N)
for base, weight, period in [(146.83, 0.145, 30.0), (220.0, 0.070, 45.0)]:
    voice = np.zeros(N)
    for n in range(1, 11):
        if base * n > 4200:
            break
        voice += (1.0 / n ** 1.35) * np.sin(2 * np.pi * base * n * t + n * 0.7 + period)
    reed += weight * voice * slow(period, base, 0.55, 1.0)

# a quiet upper pad: the chord has to be present on a phone speaker, which
# rolls off everything below ~200 Hz
pad = np.zeros(N)
for freq, amp, period in [(293.66, 0.065, 45.0), (349.23, 0.055, 60.0),
                          (440.00, 0.045, 30.0), (587.33, 0.026, 90.0),
                          (698.46, 0.014, 45.0)]:
    pad += amp * slow(period, freq, 0.5, 1.0) * (
        np.sin(2 * np.pi * freq * (1 + 0.0008) * t)
        + 0.7 * np.sin(2 * np.pi * freq * (1 - 0.0009) * t + 2.1)
        + 0.22 * np.sin(2 * np.pi * freq * 2 * t + 0.6)
    )

# the colour moves: a B-flat enters for the middle third, then leaves, so the
# three minutes have a beginning, a middle and an end without a melody
bb = np.sin(2 * np.pi * 116.54 * t) + 0.6 * np.sin(2 * np.pi * 233.08 * t + 1.3)
bb += 0.4 * np.sin(2 * np.pi * 349.23 * t * 1.0006 + 0.2)
bb *= 0.055 * np.clip(np.sin(np.pi * np.clip((t - 40) / 100, 0, 1)), 0, 1) ** 1.3
pad += bb

# ---------------------------------------------------------------- air
noise = rng.standard_normal(N)
spec = np.fft.rfft(noise)
freqs = np.fft.rfftfreq(N, 1 / SR)
band = ((freqs > 700) & (freqs < 4000)).astype(float)
# soft shoulders so the noise does not sound filtered
band = np.where(freqs <= 700, np.exp(-((700 - freqs) / 300) ** 2), band)
band = np.where(freqs >= 4000, np.exp(-((freqs - 4000) / 2200) ** 2), band)
air = np.fft.irfft(spec * band, N)
air /= np.max(np.abs(air)) + 1e-9
air *= 0.050 * slow(60.0, 3.3, 0.25, 1.0)

# ---------------------------------------------------------------- bells
def bell(freq, seconds, amp):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    attack = 1 - np.exp(-tt / 0.006)
    decay = np.exp(-tt / (seconds / 4.2))
    body = (
        1.00 * np.sin(2 * np.pi * freq * tt)
        + 0.34 * np.sin(2 * np.pi * freq * 2.01 * tt + 0.4)
        + 0.16 * np.sin(2 * np.pi * freq * 2.98 * tt + 1.2)
        + 0.08 * np.sin(2 * np.pi * freq * 4.07 * tt + 2.0)
        + 0.04 * np.sin(2 * np.pi * freq * 5.43 * tt + 2.6)
    )
    return amp * attack * decay * body

# D minor pentatonic, mid register — a distant chime, never a melody
NOTES = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25]
strikes = []
pos = 6.0
step = 0
while pos < LOOP - 10:
    step += 1
    note = NOTES[(step * 3) % len(NOTES)] if step % 5 else NOTES[(step * 2) % len(NOTES)]
    strikes.append((pos, note, 0.175 if step % 4 else 0.120))
    if step % 6 == 0:                       # an occasional answered pair
        strikes.append((pos + 1.9, NOTES[(step * 5 + 2) % len(NOTES)], 0.095))
    pos += 9.5 + (step * 3.7) % 5.5

bells = np.zeros(N)
for start, freq, amp in strikes:
    i = int(start * SR)
    sig = bell(freq, 8.5, amp)
    end = min(N, i + len(sig))
    bells[i:end] += sig[: end - i]

dry = drone + reed + pad + air + bells

# ---------------------------------------------------------------- hall
ir_len = int(3.6 * SR)
itt = np.arange(ir_len) / SR
ir = rng.standard_normal(ir_len) * np.exp(-itt / 1.25)
# warm the tail: roll off everything above ~5 kHz
IRspec = np.fft.rfft(ir)
ifreq = np.fft.rfftfreq(ir_len, 1 / SR)
IRspec *= 1.0 / (1.0 + (ifreq / 4800.0) ** 2)
ir = np.fft.irfft(IRspec, ir_len)
ir *= np.exp(-itt / 1.05)
# a little pre-delay so the dry signal keeps its edge
predelay = int(0.022 * SR)
ir = np.concatenate([np.zeros(predelay), ir])
ir /= np.sqrt(np.sum(ir ** 2))

def convolve(x, h):
    n = len(x)
    out = np.zeros(n)
    block = 1 << 18
    H = np.fft.rfft(h, 2 * block)
    for start in range(0, n, block):
        seg = x[start:start + block]
        y = np.fft.irfft(np.fft.rfft(seg, 2 * block) * H, 2 * block)
        end = min(n, start + 2 * block)
        out[start:end] += y[: end - start]
    return out

wet = convolve(dry, ir)
mix = dry * 0.82 + wet * 0.34

# ---------------------------------------------------------------- master
def fft_filter(x, gain_fn):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * gain_fn(f), len(x))

mix = fft_filter(mix, lambda f: 1.0 / np.sqrt(1.0 + (38.0 / np.maximum(f, 1.0)) ** 4))
# a real high-pass: laptop and phone speakers cannot reproduce the first
# octave, so leaving energy there only wastes headroom
mix = fft_filter(mix, lambda f: (f / 92.0) ** 2 / np.sqrt(1.0 + (f / 92.0) ** 4))
# presence lift for the pad and bells
mix = fft_filter(mix, lambda f: 1.0 + 0.95 * np.exp(-((f - 1200.0) / 1600.0) ** 2))
mix = fft_filter(mix, lambda f: 1.0 / np.sqrt(1.0 + (f / 9500.0) ** 4))

# loop fold: the tail plays over the head, so the seam is inaudible
L = int(LOOP * SR)
T = int(TAIL * SR)
head = mix[:T]
tail = mix[L:L + T]
theta = np.linspace(0, np.pi / 2, T)
out = mix[:L].copy()
out[:T] = head * np.sin(theta) + tail * np.cos(theta)

# level: aim for roughly -20 dBFS RMS with the peaks kept below -3 dBFS
out -= np.mean(out)
rms = np.sqrt(np.mean(out ** 2))
out *= (10 ** (-20 / 20)) / max(rms, 1e-9)
peak = np.max(np.abs(out))
if peak > 10 ** (-3 / 20):
    out *= (10 ** (-3 / 20)) / peak
# soft-knee limiter for the few bell transients
over = np.abs(out) > 0.62
out[over] = np.sign(out[over]) * (0.62 + 0.08 * np.tanh((np.abs(out[over]) - 0.62) / 0.08))

pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)

enc = lameenc.Encoder()
enc.set_bit_rate(112)
enc.set_in_sample_rate(SR)
enc.set_channels(1)
enc.set_quality(2)
data = enc.encode(pcm.tobytes())
data += enc.flush()
target = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))), 'public', 'sama.mp3')
with open(target, 'wb') as fh:
    fh.write(bytes(data))

# ---------------------------------------------------------------- report
def db(x):
    return 20 * np.log10(max(x, 1e-12))

block = SR * 10
rms_blocks = [db(np.sqrt(np.mean(out[i:i + block] ** 2))) for i in range(0, len(out), block)]
centroid = np.sum(freqs := np.fft.rfftfreq(len(out), 1 / SR) * np.abs(np.fft.rfft(out))) / np.sum(np.abs(np.fft.rfft(out)))
seam = abs(out[-1] - out[0])
print(f'duration      {len(out)/SR:.1f} s')
print(f'peak          {db(np.max(np.abs(out))):.1f} dBFS')
print(f'rms           {db(np.sqrt(np.mean(out**2))):.1f} dBFS')
print(f'block rms     min {min(rms_blocks):.1f} / max {max(rms_blocks):.1f} dBFS')
print(f'centroid      {centroid:.0f} Hz')
print(f'seam jump     {seam:.5f} (neighbour step {abs(out[1]-out[0]):.5f})')
print(f'dc            {np.mean(out):+.6f}')
print(f'bytes         {len(data)/1024:.0f} kB')
print(f'written       {target}')

X = np.abs(np.fft.rfft(out)) ** 2
F = np.fft.rfftfreq(len(out), 1 / SR)
total = X.sum()
for lo, hi in [(20, 120), (120, 500), (500, 2000), (2000, 6000), (6000, 20000)]:
    m = (F >= lo) & (F < hi)
    print(f'energy {lo:>5}-{hi:<5} {100*X[m].sum()/total:5.1f} %')

def win_rms(sec):
    i = int(sec * SR)
    seg = out[i:i + SR]
    return db(np.sqrt(np.mean(seg ** 2)))
base = [win_rms(s) for s in range(2, 180, 17)]
after = [win_rms(st + 0.35) for st, _, _ in strikes]
print(f'strike windows  {min(after):.1f}..{max(after):.1f} dBFS')
print(f'baseline        {min(base):.1f}..{max(base):.1f} dBFS')
print(f'strike lift     {np.mean(after) - np.mean(base):+.1f} dB')
