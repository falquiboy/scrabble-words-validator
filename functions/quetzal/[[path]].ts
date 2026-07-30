interface PagesContext {
  request: Request;
  params: { path?: string | string[] };
}

const QUETZAL_ORIGIN = 'https://quetzal-app.pages.dev';

export const onRequest = async ({ request, params }: PagesContext): Promise<Response> => {
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`/quetzal/${path}`, QUETZAL_ORIGIN);
  upstreamUrl.search = incomingUrl.search;

  const upstreamRequest = new Request(upstreamUrl, request);
  const upstreamResponse = await fetch(upstreamRequest);
  const headers = new Headers(upstreamResponse.headers);

  // Quetzal's MAGPIE engine needs cross-origin isolation for SharedArrayBuffer.
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.delete('Content-Length');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
};
