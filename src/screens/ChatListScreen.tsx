import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getChats, getLastMessage, getProfile } from "../storage/db";
import { Chat, Message, User } from "../types";

type ChatRow = Chat & { lastMessage: Message | null };

export default function ChatListScreen({ navigation }: any) {
  const [profile, setProfile] = useState<User | null>(null);
  const [rows, setRows] = useState<ChatRow[]>([]);

  const load = useCallback(async () => {
    const p = await getProfile();
    setProfile(p);
    const chats = await getChats();
    const withLast = await Promise.all(
      chats.map(async (c) => ({ ...c, lastMessage: await getLastMessage(c.id) }))
    );
    setRows(withLast);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>แชท</Text>
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: profile?.avatarColor ?? "#ccc" }]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name[0].toUpperCase() : "?"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatRow}
            onPress={() =>
              navigation.navigate("ChatRoom", {
                chatId: item.id,
                name: item.name,
                avatarColor: item.avatarColor,
                contactId: item.contactId,
                isAI: item.isAI,
              })
            }
          >
            <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
              <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatPreview} numberOfLines={1}>
                {item.lastMessage ? item.lastMessage.text : "เริ่มการสนทนา..."}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 30, fontWeight: "700", color: "#1a1a1a" },
  listContent: { paddingHorizontal: 16 },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  chatInfo: { marginLeft: 14, flex: 1 },
  chatName: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  chatPreview: { fontSize: 14, color: "#888", marginTop: 3 },
});
