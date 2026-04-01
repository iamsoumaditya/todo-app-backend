import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

async function isAdmin(userId: string) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return  user.publicMetadata.role === "admin"
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!userId) {
      return NextResponse.json({ error: "Todo is not found" }, { status: 404 });
    }
    if (todo?.userId !== userId) {
      return NextResponse.json(
        { error: "Todo is not belongs to you" },
        { status: 403 },
      );
    }

    await prisma.todo.delete({ where: { id } });
    return NextResponse.json(
      {
        message: "Todo deleted successfully",
        todo,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting todo", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { completed } = await req.json();
    const { id } = await params;

    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    if (todo.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: { isCompleted: completed },
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error("Error updating todo", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
