export type Task = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  createdAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
