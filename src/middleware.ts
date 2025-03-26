import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { checkIsPrivateRoute } from '@/utils/router/app-routes';

type MiddlewareResponse = NextResponse;

export async function middleware(request: NextRequest): Promise<MiddlewareResponse> {
    // Verify if token is Valid
    const session =  request.cookies.get('session')?.value;
    const pathname = request.nextUrl.pathname;

    const isPrivateRoutes = checkIsPrivateRoute(pathname);

    const isAuthPages = pathname.includes('/auth')

    if (isAuthPages && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (!session && isPrivateRoutes) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
};