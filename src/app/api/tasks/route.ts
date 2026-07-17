import { NextRequest, NextResponse } from "next/server";
import { addTask, listTasks } from "@/lib/taskStore";

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const task = await addTask({ title: body.title, dueDate: body.dueDate ?? null });
  return NextResponse.json({ task }, { status: 201 });
}
