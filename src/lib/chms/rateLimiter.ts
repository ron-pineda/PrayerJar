/**
 * Token-bucket rate limiter (sliding window via timestamp tracking).
 *
 * Designed for per-org API rate limiting. Planning Center allows 100 requests
 * per minute per organization.
 *
 * Usage:
 *   const limiter = new RateLimiter(100, 60_000);
 *   await limiter.throttle(); // call before every API request
 */
export class RateLimiter {
  private timestamps: number[] = [];

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  async throttle(): Promise<void> {
    const now = Date.now();
    // Evict timestamps outside the current window
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length >= this.limit) {
      // Wait until the oldest token falls out of the window
      const oldest = this.timestamps[0];
      const wait = this.windowMs - (now - oldest) + 1;
      await new Promise<void>((res) => setTimeout(res, wait));
      return this.throttle(); // recurse to recheck
    }

    this.timestamps.push(now);
  }
}
