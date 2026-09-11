export type User = {
  id: string;
  name: string;
  avatarColor: string;
  bio: string;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  contactId: string;
  name: string;
  avatarColor: string;
};
