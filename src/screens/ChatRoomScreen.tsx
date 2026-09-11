import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { randomAutoReply } from "../data/contacts";
import { addMessage, getMessages } from "../storage/db";
import { Message } from "../types";

export default function ChatRoomScreen({ route, navigation }: any) {
  const { chatId, name, avatarColor, contactId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: name });
    getMessages(chatId).then(setMessages);
  }, [chatId, name, navigation]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");

    const mine: Message = {
      id: `${Date.now()}-me`,
      chatId,
      senderId: "me",
      text,
      createdAt: Date.now(),
    };
    await addMessage(mine);
    setMessages((prev) => [...prev, mine]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    setTimeout(async () => {
      const reply: Message = {
        id: `${Date.now()}-${contactId}`,
        chatId,
        senderId: contactId,
        text: randomAutoReply(),
        createdAt: Date.now(),
      };
      await addMessage(reply);
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.senderId === "me";
            return (
              <View
                style={[
                  styles.bubble,
                  mine
                    ? [styles.bubbleMine, { backgroundColor: "#4D96FF" }]
                    : [styles.bubbleTheirs, { backgroundColor: avatarColor + "22" }],
                ]}
              >
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                  {item.text}
                </Text>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="พิมพ์ข้อความ..."
            placeholderTextColor="#999"
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            onPress={send}
            disabled={!draft.trim()}
          >
            <Text style={styles.sendButtonText}>ส่ง</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  listContent: { padding: 16, gap: 8 },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  bubbleMine: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 16, color: "#1a1a1a" },
  bubbleTextMine: { color: "#fff" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#4D96FF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  sendButtonDisabled: { backgroundColor: "#c8c8c8" },
  sendButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
