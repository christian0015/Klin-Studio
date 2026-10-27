// Analyseur audio partagé : AudioPlayer l'attache à son <audio>, la scène 3D lit les bandes de fréquence.
// Robustesse : tampon audio large (latencyHint "playback") pour éviter les saccades « CD rayé » quand le thread principal
// est occupé (retour d'onglet), session audio « playback » sur iOS, reprise automatique du contexte après interruption.
let ctx, an, data, bound;

export function attachAnalyser(el) {
  if (an || !el) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  try { ctx = new AC({ latencyHint: "playback" }); } catch { ctx = new AC(); }
  an = ctx.createAnalyser();
  an.fftSize = 256;
  an.smoothingTimeConstant = 0.88;
  ctx.createMediaElementSource(el).connect(an);
  an.connect(ctx.destination);
  data = new Uint8Array(an.frequencyBinCount);
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
  if (!bound) {
    bound = true;
    const wake = () => { if (ctx && ctx.state !== "running") ctx.resume().catch(() => {}); };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") wake(); });
    addEventListener("pageshow", wake); addEventListener("focus", wake); ctx.onstatechange = wake;
  }
}

export function resumeAudio() {
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
}

export function bands() {
  if (!an) return { bass: 0, mid: 0, live: false };
  an.getByteFrequencyData(data);
  const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += data[i]; return s / ((b - a) * 255); };
  return { bass: avg(1, 6), mid: avg(6, 40), live: true };
}
