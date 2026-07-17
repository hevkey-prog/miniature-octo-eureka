import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Task } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

async function ensureStore(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<Task[]> {
  await ensureStore();
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Task[];
}

async function writeAll(tasks: Task[]): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

export async function listTasks(): Promise<Task[]> {
  const tasks = await readAll();
  return tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addTask(input: {
  title: string;
  dueDate?: string | null;
}): Promise<Task> {
  const tasks = await readAll();
  const task: Task = {
    id: randomUUID(),
    title: input.title,
    done: false,
    dueDate: input.dueDate ?? null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  await writeAll(tasks);
  return task;
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "done" | "dueDate">>
): Promise<Task | null> {
  const tasks = await readAll();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...patch };
  await writeAll(tasks);
  return tasks[idx];
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await readAll();
  const next = tasks.filter((t) => t.id !== id);
  if (next.length === tasks.length) return false;
  await writeAll(next);
  return true;
}

export async function findTaskByTitle(query: string): Promise<Task | null> {
  const tasks = await readAll();
  const lower = query.toLowerCase();
  return (
    tasks.find((t) => t.title.toLowerCase().includes(lower)) ?? null
  );
}
