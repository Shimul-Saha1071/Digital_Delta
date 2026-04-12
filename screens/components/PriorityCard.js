import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, PRIORITY_COLORS } from "../../lib/config";

export default function PriorityCard({ item }) {
  const pColor = PRIORITY_COLORS[item.priority] || COLORS.textMuted;
  const isBreach = item.breach;
  const pct = Math.min(100, (item.eta_hrs / item.sla_hrs) * 100);

  return (
    <View
      style={[
        s.card,
        isBreach && { borderColor: COLORS.danger, backgroundColor: "#180808" },
      ]}
    >
      <View style={s.topRow}>
        <View style={[s.pill, { backgroundColor: pColor }]}>
          <Text style={s.pillTxt}>{item.priority}</Text>
        </View>
        <Text style={s.cargo}>{item.cargo}</Text>
        {isBreach && (
          <View style={s.breachPill}>
            <Text style={s.breachTxt}>SLA BREACH</Text>
          </View>
        )}
      </View>
      <View style={s.timeRow}>
        <Text style={s.timeTxt}>
          ETA:{" "}
          <Text style={{ color: isBreach ? COLORS.danger : COLORS.text }}>
            {item.eta_hrs}h
          </Text>
          {"   "}SLA: {item.sla_hrs}h
        </Text>
        <Text
          style={[
            s.statusTxt,
            { color: isBreach ? COLORS.danger : COLORS.success },
          ]}
        >
          {isBreach ? "→ REROUTING" : "✓ On track"}
        </Text>
      </View>
      <View style={s.barBg}>
        <View
          style={[
            s.barFill,
            {
              width: pct + "%",
              backgroundColor: isBreach ? COLORS.danger : COLORS.success,
            },
          ]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  pillTxt: { color: "#fff", fontWeight: "900", fontSize: 11 },
  cargo: { color: COLORS.text, fontWeight: "700", fontSize: 15, flex: 1 },
  breachPill: {
    backgroundColor: "#3D0000",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  breachTxt: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeTxt: { color: COLORS.textMuted, fontSize: 12 },
  statusTxt: { fontSize: 11, fontWeight: "700" },
  barBg: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: 3, borderRadius: 2 },
});
