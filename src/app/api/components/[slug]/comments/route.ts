import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { registry } from "@/registry";

interface Context {
  params: { slug: string };
}

const MAX_COMMENT_LENGTH = 2000;

const isComponent = (slug: string) => registry.some((c) => c.name === slug);

export async function GET(_request: Request, { params }: Context) {
  if (!isComponent(params.slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { componentSlug: params.slug },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: Context) {
  if (!isComponent(params.slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const { body } = (await request.json()) as { body?: unknown };
  const text = typeof body === "string" ? body.trim() : "";
  if (!text || text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be 1-${MAX_COMMENT_LENGTH} characters` },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.create({
    data: { componentSlug: params.slug, userId: session.user.id, body: text },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });
  return NextResponse.json({ comment }, { status: 201 });
}

// Deletes one of the signed-in user's own comments: DELETE ?id=<commentId>.
export async function DELETE(request: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { count } = await prisma.comment.deleteMany({
    where: { id, componentSlug: params.slug, userId: session.user.id },
  });
  return count
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
