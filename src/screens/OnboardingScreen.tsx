import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveProfile } from "../storage/db";

const COLORS = ["#FF6B6B", "#4D96FF", "#6BCB77", "#FFC75F", "#A66CFF"];

export default function OnboardingScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await saveProfile({
      id: "me",
      name: trimmed,
      avatarColor: color,
      bio: "",
    });
    navigation.replace("ChatList");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.title}>ยินดีต้อนรับ 👋</Text>
          <Text style={styles.subtitle}>ตั้งค่าโปรไฟล์ของคุณเพื่อเริ่มแชท</Text>

          <View style={[styles.avatarPreview, { backgroundColor: color }]}>
            <Text style={styles.avatarPreviewText}>
              {name.trim() ? name.trim()[0].toUpperCase() : "?"}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="ชื่อของคุณ"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            maxLength={20}
          />

          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  color === c && styles.colorSwatchSelected,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>เริ่มใช้งาน</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  avatarPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  avatarPreviewText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  colorRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 32 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchSelected: { borderWidth: 3, borderColor: "#1a1a1a" },
  button: {
    backgroundColor: "#4D96FF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#c8c8c8" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
