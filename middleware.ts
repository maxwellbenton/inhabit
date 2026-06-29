import { withAuth } from 'next-auth/middleware';

// Protects every page route with a Google-authenticated, single-account gate.
// API routes are excluded here and instead check the session themselves
// (so a fetch() from the page gets a clean 401 JSON response, not a redirect).
export default withAuth({
  pages: {
    signIn: '/signin',
  },
});

export const config = {
  matcher: ['/((?!api|signin|_next/static|_next/image|favicon.ico).*)'],
};
