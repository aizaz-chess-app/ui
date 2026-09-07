const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export function getApiBaseUrl(): string {
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local.');
  }

  return baseUrl.replace(/\/$/, '');
}
