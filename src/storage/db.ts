import AsyncStorage from "@react-native-async-storage/async-storage";
import { BOT_CONTACTS, initialChats } from "../data/contacts";
import { Chat, Message, User } from "../types";

const KEYS = {
  profile: "chatapp:profile",
  chats: "chatapp:chats",
  messages: "chatapp:messages",
};

export async function getProfile(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  return raw ? JSON.parse(raw) : null;
}

export async function saveProfile(profile: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export async function getChats(): Promise<Chat[]> {
  const raw = await AsyncStorage.getItem(KEYS.chats);
  if (raw) return JSON.parse(raw);
  const chats = initialChats();
  await AsyncStorage.setItem(KEYS.chats, JSON.stringify(chats));
  return chats;
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const raw = await AsyncStorage.getItem(KEYS.messages);
  const all: Message[] = raw ? JSON.parse(raw) : [];
  return all.filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt - b.createdAt);
}

export async function getLastMessage(chatId: string): Promise<Message | null> {
  const messages = await getMessages(chatId);
  return messages.length ? messages[messages.length - 1] : null;
}

export async function addMessage(message: Message): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.messages);
  const all: Message[] = raw ? JSON.parse(raw) : [];
  all.push(message);
  await AsyncStorage.setItem(KEYS.messages, JSON.stringify(all));
}

export function findContact(contactId: string) {
  return BOT_CONTACTS.find((c) => c.id === contactId) ?? null;
}
