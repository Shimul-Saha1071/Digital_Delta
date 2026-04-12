import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { COLORS } from "../lib/config";
import { syncWithServer } from "../lib/api";
import SectionHeader from "./components/SectionHeader";

const WRITE_ITEMS = [
  { key: "supply:rice", value: 200, icon: "🌾", label: "Rice" },
  { key: "supply:water", value: 500, icon: "💧", label: "Water" },
  { key: "supply:medicine", value: 75, icon: "💊", label: "Medicine" },
  { key: "supply:antivenom", value: 30, icon: "🧪", label: "Antivenom" },
  { key: "supply:tents", value: 120, icon: "⛺", label: "Tents" },
  { key: "status:N3", value: "critical", icon: "🔴", label: "N3 Status" },
  { key: "status:N4", value: "stable", icon: "🟢", label: "N4 Status" },
  { key: "status:N6", value: "active", icon: "🏥", label: "N6 Status" },
];

export default function SyncScreen() {
  const [localData, setLocalData] = useState({});
  const [syncLog, setSyncLog] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [lastClock, setLastClock] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const log = (msg, color = COLORS.textMuted) =>
    setSyncLog((prev) => [
      { msg, color, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 24),
    ]);

  const writeLocal = (key, value) => {
    const ts = Date.now() * 1000000;
    setLocalData((prev) => ({
      ...prev,
      [key]: { value, timestamp: ts, node: "mobile" },
    }));
    log("✏  " + key + " = " + value);
  };

  const doSync = async () => {
    if (Object.keys(localData).length === 0) {
      log("⚠  Nothing to sync — tap items above first", COLORS.warning);
      return;
    }
    setSyncing(true);
    log("↑  Pushing to server...", COLORS.primary);
    const result = await syncWithServer("mobile_device", lastClock, localData);
    if (result.online) {
      setLastClock(result.server_clock);
      setConflicts(result.conflicts || []);
      const deltaCount = Object.keys(result.delta || {}).length;
      log("✅  Sync complete", COLORS.success);
      log("    Sent: " + Object.keys(localData).length + " records");
      log("    Received: " + deltaCount + " new records");
      if (result.conflicts?.length > 0) {
        log(
          "⚠  " + result.conflicts.length + " conflict(s) detected",
          COLORS.warning,
        );
      }
      if (deltaCount > 0) {
        setLocalData((prev) => ({ ...prev, ...result.delta }));
        log("↓  Merged " + deltaCount + " remote record(s)", COLORS.success);
      }
    } else {
      log("📵  Server offline", COLORS.warning);
      log("    Data saved locally — merges on reconnect (M2)");
    }
    setSyncing(false);
  };

  const simulateConflict = () => {
    const key = "supply:antivenom";
    const oldTs = (Date.now() - 10000) * 1000000;
    setLocalData((prev) => ({
      ...prev,
      [key]: { value: 999, timestamp: oldTs, node: "old_device" },
    }));
    log("⚡  Conflict demo: antivenom=999 with old timestamp", COLORS.warning);
    log("    Sync now — server's newer value will win (LWW)");
  };

  const clearAll = () => {
    setLocalData({});
    setConflicts([]);
    setLastClock(0);
    setSyncLog([]);
  };

  const writtenKeys = Object.keys(localData);

  return (
    <ScrollView style={s.screen}>
      <Text style={s.title}>CRDT Sync Engine</Text>
      <Text style={s.desc}>
        Module M2 — Last-Write-Wins distributed store.{"\n"}
        Works offline. Merges on reconnect. Delta sync only.
      </Text>

      <SectionHeader title="WRITE TO LOCAL STORE" />
      <View style={s.grid}>
        {WRITE_ITEMS.map((item) => {
          const isWritten = writtenKeys.includes(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              style={[s.gridItem, isWritten && s.gridItemOn]}
              onPress={() => writeLocal(item.key, item.value)}
            >
              <Text style={s.gridIcon}>{item.icon}</Text>
              <Text
                style={[s.gridLabel, isWritten && { color: COLORS.primary }]}
              >
                {item.label}
              </Text>
              <Text style={s.gridValue}>{item.value}</Text>
              {isWritten && <View style={s.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[s.syncBtn, syncing && { borderColor: COLORS.warning }]}
        onPress={doSync}
        disabled={syncing}
      >
        <Text style={[s.syncBtnTxt, syncing && { color: COLORS.warning }]}>
          {syncing ? "↻  Syncing..." : "🔄  Sync with Server"}
        </Text>
      </TouchableOpacity>

      <View style={s.row2}>
        <TouchableOpacity
          style={[s.halfBtn, { borderColor: COLORS.warning + "80" }]}
          onPress={simulateConflict}
        >
          <Text style={[s.halfBtnTxt, { color: COLORS.warning }]}>
            ⚡ Simulate Conflict
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.halfBtn, { borderColor: COLORS.danger + "80" }]}
          onPress={clearAll}
        >
          <Text style={[s.halfBtnTxt, { color: COLORS.danger }]}>
            🗑 Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {conflicts.length > 0 && (
        <>
          <SectionHeader title={"⚠  CONFLICTS  (M2.3)"} />
          {conflicts.map((c, i) => (
            <View key={i} style={s.conflictCard}>
              <Text style={s.conflictKey}>{c.key}</Text>
              <View style={s.conflictRow}>
                <View style={s.conflictSide}>
                  <Text style={s.conflictSideLabel}>LOCAL</Text>
                  <Text style={s.conflictVal}>
                    {JSON.stringify(c.local?.value)}
                  </Text>
                  <Text style={s.conflictNode}>{c.local?.node}</Text>
                </View>
                <Text style={s.conflictVs}>VS</Text>
                <View style={s.conflictSide}>
                  <Text style={s.conflictSideLabel}>REMOTE</Text>
                  <Text style={s.conflictVal}>
                    {JSON.stringify(c.remote?.value)}
                  </Text>
                  <Text style={s.conflictNode}>{c.remote?.node}</Text>
                </View>
              </View>
              <Text style={s.conflictRes}>
                ✓ Higher timestamp wins (LWW-Register)
              </Text>
            </View>
          ))}
        </>
      )}

      <SectionHeader
        title={"LOCAL CRDT STORE  (" + writtenKeys.length + " records)"}
      />
      <View style={s.storeBox}>
        {writtenKeys.length === 0 ? (
          <Text style={s.storeEmpty}>Empty — tap items above to write</Text>
        ) : (
          writtenKeys.map((k) => (
            <View key={k} style={s.storeRow}>
              <Text style={s.storeKey}>{k}</Text>
              <Text style={s.storeVal}>
                {JSON.stringify(localData[k].value)}
              </Text>
              <Text style={s.storeNode}>[{localData[k].node}]</Text>
            </View>
          ))
        )}
      </View>

      <SectionHeader title="SYNC LOG" />
      <View style={s.logBox}>
        {syncLog.length === 0 ? (
          <Text style={s.logEmpty}>No events yet</Text>
        ) : (
          syncLog.map((entry, i) => (
            <Text key={i} style={[s.logLine, { color: entry.color }]}>
              [{entry.time}] {entry.msg}
            </Text>
          ))
        )}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  title: { color: COLORS.text, fontWeight: "900", fontSize: 22, marginTop: 8 },
  desc: { color: COLORS.textMuted, fontSize: 12, marginTop: 6, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    width: "23%",
    alignItems: "center",
    position: "relative",
  },
  gridItemOn: { borderColor: COLORS.primary, backgroundColor: "#0A1A30" },
  gridIcon: { fontSize: 22 },
  gridLabel: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  gridValue: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
  dot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  syncBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  syncBtnTxt: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  row2: { flexDirection: "row", gap: 8, marginTop: 8 },
  halfBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  halfBtnTxt: { fontWeight: "700", fontSize: 12 },
  conflictCard: {
    backgroundColor: "#1A1000",
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  conflictKey: {
    color: COLORS.warning,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 10,
  },
  conflictRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  conflictSide: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
  },
  conflictSideLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  conflictVal: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  conflictNode: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  conflictVs: { color: COLORS.textMuted, fontWeight: "900", fontSize: 12 },
  conflictRes: { color: COLORS.success, fontSize: 11, fontWeight: "600" },
  storeBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  storeEmpty: { color: COLORS.textMuted, fontSize: 12 },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  storeKey: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: "monospace",
    flex: 2,
  },
  storeVal: { color: COLORS.text, fontWeight: "700", fontSize: 12, flex: 1 },
  storeNode: {
    color: COLORS.textMuted,
    fontSize: 10,
    flex: 1,
    textAlign: "right",
  },
  logBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  logEmpty: { color: COLORS.textMuted, fontSize: 12 },
  logLine: {
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 4,
    lineHeight: 17,
  },
});
