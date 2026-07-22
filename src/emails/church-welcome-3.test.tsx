import { describe, it, expect } from 'vitest';
import { render } from '@react-email/components';
import ChurchWelcome3Email from './church-welcome-3';

describe('ChurchWelcome3Email', () => {
  it('renders without error', async () => {
    const html = await render(ChurchWelcome3Email({ churchSlug: 'grace-church' }));
    expect(html).toBeTruthy();
  });

  it('contains the setup CTA', async () => {
    const html = await render(ChurchWelcome3Email({ churchSlug: 'grace-church' }));
    expect(html).toContain('/church/grace-church/setup');
  });
});
