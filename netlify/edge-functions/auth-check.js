export default async (request, context) => {
  const url = new URL(request.url);

  // Get authentication cookie
  const cookies = request.headers.get('cookie') || '';
  const isAuthenticated = cookies.includes('authenticated=true');

  // Check if this is a private album page
  // Private albums will have their data available in context
  const response = await context.next();

  // For HTML pages, check if they require authentication
  if (url.pathname.includes('/albums/') &&
      response.headers.get('content-type')?.includes('text/html')) {

    // Parse the response to check if it's a private album
    const text = await response.text();

    // Check if the page is marked as private
    if (text.includes('class="badge private"') && !isAuthenticated) {
      // Redirect to login page
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/login',
        },
      });
    }

    // Return the original response
    return new Response(text, {
      headers: response.headers,
    });
  }

  return response;
};

export const config = {
  path: "/albums/*",
};
