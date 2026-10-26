import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { registry } from "@/registry";

interface Context {
  params: { slug: string };
}

const isComponent = (slug: string) => registry.some((c) => c.name === slug);

export async function GET(_request: Request, { params }: Context) {
  if (!isComponent(params.slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSession();
  const [count, mine] = await Promise.all([
    prisma.favorite.count({ where: { componentSlug: params.slug } }),
    session
      ? prisma.favorite.findUnique({
          where: { userId_componentSlug: { userId: session.user.id, componentSlug: params.slug } },
        })
      : null,
  ]);
  return NextResponse.json({ count, favorited: !!mine });
}

// Toggles the signed-in user's favorite and returns the new state.
export async function POST(_request: Request, { params }: Context) {
  if (!isComponent(params.slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in to favorite" }, { status: 401 });

  const key = { userId_componentSlug: { userId: session.user.id, componentSlug: params.slug } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: key });
  } else {
    await prisma.favorite.create({ data: { userId: session.user.id, componentSlug: params.slug } });
  }

  const count = await prisma.favorite.count({ where: { componentSlug: params.slug } });
  return NextResponse.json({ count, favorited: !existing });
}
