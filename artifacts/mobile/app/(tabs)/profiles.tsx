import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PROFILE_AVATARS,
  useProfiles,
  type PlayerProfile,
} from "@/context/ProfileContext";
import { getProfileAvatarAsset } from "@/constants/profileAvatars";
import { PROFILE_UI_ASSETS } from "@/constants/profileUiAssets";
import { START_DRILL_ASSETS } from "@/constants/startDrillAssets";
import { useColors } from "@/hooks/useColors";
import { PinnedHeader, usePinnedHeaderHeight } from "@/components/PinnedHeader";

function ProfileAvatar({ avatar, size = 54 }: { avatar: string; size?: number }) {
  const asset = getProfileAvatarAsset(avatar);
  return <Image source={asset ?? PROFILE_UI_ASSETS.playerBadge} style={{ width: size, height: size }} resizeMode="contain" />;
}

export default function ProfilesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profiles, activeProfileId, selectProfile, createProfile, deleteProfile, updateProfileName } = useProfiles();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = usePinnedHeaderHeight();

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
      <PinnedHeader
        title="Players"
        subtitle={activeProfileId ? "Switch player or manage profiles" : "Choose who's playing"}
        showBack={Boolean(activeProfileId)}
      />
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + 8, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile cards */}
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          const isEditing = editingId === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.profileCardWrap}
              onPress={() => handleSelect(p)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isActive ? ["#1D1842", "#151B37", "#101229"] : ["#15142C", "#111024"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.profileCard,
                  {
                    borderColor: isActive ? colors.primary : colors.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.profileAvatarWell}>
                  <ProfileAvatar avatar={p.avatar} size={66} />
                </View>
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
                    <Text style={[styles.profileName, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                  )}
                  <View style={styles.profileMetaRow}>
                    <Image source={isActive ? PROFILE_UI_ASSETS.playingNow : PROFILE_UI_ASSETS.nameTag} style={styles.profileMetaIcon} resizeMode="contain" />
                    <Text style={[styles.profileMeta, { color: isActive ? "#9AE6FF" : colors.mutedForeground }]} numberOfLines={1}>
                      {isActive ? "Playing now" : `Created ${new Date(p.createdAt).toLocaleDateString()}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.profileActions}>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); startEdit(p); }}
                    style={[styles.iconBtn, { backgroundColor: "#222048" }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Image source={PROFILE_UI_ASSETS.edit} style={styles.actionAsset} resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleDelete(p); }}
                    style={[styles.iconBtn, { backgroundColor: "#33192B" }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Image source={PROFILE_UI_ASSETS.delete} style={styles.actionAsset} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* Create form */}
        {creating ? (
          <LinearGradient
            colors={["#19163A", "#11172F", "#121026"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.createCard, { borderColor: colors.primary }]}
          >
            <View style={styles.createHeader}>
              <Image source={PROFILE_UI_ASSETS.addPlayer} style={styles.createHeaderAsset} resizeMode="contain" />
              <View>
                <Text style={[styles.createTitle, { color: colors.foreground }]}>New Player</Text>
                <Text style={[styles.createSub, { color: colors.mutedForeground }]}>Pick an avatar and name</Text>
              </View>
            </View>

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
                        borderColor: newAvatar === av ? colors.primary : colors.border,
                        borderWidth: newAvatar === av ? 2 : 1 },
                    ]}
                  >
                    <ProfileAvatar avatar={av} size={42} />
                    {newAvatar === av && <Image source={PROFILE_UI_ASSETS.selectedRing} style={styles.avatarSelectedRing} resizeMode="contain" />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.nameInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Image source={PROFILE_UI_ASSETS.nameTag} style={styles.nameInputAsset} resizeMode="contain" />
              <TextInput
                style={[styles.nameInput, { color: colors.foreground }]}
                placeholder="Player name"
                placeholderTextColor={colors.mutedForeground}
                value={newName}
                onChangeText={setNewName}
                maxLength={20}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
            </View>

            <View style={styles.createBtns}>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: newName.trim() ? colors.primary : colors.muted }]}
                onPress={handleCreate}
                disabled={!newName.trim()}
                activeOpacity={0.8}
              >
                <Image source={PROFILE_UI_ASSETS.createPlay} style={styles.createBtnAsset} resizeMode="contain" />
                <Text style={styles.createBtnText}>Create & Play</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setCreating(false); setNewName(""); }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.primary + "66", backgroundColor: colors.card }]}
            onPress={() => setCreating(true)}
            activeOpacity={0.8}
          >
            <Image source={PROFILE_UI_ASSETS.addPlayer} style={styles.addBtnAsset} resizeMode="contain" />
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
  scroll: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10 },
  backBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  settingsBtn: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  backAsset: { width: 54, height: 54 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center", marginBottom: 6 },
  profileCardWrap: { borderRadius: 24 },
  profileCard: {
    borderRadius: 24, padding: 14, flexDirection: "row",
    alignItems: "center", gap: 12,
  },
  profileAvatarWell: { width: 74, height: 74, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,111,255,0.12)" },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  profileMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  profileMetaIcon: { width: 20, height: 20 },
  profileMeta: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  profileActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionAsset: { width: 28, height: 28 },
  editInput: {
    fontSize: 18, fontFamily: "Inter_700Bold",
    borderBottomWidth: 2, paddingVertical: 2,
    minWidth: 120,
  },
  createCard: {
    borderRadius: 24, padding: 16, gap: 14,
    borderWidth: 1.5,
  },
  createHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  createHeaderAsset: { width: 44, height: 44 },
  createTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  createSub: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 1 },
  avatarScroll: { marginHorizontal: -4 },
  avatarRow: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  avatarOption: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  avatarSelectedRing: { position: "absolute", width: 60, height: 60 },
  nameInputWrap: {
    borderWidth: 1, borderRadius: 18,
    paddingHorizontal: 12, minHeight: 58,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  nameInputAsset: { width: 30, height: 30 },
  nameInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16, fontFamily: "Inter_400Regular",
  },
  createBtns: { flexDirection: "row", gap: 10 },
  createBtn: { flex: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  createBtnAsset: { width: 34, height: 34 },
  createBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelBtn: { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, borderWidth: 1, justifyContent: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addBtn: {
    borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderWidth: 1.5, borderStyle: "dashed",
  },
  addBtnAsset: { width: 28, height: 28 },
  addBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
