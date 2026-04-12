import { validateApiKey } from '@/services/api-key.service';
import { NextRequest } from 'next/server';

export async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const raw = authHeader.slice(7);
  return validateApiKey(raw);
}
