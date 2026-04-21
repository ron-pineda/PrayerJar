import { render } from '@react-email/components';
import ChurchWelcome1Email from './church-welcome-1';

describe('ChurchWelcome1Email', () => {
  it('renders without error', async () => {
    const html = await render(
      ChurchWelcome1Email({ churchSlug: 'grace-church', adminName: 'Pastor Sarah' })
    );
    expect(html).toBeTruthy();
  });

  it('contains the join link CTA', async () => {
    const html = await render(
      ChurchWelcome1Email({ churchSlug: 'grace-church', adminName: 'Pastor Sarah' })
    );
    expect(html).toContain('/church/grace-church/dashboard/team');
  });

  it('contains the setup CTA', async () => {
    const html = await render(
      ChurchWelcome1Email({ churchSlug: 'grace-church', adminName: 'Pastor Sarah' })
    );
    expect(html).toContain('/church/grace-church/setup');
  });
});
