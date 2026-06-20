// Synthesizing high-quality, completely offline retro gaming sound effects 
// using the standard Web Audio API to guarantee 100% reliability.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn("Web Audio API is not supported or accessible", e);
    return null;
  }
}

/**
 * 1. Tiger Roar (Sher dahad)
 * A synthesized growling roar combining low-frequency sawtooth vibrato with a high-resonance bandpass swept noise.
 */
export function playTigerRoar(isMuted: boolean): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Master Volume Envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    // Deep frequency growl oscillator
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.45);

    // Rapid growl modulator (tremulous tone LFO)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(15, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(14, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Noise generation for deep rasp
    const bufferSize = ctx.sampleRate * 0.7;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Shaping the roaring roar filter
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(280, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(85, now + 0.5);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    // Hookups
    osc.connect(masterGain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    masterGain.connect(ctx.destination);

    // Fire!
    osc.start(now);
    lfo.start(now);
    noise.start(now);

    osc.stop(now + 0.75);
    lfo.stop(now + 0.75);
    noise.stop(now + 0.75);
  } catch (e) {
    console.error("Failed to play tiger roar sound", e);
  }
}

/**
 * 2. Goat Bleat (Bakari ki awaz)
 * Synthesizes a rapid tremolo nasal "baaah" using dual triangles and precise formant resonant filters.
 */
export function playGoatBleat(isMuted: boolean): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Volume Envelope for the "Määäh" utterance
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    masterGain.gain.setValueAtTime(0.12, now + 0.25);
    masterGain.gain.exponentialRampToValueAtTime(0.002, now + 0.65);

    // 14 Hz throat vibrato LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(13.5, now);

    const pitchMod = ctx.createGain();
    pitchMod.gain.setValueAtTime(16, now);
    lfo.connect(pitchMod);

    const amplitudeMod = ctx.createGain();
    amplitudeMod.gain.setValueAtTime(0.035, now);
    lfo.connect(amplitudeMod);
    amplitudeMod.connect(masterGain.gain);

    // Basic tri formant oscillators (nasal pitch profile)
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(270, now);
    osc1.frequency.linearRampToValueAtTime(300, now + 0.4);
    pitchMod.connect(osc1.frequency);

    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(280, now);
    osc2.frequency.linearRampToValueAtTime(295, now + 0.4);
    pitchMod.connect(osc2.frequency);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.035, now);
    osc2.connect(osc2Gain);

    // Resonant bandpass mouth filters
    const filter1 = ctx.createBiquadFilter();
    filter1.type = "bandpass";
    filter1.frequency.setValueAtTime(900, now);
    filter1.Q.setValueAtTime(4.5, now);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.setValueAtTime(1400, now);
    filter2.Q.setValueAtTime(3.5, now);

    // Routing
    osc1.connect(filter1);
    osc2Gain.connect(filter1);

    osc1.connect(filter2);
    osc2Gain.connect(filter2);

    filter1.connect(masterGain);
    filter2.connect(masterGain);

    masterGain.connect(ctx.destination);

    // Fire!
    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
    lfo.stop(now + 0.7);
  } catch (e) {
    console.error("Failed to play goat bleat sound", e);
  }
}

/**
 * 3. Tiger Kill (Capture)
 * Dramatic swipe-slash + crunch impact representing when the tiger eats a goat.
 */
export function playKillSound(isMuted: boolean): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    // Bass impact thump
    const heavyKick = ctx.createOscillator();
    heavyKick.type = "triangle";
    heavyKick.frequency.setValueAtTime(170, now);
    heavyKick.frequency.exponentialRampToValueAtTime(30, now + 0.22);

    // Audio Buffer for the sharp noise slice (claw swipe)
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const swoopNoise = ctx.createBufferSource();
    swoopNoise.buffer = buffer;

    const sweepFilter = ctx.createBiquadFilter();
    sweepFilter.type = "bandpass";
    sweepFilter.frequency.setValueAtTime(1300, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(120, now + 0.28);
    sweepFilter.Q.setValueAtTime(2.0, now);

    // Crunch slash oscillator
    const biteOsc = ctx.createOscillator();
    biteOsc.type = "sawtooth";
    biteOsc.frequency.setValueAtTime(400, now);
    biteOsc.frequency.linearRampToValueAtTime(90, now + 0.12);

    const biteGain = ctx.createGain();
    biteGain.gain.setValueAtTime(0.14, now);
    biteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    // Connect everything
    heavyKick.connect(masterGain);

    swoopNoise.connect(sweepFilter);
    sweepFilter.connect(masterGain);

    biteOsc.connect(biteGain);
    biteGain.connect(masterGain);

    masterGain.connect(ctx.destination);

    // Fire!
    heavyKick.start(now);
    swoopNoise.start(now);
    biteOsc.start(now);

    heavyKick.stop(now + 0.5);
    swoopNoise.stop(now + 0.5);
    biteOsc.stop(now + 0.5);
  } catch (e) {
    console.error("Failed to play capture kill sound", e);
  }
}

/**
 * 4. Lock Sound
 * Metallic click-on-metal tumbler shut sound, signifying that the tiger is locked / trapped.
 */
export function playLockSound(isMuted: boolean): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.28, now + 0.01);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    // Latch click 1 (high frequency impact)
    const latch1 = ctx.createOscillator();
    latch1.type = "sine";
    latch1.frequency.setValueAtTime(1900, now);
    const latch1Gain = ctx.createGain();
    latch1Gain.gain.setValueAtTime(0.15, now);
    latch1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    latch1.connect(latch1Gain).connect(masterGain);

    // Latch lock 2 (deeper secondary clamp sound at t=0.08)
    const latch2 = ctx.createOscillator();
    latch2.type = "triangle";
    latch2.frequency.setValueAtTime(650, now + 0.08);
    latch2.frequency.linearRampToValueAtTime(320, now + 0.2);
    const latch2Gain = ctx.createGain();
    latch2Gain.gain.setValueAtTime(0, now);
    latch2Gain.gain.setValueAtTime(0.2, now + 0.08);
    latch2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    latch2.connect(latch2Gain).connect(masterGain);

    // Deep iron bar resonance
    const clank = ctx.createOscillator();
    clank.type = "sine";
    clank.frequency.setValueAtTime(115, now + 0.08);
    const clankGain = ctx.createGain();
    clankGain.gain.setValueAtTime(0, now);
    clankGain.gain.setValueAtTime(0.35, now + 0.08);
    clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    clank.connect(clankGain).connect(masterGain);

    // Ring feedback
    const bellRing = ctx.createOscillator();
    bellRing.type = "triangle";
    bellRing.frequency.setValueAtTime(800, now + 0.08);
    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.setValueAtTime(0.08, now + 0.08);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    bellRing.connect(bellGain).connect(masterGain);

    masterGain.connect(ctx.destination);

    // Fire!
    latch1.start(now);
    latch2.start(now + 0.08);
    clank.start(now + 0.08);
    bellRing.start(now + 0.08);

    latch1.stop(now + 0.2);
    latch2.stop(now + 0.4);
    clank.stop(now + 1.0);
    bellRing.stop(now + 1.0);
  } catch (e) {
    console.error("Failed to play lock sound", e);
  }
}
