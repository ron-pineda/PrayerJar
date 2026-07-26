import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChurchBySlug } from '@/services/church-platform.service';
import { ChurchSidebar } from './ChurchSidebar';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { slug } = await params;

  // auth() is request-scoped cached by NextAuth v5.
  // getChurchBySlug is wrapped in React.cache — it deduplicates with calls made
  // by individual pages in the same render.
  const [session, church] = await Promise.all([
    auth(),
    getChurchBySlug(slug),
  ]);

  if (!church) notFound();

  // Sprint 27 (pj-s27-02): the sidebar no longer needs a tier — nothing in the
  // church admin nav is tier-locked, so this layout stopped resolving one.
  const userName = session?.user?.name ?? session?.user?.email ?? null;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
      <ChurchSidebar
        slug={slug}
        churchName={church.name}
        userName={userName}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
