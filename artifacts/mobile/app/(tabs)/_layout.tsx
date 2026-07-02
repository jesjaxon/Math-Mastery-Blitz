import { Stack } from "expo-router";
import React from "react";
import { useColors } from "@/hooks/useColors";

export default function GameStackLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="leaderboard-rewards" />
      <Stack.Screen name="account" />
      <Stack.Screen name="account-analytics" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="game" options={{ animation: "fade" }} />
      <Stack.Screen name="results" options={{ animation: "fade", gestureEnabled: false }} />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="classroom" />
      <Stack.Screen name="classroom-edit" options={{ animation: "fade", gestureEnabled: false }} />
      <Stack.Screen name="aquarium" />
      <Stack.Screen name="zoo" />
      <Stack.Screen name="rocket" />
      <Stack.Screen name="launch" options={{ animation: "fade", gestureEnabled: false }} />
      <Stack.Screen name="workshop" />
      <Stack.Screen name="profiles" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}
