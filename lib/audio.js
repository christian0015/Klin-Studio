// Analyseur audio partagé : AudioPlayer l'attache à son <audio>, la scène 3D lit les bandes de fréquence.
let ctx, an, data;

export function attachAnalyser(el) {
  if (an || !el) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  an = ctx.createAnalyser();
  an.fftSize = 256;
  an.smoothingTimeConstant = 0.88;
  ctx.createMediaElementSource(el).connect(an);
  an.connect(ctx.destination);
  data = new Uint8Array(an.frequencyBinCount);
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume();
}

export function bands() {
  if (!an) return { bass: 0, mid: 0, live: false };
  an.getByteFrequencyData(data);
  const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += data[i]; return s / ((b - a) * 255); };
  return { bass: avg(1, 6), mid: avg(6, 40), live: true };
}
