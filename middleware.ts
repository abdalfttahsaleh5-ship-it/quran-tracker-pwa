import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json & sw.js & icons
     * - image, audio, font assets
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|webm|mp4|ogg|mp3|woff|woff2|ttf|eot)$).*)",
  ],
};
