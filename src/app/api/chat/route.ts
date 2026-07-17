import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  addTask,
  deleteTask,
  findTaskByTitle,
  listTasks,
  updateTask,
} from "@/lib/taskStore";
import type { ChatMessage } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const tools: Anthropic.Tool[] = [
  {
    name: "list_tasks",
    description: "List all tasks currently tracked, including their done status and due date.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "add_task",
    description: "Add a new task to the tracker.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short description of the task" },
        dueDate: {
          type: "string",
          description: "ISO 8601 date/time the task is due, if mentioned. Omit if not specified.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as done, or reopen it. Find the task by matching a text fragment of its title.",
    input_schema: {
      type: "object",
      properties: {
        titleQuery: { type: "string", description: "Text to search for within the task title" },
        done: { type: "boolean", description: "true to mark complete, false to reopen" },
      },
      required: ["titleQuery", "done"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task. Find the task by matching a text fragment of its title.",
    input_schema: {
      type: "object",
      properties: {
        titleQuery: { type: "string", description: "Text to search for within the task title" },
      },
      required: ["titleQuery"],
    },
  },
];

async function runTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_tasks":
      return await listTasks();
    case "add_task":
      return await addTask({
        title: String(input.title),
        dueDate: (input.dueDate as string | undefined) ?? null,
      });
    case "complete_task": {
      const match = await findTaskByTitle(String(input.titleQuery));
      if (!match) return { error: "no matching task found" };
      return await updateTask(match.id, { done: Boolean(input.done) });
    }
    case "delete_task": {
      const match = await findTaskByTitle(String(input.titleQuery));
      if (!match) return { error: "no matching task found" };
      await deleteTask(match.id);
      return { deleted: match.id };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

const SYSTEM_PROMPT = `You are the built-in assistant for a personal task tracker app.
You can view, add, complete, and delete the user's tasks using the provided tools.
Always use the tools to check or change real task data instead of guessing.
Reply concisely in the same language the user writes in.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let finalText = "";

  for (let turn = 0; turn < 6; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages: conversation,
    });

    const textBlocks = response.content.filter((b) => b.type === "text");
    finalText = textBlocks.map((b) => (b as Anthropic.TextBlock).text).join("\n");

    if (response.stop_reason !== "tool_use") {
      break;
    }

    conversation.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const result = await runTool(block.name, block.input as Record<string, unknown>);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }
    conversation.push({ role: "user", content: toolResults });
  }

  const tasks = await listTasks();
  return NextResponse.json({ reply: finalText, tasks });
}
