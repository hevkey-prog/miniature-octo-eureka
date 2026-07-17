"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Task } from "@/lib/types";

export default function TrackerApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "สวัสดี! พิมพ์คุยกับฉันได้เลย เช่น \"เพิ่มงานซื้อของพรุ่งนี้\" หรือ \"วันนี้มีงานอะไรบ้าง\"",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function refreshTasks() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (!cancelled) setTasks(data.tasks ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function addTaskManually(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
    refreshTasks();
  }

  async function toggleDone(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    refreshTasks();
  }

  async function removeTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    refreshTasks();
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setChatInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `เกิดข้อผิดพลาด: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "(ไม่มีคำตอบ)" }]);
        if (data.tasks) setTasks(data.tasks);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            งานของฉัน
          </h1>
          <form onSubmit={addTaskManually} className="mb-4 flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="เพิ่มงานใหม่..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              เพิ่ม
            </button>
          </form>
          <ul className="flex flex-col gap-2">
            {tasks.length === 0 && (
              <li className="text-sm text-zinc-500">ยังไม่มีงาน ลองพิมพ์ในช่องแชทฝั่งขวา</li>
            )}
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleDone(task)}
                  />
                  <span
                    className={
                      task.done
                        ? "text-sm text-zinc-400 line-through"
                        : "text-sm text-zinc-800 dark:text-zinc-100"
                    }
                  >
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-zinc-400">
                      ({new Date(task.dueDate).toLocaleString("th-TH")})
                    </span>
                  )}
                </label>
                <button
                  onClick={() => removeTask(task)}
                  className="text-xs text-red-500 hover:underline"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            แชทกับ AI
          </h2>
          <div className="mb-4 flex-1 space-y-3 overflow-y-auto" style={{ maxHeight: "50vh" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "mr-auto max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                }
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="mr-auto max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-800">
                กำลังพิมพ์...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              ส่ง
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
