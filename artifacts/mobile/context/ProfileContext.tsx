import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { PROFILE_AVATAR_IDS } from "@/constants/profileAvatars";

const PROFILES_INDEX_KEY = "@mathdrills_profiles_v2_index";

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  storageKey: string;
}

interface ProfileContextType {
  profiles: PlayerProfile[];
  activeProfileId: string | null;
  activeProfile: PlayerProfile | null;
  isLoaded: boolean;
  createProfile: (name: string, avatar: string) => PlayerProfile;
  deleteProfile: (id: string) => Promise<void>;
  selectProfile: (id: string) => void;
  updateProfileName: (id: string, name: string) => void;
  signOut: () => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const PROFILE_AVATARS = [...PROFILE_AVATAR_IDS];

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROFILES_INDEX_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as {
            profiles: PlayerProfile[];
            activeProfileId?: string;
          };
          setProfiles(parsed.profiles ?? []);
          setActiveProfileId(parsed.activeProfileId ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback((profs: PlayerProfile[], activeId: string | null) => {
    AsyncStorage.setItem(
      PROFILES_INDEX_KEY,
      JSON.stringify({ profiles: profs, activeProfileId: activeId })
    ).catch(() => {});
  }, []);

  const createProfile = useCallback(
    (name: string, avatar: string): PlayerProfile => {
      const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const profile: PlayerProfile = {
        id,
        name: name.trim() || "Player",
        avatar,
        createdAt: Date.now(),
        storageKey: `@mathdrills_v4_${id}`,
      };
      setProfiles((prev) => {
        const next = [...prev, profile];
        persist(next, activeProfileId);
        return next;
      });
      return profile;
    },
    [activeProfileId, persist]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      const profile = profiles.find((p) => p.id === id);
      if (profile) {
        await AsyncStorage.removeItem(profile.storageKey).catch(() => {});
      }
      setProfiles((prev) => {
        const next = prev.filter((p) => p.id !== id);
        const newActive = activeProfileId === id ? null : activeProfileId;
        persist(next, newActive);
        if (activeProfileId === id) setActiveProfileId(null);
        return next;
      });
    },
    [profiles, activeProfileId, persist]
  );

  const selectProfile = useCallback(
    (id: string) => {
      setActiveProfileId(id);
      setProfiles((prev) => {
        persist(prev, id);
        return prev;
      });
    },
    [persist]
  );

  const updateProfileName = useCallback(
    (id: string, name: string) => {
      setProfiles((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, name: name.trim() || p.name } : p
        );
        persist(next, activeProfileId);
        return next;
      });
    },
    [activeProfileId, persist]
  );

  const signOut = useCallback(() => {
    setActiveProfileId(null);
    setProfiles((prev) => {
      persist(prev, null);
      return prev;
    });
  }, [persist]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfileId,
        activeProfile,
        isLoaded,
        createProfile,
        deleteProfile,
        selectProfile,
        updateProfileName,
        signOut,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfiles must be inside ProfileProvider");
  return ctx;
}
