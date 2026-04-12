import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoRecorder } from './video-recorder';

// ---------------------------------------------------------------------------
// MediaRecorder mock
// ---------------------------------------------------------------------------
class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType = 'video/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  start = vi.fn(() => {
    this.state = 'recording';
  });

  stop = vi.fn(() => {
    this.state = 'inactive';
    this.onstop?.();
  });
}

// ---------------------------------------------------------------------------
// getUserMedia mock
// ---------------------------------------------------------------------------
const mockGetUserMedia = vi.fn();

beforeEach(() => {
  // @ts-expect-error — mocking browser API
  global.MediaRecorder = MockMediaRecorder;

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });

  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('VideoRecorder', () => {
  it('renders record button when url is null', () => {
    render(
      <VideoRecorder
        url={null}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /record video/i })).toBeTruthy();
  });

  it('renders video player when url is provided', () => {
    render(
      <VideoRecorder
        url="https://example.com/video.webm"
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.src).toContain('video.webm');
  });

  it('remove button triggers onRemove', () => {
    const onRemove = vi.fn();
    render(
      <VideoRecorder
        url="https://example.com/video.webm"
        onUpload={vi.fn()}
        onRemove={onRemove}
      />
    );
    const removeBtn = screen.getByRole('button', { name: /remove video/i });
    removeBtn.click();
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
