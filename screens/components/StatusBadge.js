import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../lib/config";

const CONFIG = {
  offline: { color: COLORS.danger, icon: "⬤", bg: "#1A0808" },
  syncing: { color: COLORS.warning, icon: "↻", bg: "#1A1200" },
  verified: { color: COLORS.success, icon: "✓", bg: "#081A0E" },
  conflict: { color: COLORS.purple, icon: "⚠", bg: "#120A1A" },
};

export default function StatusBadge({ state }) {
  const cfg = CONFIG[state] || CONFIG.offline;
  return (
    <View
      style={[s.badge, { borderColor: cfg.color, backgroundColor: cfg.bg }]}
    >
      <Text style={[s.text, { color: cfg.color }]}>
        {cfg.icon} {state.toUpperCase()}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
