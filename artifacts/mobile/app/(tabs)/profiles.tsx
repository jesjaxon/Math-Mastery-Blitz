import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PROFILE_AVATARS,
  useProfiles,
  type PlayerProfile,
} from "@/context/ProfileContext";
import { useColors } from "@/hooks/useColors";

export default function ProfilesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profiles, activeProfileId, selectProfile, createProfile, deleteProfile, updateProfileName } = useProfiles();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState(PROFILE_AVATARS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleSelect(p: PlayerProfile) {
    selectProfile(p.id);
    router.replace("/");
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const p = createProfile(newName.trim(), newAvatar);
    selectProfile(p.id);
    setCreating(false);
    setNewName("");
    setNewAvatar(PROFILE_AVATARS[0]);
    router.replace("/");
  }

  function handleDelete(p: PlayerProfile) {
    Alert.alert(
      "Delete Profile",
      `Delete "${p.name}"? All progress will be lost permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProfile(p.id),
        },
      ]
    );
  }

  function startEdit(p: PlayerProfile) {
    setEditingId(p.id);
    setEditName(p.name);
  }

  function saveEdit() {
    if (editingId && editName.trim()) {
      updateProfileName(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 20, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          {activeProfileId ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <Text style={[styles.title, { color: colors.foreground }]}>Players</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {activeProfileId ? "Switch player or manage profiles" : "Choose who's playing"}
        </Text>

        {/* Profile cards */}
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          const isEditing = editingId === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.profileCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 2 : 1,
                },
              ]}
              onPress={() => handleSelect(p)}
              activeOpacity={0.8}
            >
              <Text style={styles.profileAvatar}>{p.avatar}</Text>
              <View style={styles.profileInfo}>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, { color: colors.foreground, borderColor: colors.primary }]}
                    value={editName}
                    onChangeText={setEditName}
                    onSubmitEditing={saveEdit}
                    onBlur={saveEdit}
                    autoFocus
                    maxLength={20}
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={[styles.profileName, { color: colors.foreground }]}>{p.name}</Text>
                )}
                <Text style={[styles.profileMeta, { color: colors.mutedForeground }]}>
                  {isActive ? "▶ Playing now" : `Created ${new Date(p.createdAt).toLocaleDateString()}`}
                </Text>
              </View>
              <View style={styles.profileActions}>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); startEdit(p); }}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); handleDelete(p); }}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={15} color="#FF4757" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Create form */}
        {creating ? (
          <View style={[styles.createCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Text style={[styles.createTitle, { color: colors.foreground }]}>New Player</Text>

            {/* Avatar picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
              <View style={styles.avatarRow}>
                {PROFILE_AVATARS.map((av) => (
                  <TouchableOpacity
                    key={av}
                    onPress={() => setNewAvatar(av)}
                    style={[
                      styles.avatarOption,
                      { backgroundColor: newAvatar === av ? colors.primary + "33" : "transparent",
                        borderColor: newAvatar === av ? colors.primary : "transparent",
                        borderWidth: 2 },
                    ]}
                  >
                    <Text style={{ fontSize: 28 }}>{av}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={[styles.nameInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Enter name"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />

            <View style={styles.createBtns}>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
                disabled={!newName.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.createBtnText}>Create & Play</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setCreating(false); setNewName(""); }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.primary + "66", backgroundColor: colors.card }]}
            onPress={() => setCreating(true)}
            activeOpacity={0.8}
          >
            <Feather name="user-plus" size={20} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Player</Text>
          </TouchableOpacity>
        )}

        {profiles.length === 0 && !creating && (
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            Create a profile to save your progress separately for each player.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 4 },
  profileCard: {
    borderRadius: 18, padding: 16, flexDirection: "row",
    alignItems: "center", gap: 14,
  },
  profileAvatar: { fontSize: 42 },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  profileMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  profileActions: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBtn: { padding: 4 },
  editInput: {
    fontSize: 18, fontFamily: "Inter_700Bold",
    borderBottomWidth: 2, paddingVertical: 2,
    minWidth: 120,
  },
  createCard: {
    borderRadius: 18, padding: 18, gap: 14,
    borderWidth: 1.5,
  },
  createTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  avatarScroll: { marginHorizontal: -4 },
  avatarRow: { flexDirection: "row", gap: 6, paddingHorizontal: 4 },
  avatarOption: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nameInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: "Inter_400Regular",
  },
  createBtns: { flexDirection: "row", gap: 10 },
  createBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  createBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1 },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addBtn: {
    borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderWidth: 1.5, borderStyle: "dashed",
  },
  addBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
