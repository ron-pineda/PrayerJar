'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AudioRecorderProps = {
  onUpload: (url: string) => void;
  onRemove: () => void;
  url: string | null;
};

const MAX_SECONDS = 60;

export function AudioRecorder({ onUpload, onRemove, url }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimers();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function stopTimers() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    timerRef.current = null;
    autoStopRef.current = null;
  }

  async function handleRecord() {
    setError('');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.');
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    // Prefer webm, fall back to whatever the browser supports
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/ogg')
      ? 'audio/ogg'
      : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stopTimers();
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setRecording(false);
      setSecondsLeft(MAX_SECONDS);

      const mimeUsed = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(chunksRef.current, { type: mimeUsed });
      await uploadAudio(audioBlob, mimeUsed);
    };

    recorder.start();
    setRecording(true);
    setSecondsLeft(MAX_SECONDS);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // Auto-stop at 60s
    autoStopRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, MAX_SECONDS * 1000);
  }

  function handleStop() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }

  async function uploadAudio(audioBlob: Blob, mimeType: string) {
    setUploading(true);
    setError('');

    try {
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm';
      const formData = new FormData();
      formData.set('file', audioBlob, `recording.${ext}`);

      const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Upload failed');
      }

      const { url: blobUrl } = await res.json();
      onUpload(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Playback state
  if (url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-3">
        <audio controls src={url} className="flex-1 h-10" />
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-7 w-7 p-0 shrink-0"
          onClick={onRemove}
          aria-label="Remove audio"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Upload spinner
  if (uploading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Uploading audio...</span>
      </div>
    );
  }

  // Recording state
  if (recording) {
    return (
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={handleStop}
          className="flex items-center gap-2"
        >
          <Square className="h-4 w-4" />
          Stop
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          Recording... {secondsLeft}s
        </span>
      </div>
    );
  }

  // Idle state
  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleRecord}
        className="flex items-center gap-2"
      >
        <Mic className="h-4 w-4" />
        Record Audio
      </Button>
      <p className="text-xs text-muted-foreground mt-1">Optional · up to 60 seconds</p>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
