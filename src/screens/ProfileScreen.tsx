import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfile, saveProfile } from "../storage/db";
import { User } from "../types";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<User | null>(null);
  const [bio, setBio] = useState("");

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setBio(p?.bio ?? "");
    });
  }, []);

  const handleBioChange = async (text: string) => {
    setBio(text);
    if (profile) {
      const updated = { ...profile, bio: text };
      setProfile(updated);
      await saveProfile(updated);
    }
  };

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
          <Text style={styles.avatarText}>{profile.name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>

        <Text style={styles.label}>เกี่ยวกับฉัน</Text>
        <TextInput
          style={styles.bioInput}
          placeholder="เขียนอะไรสักหน่อยเกี่ยวกับตัวคุณ..."
          placeholderTextColor="#999"
          value={bio}
          onChangeText={handleBioChange}
          multiline
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, alignItems: "center" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "700" },
  name: { fontSize: 24, fontWeight: "700", marginTop: 16, color: "#1a1a1a" },
  label: {
    alignSelf: "flex-start",
    marginTop: 32,
    marginBottom: 8,
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  bioInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 90,
    textAlignVertical: "top",
  },
});
