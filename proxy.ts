import { clerkMiddleware, createRouteMatcher,clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook/register",
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  const client = await clerkClient()
  const isPublic = isPublicRoute(req);
  const path = req.nextUrl.pathname;

  if (!userId && !isPublic) {
    return redirectToSignIn();
  }

  if (userId) {
    const isAdmin = (await client.users.getUser(userId!)).publicMetadata.role === "admin";
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isAdmin && path !== "/admin/dashboard") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (isPublic && path !== "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
