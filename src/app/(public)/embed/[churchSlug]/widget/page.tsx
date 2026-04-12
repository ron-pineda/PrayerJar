import { notFound } from 'next/navigation';
import { getChurchBySlug } from '@/services/church-platform.service';
import { EmbedForm } from './EmbedForm';

interface Props {
  params: Promise<{ churchSlug: string }>;
}

export default async function EmbedWidgetPage({ params }: Props) {
  const { churchSlug } = await params;
  const church = await getChurchBySlug(churchSlug);

  if (!church) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md rounded-lg bg-white shadow-sm border p-5">
        {/* Compact header */}
        <div className="flex items-center gap-2 mb-4">
          {church.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logoUrl}
              alt={`${church.name} logo`}
              style={{ maxHeight: '32px', width: 'auto' }}
              className="object-contain"
            />
          )}
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {church.name}{' '}
            <span className="font-normal text-gray-500">— Prayer Jar</span>
          </p>
        </div>

        {/* Prayer submission form */}
        <EmbedForm />
      </div>
    </div>
  );
}
