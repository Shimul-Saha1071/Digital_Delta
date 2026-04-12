import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { COLORS } from "../lib/config";
import {
  fetchTriage,
  computeRoute,
  updateEdge,
  resetNetwork,
} from "../lib/api";
import StatusBadge from "./components/StatusBadge";
import PriorityCard from "./components/PriorityCard";
import SectionHeader from "./components/SectionHeader";

export default function DashboardScreen() {
  const [triage, setTriage] = useState([]);
  const [route, setRoute] = useState(null);
  const [syncState, setSyncState] = useState("offline");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [floodActive, setFloodActive] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState("truck");

  const loadTriage = useCallback(async () => {
    setSyncState("syncing");
    const result = await fetchTriage();
    setTriage(result.items);
    setSyncState(result.online ? "verified" : "offline");
  }, []);

  const doRoute = useCallback(async (origin, dest, vehicle) => {
    setLoading(true);
    setActiveVehicle(vehicle);
    const result = await computeRoute(origin, dest, vehicle);
    setRoute(result);
    setLoading(false);
  }, []);

  const doFlood = async () => {
    const result = await updateEdge("E1", true);
    setFloodActive(true);
    Alert.alert(
      "🌊 Road E1 Flooded!",
      result.online
        ? "Recomputed in " +
            result.ms +
            "ms — within SLA: " +
            result.within_2sec_sla
        : "Offline — simulated locally",
      [{ text: "OK" }],
    );
    await doRoute("N1", "N3", "truck");
  };

  const doReset = async () => {
    await resetNetwork();
    setFloodActive(false);
    await doRoute("N1", "N3", "truck");
    Alert.alert("✅ Reset", "Network restored");
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTriage();
    setRefreshing(false);
  }, [loadTriage]);

  useEffect(() => {
    loadTriage();
    doRoute("N1", "N3", "truck");
  }, []);

  const stats = [
    { label: "Nodes", value: "6", color: COLORS.primary },
    {
      label: "Edges",
      value: floodActive ? "6" : "7",
      color: floodActive ? COLORS.danger : COLORS.success,
    },
    {
      label: "Flooded",
      value: floodActive ? "1" : "0",
      color: floodActive ? COLORS.danger : COLORS.textMuted,
    },
    {
      label: "Alerts",
      value: triage.filter((t) => t.breach).length.toString(),
      color: COLORS.warning,
    },
  ];

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View>
          <Text style={s.appName}>DIGITAL DELTA</Text>
          <Text style={s.appSub}>Disaster Logistics Command</Text>
        </View>
        <StatusBadge state={syncState} />
      </View>

      {syncState === "offline" && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineTxt}>
            📡 OFFLINE — Cached data — Pull down to retry
          </Text>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={s.statsRow}>
          {stats.map((st, i) => (
            <View key={i} style={s.statCard}>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="🚨  TRIAGE QUEUE  (M6)" />
        {triage.length === 0 ? (
          <View style={s.loadCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={s.loadTxt}>Loading...</Text>
          </View>
        ) : (
          triage.map((item) => <PriorityCard key={item.id} item={item} />)
        )}

        <SectionHeader title="🗺️  ROUTE ENGINE  (M4)" />
        <View style={s.btnRow}>
          {[
            { label: "🚛 Truck N1→N3", args: ["N1", "N3", "truck"] },
            { label: "🚤 Boat N1→N3", args: ["N1", "N3", "speedboat"] },
            { label: "🚁 Drone N1→N6", args: ["N1", "N6", "drone"] },
          ].map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[s.btn, activeVehicle === btn.args[2] && s.btnActive]}
              onPress={() => doRoute(...btn.args)}
            >
              <Text
                style={[
                  s.btnTxt,
                  activeVehicle === btn.args[2] && { color: COLORS.primary },
                ]}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.btnRow, { marginTop: 8 }]}>
          <TouchableOpacity
            style={[s.btn, { borderColor: COLORS.danger + "80", flex: 1 }]}
            onPress={doFlood}
          >
            <Text style={[s.btnTxt, { color: COLORS.danger }]}>
              🌊 Flood Road E1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { borderColor: COLORS.success + "80", flex: 1 }]}
            onPress={doReset}
          >
            <Text style={[s.btnTxt, { color: COLORS.success }]}>
              ✅ Reset Network
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={[s.resultCard, { alignItems: "center", padding: 24 }]}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={[s.sub, { marginTop: 10 }]}>Computing route...</Text>
          </View>
        ) : route ? (
          <View
            style={[
              s.resultCard,
              route.status === "no_path" && { borderColor: COLORS.danger },
            ]}
          >
            <Text style={s.resultTitle}>
              {route.status === "no_path"
                ? "❌  No path found"
                : "✅  Route computed"}
            </Text>
            {[
              ["Path", route.path?.join(" → ") || "—"],
              ["Time", route.total_time_mins + " minutes"],
              ["Vehicle", route.vehicle || activeVehicle],
              route.ms > 0 ? ["Speed", route.ms + "ms"] : null,
            ]
              .filter(Boolean)
              .map(([label, val], i) => (
                <View key={i} style={s.resultRow}>
                  <Text style={s.resultLabel}>{label}</Text>
                  <Text style={s.resultValue}>{val}</Text>
                </View>
              ))}
            {floodActive && (
              <View style={s.alertBox}>
                <Text style={s.alertTxt}>
                  ⚠ E1 flooded — auto-rerouted (M4.2)
                </Text>
              </View>
            )}
            {route.drone_required && (
              <View
                style={[s.alertBox, { borderColor: COLORS.warning + "80" }]}
              >
                <Text style={[s.alertTxt, { color: COLORS.warning }]}>
                  🚁 Drone handoff required (M8)
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <SectionHeader title="⚙  SYNC STATE DEMO  (Track A5)" />
        <View style={s.btnRow}>
          {["offline", "syncing", "verified", "conflict"].map((state) => (
            <TouchableOpacity
              key={state}
              style={[s.btn, syncState === state && s.btnActive]}
              onPress={() => setSyncState(state)}
            >
              <Text
                style={[
                  s.btnTxt,
                  syncState === state && { color: COLORS.primary },
                ]}
              >
                {state}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  appName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 3,
  },
  appSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  offlineBanner: {
    backgroundColor: "#1C1000",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineTxt: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  scroll: { flex: 1 },
  statsRow: { flexDirection: "row", padding: 16, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: { fontSize: 24, fontWeight: "900" },
  statLbl: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 3,
    textAlign: "center",
  },
  loadCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadTxt: { color: COLORS.textMuted, fontSize: 13 },
  btnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  btn: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnActive: { borderColor: COLORS.primary, backgroundColor: "#0A1A30" },
  btnTxt: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  resultCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  resultLabel: { color: COLORS.textMuted, fontSize: 12 },
  resultValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },
  alertBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.danger + "80",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#1A0808",
  },
  alertTxt: { color: COLORS.danger, fontSize: 12, fontWeight: "600" },
  sub: { color: COLORS.textMuted, fontSize: 13 },
});
