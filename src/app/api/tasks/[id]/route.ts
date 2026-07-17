import { NextRequest, NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/taskStore";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const task = await updateTask(id, body);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteTask(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
