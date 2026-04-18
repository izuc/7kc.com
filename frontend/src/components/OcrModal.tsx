import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';

/**
 * OCR modal. Tesseract.js is dynamically imported so the 2MB WASM only loads
 * when the user actually opens this modal.
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
  const workerRef = useRef<any>(null);

  useEffect(() => () => {
    if (workerRef.current) {
      try { workerRef.current.terminate(); } catch {}
    }
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onPick = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (!f) { setFile(null); setPreview(null); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErr(null);
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

      {!preview ? (
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
      ) : (
        <div style={{ textAlign: 'center' }}>
          <img
            src={preview}
            alt="preview"
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
    </Modal>
  );
}
