import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isAuth = !!req.auth
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')
    const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')
    const isApiRegister = req.nextUrl.pathname.startsWith('/api/register')
    const isHomePage = req.nextUrl.pathname === '/'

    // Allow access to auth pages, API routes, and home page
    if (isAuthPage || isApiAuth || isApiRegister || isHomePage) {
        return NextResponse.next()
    }

    // Redirect to login if not authenticated
    if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
