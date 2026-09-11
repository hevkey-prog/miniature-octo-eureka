import { Chat, User } from "../types";

export const AI_CONTACT_ID = "ai-1";

export const BOT_CONTACTS: (User & { chatId: string; isAI?: boolean })[] = [
  {
    id: AI_CONTACT_ID,
    chatId: "chat-ai-1",
    name: "AI ผู้ช่วย",
    avatarColor: "#A66CFF",
    bio: "คุยได้ทุกเรื่อง ขับเคลื่อนด้วย Claude",
    isAI: true,
  },
  {
    id: "bot-1",
    chatId: "chat-1",
    name: "แนน",
    avatarColor: "#FF6B6B",
    bio: "ชอบดูหนังกับกาแฟ ☕️",
  },
  {
    id: "bot-2",
    chatId: "chat-2",
    name: "ต้น",
    avatarColor: "#4D96FF",
    bio: "สายเที่ยว สายกิน 🍜",
  },
  {
    id: "bot-3",
    chatId: "chat-3",
    name: "มายด์",
    avatarColor: "#6BCB77",
    bio: "นักพัฒนาแอป 👩‍💻",
  },
];

export function initialChats(): Chat[] {
  return BOT_CONTACTS.map((c) => ({
    id: c.chatId,
    contactId: c.id,
    name: c.name,
    avatarColor: c.avatarColor,
    isAI: c.isAI,
  }));
}

const AUTO_REPLIES = [
  "จริงเหรอ! เล่าต่อสิ 😄",
  "อืมม เข้าใจเลย",
  "555 ตลกมาก",
  "วันนี้เป็นไงบ้าง?",
  "โอเคๆ เดี๋ยวคุยต่อนะ",
  "น่าสนใจมาก!",
];

export function randomAutoReply(): string {
  return AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
}
