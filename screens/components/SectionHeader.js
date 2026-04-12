import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS } from "../../lib/config";

export default function SectionHeader({ title }) {
  return <Text style={s.text}>{title}</Text>;
}

const s = StyleSheet.create({
  text: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
});
