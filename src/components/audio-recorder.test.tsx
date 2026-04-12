import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioRecorder } from './audio-recorder';

// ---------------------------------------------------------------------------
// MediaRecorder mock
// ---------------------------------------------------------------------------
class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType = 'audio/webm';
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
describe('AudioRecorder', () => {
  it('renders record button when url is null', () => {
    render(
      <AudioRecorder
        url={null}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /record audio/i })).toBeTruthy();
  });

  it('renders audio player when url is provided', () => {
    render(
      <AudioRecorder
        url="https://example.com/audio.webm"
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    const audio = document.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.src).toContain('audio.webm');
  });

  it('shows remove button when url is provided', () => {
    render(
      <AudioRecorder
        url="https://example.com/audio.webm"
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /remove audio/i })).toBeTruthy();
  });

  it('shows microphone denied error message when permission is rejected', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

    render(
      <AudioRecorder
        url={null}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const recordBtn = screen.getByRole('button', { name: /record audio/i });
    recordBtn.click();

    // Wait for async rejection to settle
    await vi.waitFor(() => {
      expect(screen.getByText(/microphone access denied/i)).toBeTruthy();
    });
  });
});
