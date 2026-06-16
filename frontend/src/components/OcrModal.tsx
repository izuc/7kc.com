import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { trackEvent } from '../lib/analytics';

const cameraSupported =
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function';

/**
 * OCR modal. Tesseract.js is dynamically imported so the 2MB WASM only loads
 * when the user actually opens this modal. Supports a file/photo upload or, where
 * available, a live rear-camera capture with a framing guide.
 */
export function OcrModal({
  onClose,
  onText,
}: {
  onClose: () => void;
  onText: (text: string) => void;
}) {
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

  return (
    <Modal onClose={onClose} eyebrow="Photo to list" title="Scan a handwritten list">
      <p className="muted small">
        Works best on a clean white background with dark ink. All processing happens in your browser —
        nothing is sent to our server.
      </p>
      {err && <div className="error">{err}</div>}
      {camErr && <div className="error">{camErr}</div>}

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
          <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <span className="mono small muted">{status} · {progress}%</span>
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
          <button className="btn btn-primary" onClick={run} disabled={!file || busy}>
            {busy ? 'Reading…' : 'Read text'}
          </button>
        </div>
      )}
    </Modal>
  );
}
