import { describe, it, expect } from 'vitest';
import { render } from '@react-email/components';
import ChurchWelcome2Email from './church-welcome-2';

describe('ChurchWelcome2Email', () => {
  it('renders without error', async () => {
    const html = await render(ChurchWelcome2Email({ churchSlug: 'grace-church' }));
    expect(html).toBeTruthy();
  });

  it('contains the team CTA', async () => {
    const html = await render(ChurchWelcome2Email({ churchSlug: 'grace-church' }));
    expect(html).toContain('/church/grace-church/dashboard/team');
  });
});
