import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { haptic } from '../lib/haptics';

/**
 * Per-step countdown for Cook Mode. Anchored to a wall-clock end time (not
 * tick counting) so it stays honest when the phone throttles background
 * intervals. Finishing buzzes (haptic) and chimes (WebAudio — created on the
 * Start tap so autoplay policy allows it; failure is silent).
 */

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function StepTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);
  const audio = useRef<AudioContext | null>(null);

  // A new step (new duration) resets the clock.
  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        haptic();
        chime(audio.current);
      }
    };
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => () => { audio.current?.close().catch(() => {}); }, []);

  const start = () => {
    if (remaining <= 0) return;
    try {
      audio.current ??= new AudioContext();
      if (audio.current.state === 'suspended') audio.current.resume().catch(() => {});
    } catch { /* no audio — haptic still fires */ }
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
  };

  const done = remaining <= 0;

  return (
    <div className={`step-timer ${running ? 'running' : ''} ${done ? 'done' : ''}`}>
      <Icon name="clock" size={15} />
      <span className="step-timer-clock mono" role="timer" aria-live={done ? 'assertive' : 'off'}>
        {done ? "Time's up" : fmt(remaining)}
      </span>
      {!done && !running && (
        <button className="chip" onClick={start} type="button">
          {remaining === seconds ? `Start ${fmt(seconds)} timer` : 'Resume'}
        </button>
      )}
      {running && (
        <button className="chip" onClick={() => setRunning(false)} type="button">
          Pause
        </button>
      )}
      {remaining !== seconds && (
        <button className="chip" onClick={() => { setRunning(false); setRemaining(seconds); }} type="button">
          Reset
        </button>
      )}
    </div>
  );
}

/** Two soft sine notes — enough to be heard over a rangehood, no asset needed. */
function chime(ctx: AudioContext | null) {
  try {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
      osc.start(t0);
      osc.stop(t0 + 0.65);
    });
  } catch { /* silent */ }
}
