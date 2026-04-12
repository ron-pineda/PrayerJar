'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, Square, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type VideoRecorderProps = {
  onUpload: (url: string, durationSeconds: number) => void;
  onRemove: () => void;
  url: string | null;
};

const MAX_SECONDS = 120;

export function VideoRecorder({ onUpload, onRemove, url }: VideoRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

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
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      setError('Camera/microphone access denied. Please allow access and try again.');
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    if (previewRef.current) {
      previewRef.current.srcObject = stream;
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;
    startTimeRef.current = Date.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stopTimers();
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (previewRef.current) {
        previewRef.current.srcObject = null;
      }
      setRecording(false);
      setSecondsLeft(MAX_SECONDS);

      const mimeUsed = recorder.mimeType || 'video/webm';
      const videoBlob = new Blob(chunksRef.current, { type: mimeUsed });
      await uploadVideo(videoBlob, mimeUsed, elapsedSeconds);
    };

    recorder.start();
    setRecording(true);
    setSecondsLeft(MAX_SECONDS);

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);

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

  async function uploadVideo(videoBlob: Blob, mimeType: string, durationSeconds: number) {
    setUploading(true);
    setError('');

    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogv' : 'webm';
      const formData = new FormData();
      formData.set('file', videoBlob, `recording.${ext}`);
      formData.set('duration', String(durationSeconds));

      const res = await fetch('/api/upload/video', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Upload failed');
      }

      const { url: blobUrl, durationSeconds: savedDuration } = await res.json();
      onUpload(blobUrl, savedDuration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Playback state
  if (url) {
    return (
      <div className="space-y-1">
        <video controls src={url} className="w-full rounded-md mt-2" />
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-7 px-2 text-xs"
          onClick={onRemove}
          aria-label="Remove video"
        >
          <X className="h-3 w-3 mr-1" />
          Remove video
        </Button>
      </div>
    );
  }

  // Upload spinner
  if (uploading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Uploading video...</span>
      </div>
    );
  }

  // Recording state — show live preview
  if (recording) {
    return (
      <div className="space-y-2">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-md bg-black"
        />
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
        <Video className="h-4 w-4" />
        Record Video
      </Button>
      <p className="text-xs text-muted-foreground mt-1">Optional · up to 2 minutes</p>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
