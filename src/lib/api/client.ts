import { getApiBaseUrl } from '@/lib/api/config';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(readErrorMessage(body) ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function readErrorMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return null;
  }

  const { message } = body as { message: unknown };

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && message.every(entry => typeof entry === 'string')) {
    return message.join(', ');
  }

  return null;
}

export async function apiRequest<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json().catch(() => null));
  }

  return (await response.json()) as TResponse;
}
