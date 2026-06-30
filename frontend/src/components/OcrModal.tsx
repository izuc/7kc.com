import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { trackEvent } from '../lib/analytics';
import { api } from '../lib/api';
import { tileImage } from '../lib/imageTiles';

/** Read a File as a base64 data URL to POST to the server's scan endpoint. */
function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('Could not read the image file.'));
    fr.readAsDataURL(file);
  });
}

const cameraSupported =
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function';

/**
 * Photo scan modal. Two modes:
 *  - 'list' (default): transcribe a shopping list. Uses the server vision LLM when
 *    configured (AI), otherwise on-device Tesseract.js (dynamically imported).
 *  - 'pantry': detect groceries in a fridge/pantry photo. Tiles the image client-side
 *    (per `tiles`) and sends the tiles to the server scan — AI only.
 * Supports file/photo upload or a live rear-camera capture with a framing guide.
 */
export function OcrModal({
  onClose,
  onText,
  scanMode = 'list',
  tiles = 1,
}: {
  onClose: () => void;
  onText: (text: string) => void;
  scanMode?: 'list' | 'pantry';
  tiles?: number;
}) {
  const isPantry = scanMode === 'pantry';
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<'choose' | 'camera'>('choose');
  const [camErr, setCamErr] = useState<string | null>(null);
  const workerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aliveRef = useRef(true);
  const acquiringRef = useRef(false);

  // Whether the SERVER has AI photo scanning configured (.env). Cached.
  const { data: cfg } = useQuery({ queryKey: ['config'], queryFn: () => api.config(), staleTime: 5 * 60 * 1000 });
  const aiReady = cfg?.features?.ai_scan ?? false;
  const [useAi, setUseAi] = useState(true); // prefer AI when the server offers it
  // Pantry mode is AI-only (no on-device fallback for object detection).
  const aiMode = isPantry ? aiReady : aiReady && useAi;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // Terminate the OCR worker + revoke the preview URL when the preview changes / on unmount.
  useEffect(() => () => {
    if (workerRef.current) {
      try { workerRef.current.terminate(); } catch {}
    }
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  // Camera teardown strictly on unmount (and StrictMode-safe re-init on mount).
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopCamera();
    };
  }, []);

  // Attach the live stream once the <video> is actually committed to the DOM
  // (more reliable than a single rAF tick after setMode).
  useEffect(() => {
    if (mode === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [mode]);

  const onPick = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (!f) { setFile(null); setPreview(null); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErr(null);
  };

  const startCamera = async () => {
    // Guard re-entrancy: a stream already held or a request in flight (double-tap).
    if (!cameraSupported || streamRef.current || acquiringRef.current) return;
    setCamErr(null);
    acquiringRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      // The modal may have closed while the permission prompt was up — don't leak it.
      if (!aliveRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setMode('camera'); // the [mode] effect attaches the stream after commit
      trackEvent('ocr_camera_open');
    } catch {
      setCamErr('Could not open the camera — you can still choose a photo.');
    } finally {
      acquiringRef.current = false;
    }
  };

  const closeCamera = () => {
    stopCamera();
    setMode('choose');
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        setMode('choose');
        onPick(new File([blob], 'camera.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    setProgress(0);
    setStatus('loading recogniser…');
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status) setStatus(m.status);
          if (typeof m.progress === 'number') setProgress(Math.round(m.progress * 100));
        },
      });
      workerRef.current = worker;
      const { data } = await worker.recognize(file);
      await worker.terminate();
      workerRef.current = null;
      const cleaned = (data.text || '').trim();
      if (!cleaned) {
        setErr('Nothing readable in that image.');
        setBusy(false);
        return;
      }
      onText(cleaned);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not read that image.');
    } finally {
      setBusy(false);
    }
  };

  // Send the image to the server, which forwards it to the operator-configured vision LLM
  // (LM Studio / Ollama / OpenAI). List mode → one transcription; pantry mode → tile the
  // photo client-side and let the server detect + merge items. Result feeds the parse flow.
  const runAi = async () => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    setProgress(0);
    setStatus(isPantry && tiles > 1 ? `reading ${tiles * tiles} sections with AI…` : 'reading with AI…');
    try {
      let text: string;
      if (isPantry) {
        const imgs = await tileImage(file, tiles);
        text = (await api.scanPantry(imgs)).text;
      } else {
        text = (await api.scanImage(await fileToDataUrl(file))).text;
      }
      if (!text.trim()) {
        setErr(isPantry ? 'The AI didn’t spot any items in that photo.' : 'The AI didn’t find any list items in that image.');
        setBusy(false);
        return;
      }
      trackEvent(isPantry ? 'pantry_ai_scan' : 'ocr_ai_scan');
      onText(text.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'AI scan failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      eyebrow={isPantry ? 'Photo to pantry' : 'Photo to list'}
      title={isPantry ? 'Scan your fridge or pantry' : 'Scan a handwritten list'}
    >
      <p className="muted small">
        {isPantry ? (
          <>
            Snap a clear photo of your shelves or fridge and the AI will list what it sees — you confirm
            before anything’s added.{tiles > 1 ? ` Read in ${tiles}×${tiles} sections for better detail.` : ''}
          </>
        ) : (
          <>
            Works best on a clean background with clear writing.{' '}
            {aiMode
              ? 'This sends the photo to the app to read your list with AI.'
              : 'Reading happens on-device — nothing leaves your browser.'}
          </>
        )}
      </p>
      {aiReady && !isPantry && (
        <div className="segmented" role="group" aria-label="Scan method" style={{ marginBottom: 4 }}>
          <button className={useAi ? 'active' : ''} aria-pressed={useAi} disabled={busy} onClick={() => setUseAi(true)}>
            <Icon name="sparkle" size={13} /> AI
          </button>
          <button className={!useAi ? 'active' : ''} aria-pressed={!useAi} disabled={busy} onClick={() => setUseAi(false)}>
            On-device
          </button>
        </div>
      )}
      {err && <div className="error" role="alert">{err}</div>}
      {camErr && <div className="error" role="alert">{camErr}</div>}

      {!preview && mode === 'camera' ? (
        <div className="ocr-camera">
          <div className="ocr-camera-view">
            <video ref={videoRef} playsInline muted autoPlay />
            <div className="ocr-frame-guide" aria-hidden="true" />
          </div>
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button className="btn btn-ghost" onClick={closeCamera}>
              Back
            </button>
            <button className="btn btn-primary" onClick={capture}>
              <Icon name="camera" size={14} /> Capture
            </button>
          </div>
        </div>
      ) : !preview ? (
        <>
          <label className="paste" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
              <Icon name="plus" size={24} />
              <div style={{ marginTop: 8 }}>Tap to take a photo, or choose an image</div>
            </div>
          </label>
          {cameraSupported && (
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={startCamera}>
              <Icon name="camera" size={14} /> Use camera
            </button>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <img
            src={preview}
            alt="Selected photo to scan for text"
            style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 'var(--radius-sm)' }}
          />
          <div className="mono small muted" style={{ marginTop: 6 }}>
            {file?.name} — {Math.round((file?.size ?? 0) / 1024)} KB
          </div>
        </div>
      )}

      {busy && (
        <div className="progress-row" style={{ marginTop: 12 }}>
          {aiMode ? (
            <span className="mono small muted">{status}</span>
          ) : (
            <>
              <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              <span className="mono small muted">{status} · {progress}%</span>
            </>
          )}
        </div>
      )}

      {mode !== 'camera' && (
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {preview && (
            <button className="btn btn-ghost" onClick={() => onPick(null)} disabled={busy}>
              Choose another
            </button>
          )}
          <button className="btn btn-primary" onClick={aiMode ? runAi : run} disabled={!file || busy}>
            {busy ? 'Reading…' : aiMode ? (<><Icon name="sparkle" size={14} /> {isPantry ? 'Scan items' : 'Read with AI'}</>) : 'Read text'}
          </button>
        </div>
      )}
    </Modal>
  );
}
