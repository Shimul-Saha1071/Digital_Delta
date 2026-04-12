import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS, NODE_COLORS, NODE_ICONS } from "../lib/config";
import { fetchMap, computeRoute, getEdgeRisk } from "../lib/api";
import SectionHeader from "./components/SectionHeader";

const VEHICLES = [
  { key: "truck", icon: "🚛", label: "Truck", rule: "Roads only" },
  { key: "speedboat", icon: "🚤", label: "Speedboat", rule: "Rivers only" },
  { key: "drone", icon: "🚁", label: "Drone", rule: "All edges" },
];

export default function MapScreen() {
  const [nodes, setNodes] = useState([]);
  const [vehicle, setVehicle] = useState("truck");
  const [origin, setOrigin] = useState("N1");
  const [selected, setSelected] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    fetchMap().then((r) => {
      setNodes(r.data.nodes);
      setOnline(r.online);
    });
  }, []);

  const doRoute = async (destId) => {
    setSelected(destId);
    setRoute(null);
    setLoading(true);
    const result = await computeRoute(origin, destId, vehicle);
    setRoute(result);
    setLoading(false);
  };

  const doMLCheck = async (edgeId) => {
    setMlLoading(true);
    setMlResult(null);
    const result = await getEdgeRisk(edgeId);
    setMlResult(result);
    setMlLoading(false);
  };

  return (
    <ScrollView style={s.screen}>
      <View
        style={[
          s.banner,
          { borderColor: online ? COLORS.success : COLORS.warning },
        ]}
      >
        <Text
          style={[
            s.bannerTxt,
            { color: online ? COLORS.success : COLORS.warning },
          ]}
        >
          {online ? "🟢  Live data from server" : "🟡  Offline — cached nodes"}
        </Text>
      </View>

      <SectionHeader title="SELECT ORIGIN" />
      <View style={s.btnRow}>
        {nodes.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              s.smallBtn,
              origin === n.id && {
                borderColor: COLORS.success,
                backgroundColor: "#081A0E",
              },
            ]}
            onPress={() => setOrigin(n.id)}
          >
            <Text
              style={[
                s.smallBtnTxt,
                origin === n.id && { color: COLORS.success },
              ]}
            >
              {n.id}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader title="VEHICLE TYPE  (M4.3)" />
      <View style={s.vehicleRow}>
        {VEHICLES.map((v) => (
          <TouchableOpacity
            key={v.key}
            style={[s.vehicleCard, vehicle === v.key && s.vehicleCardOn]}
            onPress={() => setVehicle(v.key)}
          >
            <Text style={s.vehicleIcon}>{v.icon}</Text>
            <Text
              style={[
                s.vehicleLabel,
                vehicle === v.key && { color: COLORS.primary },
              ]}
            >
              {v.label}
            </Text>
            <Text style={s.vehicleRule}>{v.rule}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader title="DESTINATION — TAP TO ROUTE" />
      {nodes.map((node) => {
        const nColor = NODE_COLORS[node.type] || COLORS.textMuted;
        const isSelected = selected === node.id;
        return (
          <TouchableOpacity
            key={node.id}
            onPress={() => doRoute(node.id)}
            style={[
              s.nodeCard,
              { borderLeftColor: nColor },
              isSelected && {
                backgroundColor: "#0A1020",
                borderColor: COLORS.primary,
              },
            ]}
          >
            <View style={s.nodeRow}>
              <Text style={s.nodeIcon}>{NODE_ICONS[node.type]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.nodeName}>{node.name}</Text>
                <Text style={s.nodeType}>{node.type?.replace(/_/g, " ")}</Text>
              </View>
              <View style={[s.nodeIdBadge, { borderColor: nColor }]}>
                <Text style={[s.nodeIdTxt, { color: nColor }]}>{node.id}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {(loading || route) && (
        <>
          <SectionHeader title="ROUTE RESULT" />
          {loading ? (
            <View style={s.loadCard}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={s.loadTxt}>Running Dijkstra...</Text>
            </View>
          ) : (
            <View
              style={[
                s.routeCard,
                route.status === "no_path" && { borderColor: COLORS.danger },
              ]}
            >
              <Text style={s.routeTitle}>
                {route.status === "no_path"
                  ? "❌  No path for this vehicle"
                  : "✅  Route found"}
              </Text>
              {[
                ["Path", route.path?.join(" → ") || "—"],
                ["Time", route.total_time_mins + " min"],
                ["Vehicle", route.vehicle || vehicle],
                route.ms > 0 ? ["Speed", route.ms + "ms"] : null,
              ]
                .filter(Boolean)
                .map(([label, val], i) => (
                  <View key={i} style={s.routeRow}>
                    <Text style={s.routeLabel}>{label}</Text>
                    <Text style={s.routeValue}>{val}</Text>
                  </View>
                ))}
              {route.status === "no_path" && (
                <Text style={s.routeHint}>Try switching to Drone above</Text>
              )}
              {route.drone_required && (
                <Text style={[s.routeHint, { color: COLORS.warning }]}>
                  🚁 Drone handoff needed (M8)
                </Text>
              )}
            </View>
          )}
        </>
      )}

      <SectionHeader title="ML ROUTE DECAY  (M7)" />
      <Text style={s.mlDesc}>
        Tap an edge to predict flood risk using the on-device ML model.
      </Text>
      <View style={s.btnRow}>
        {["E1", "E2", "E3", "E4", "E5", "E6", "E7"].map((e) => (
          <TouchableOpacity
            key={e}
            style={[
              s.smallBtn,
              mlResult?.edge_id === e && { borderColor: COLORS.primary },
            ]}
            onPress={() => doMLCheck(e)}
          >
            <Text style={s.smallBtnTxt}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mlLoading && (
        <View style={s.loadCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={s.loadTxt}>Running ML inference...</Text>
        </View>
      )}

      {mlResult && !mlLoading && (
        <View
          style={[
            s.mlCard,
            {
              borderColor: mlResult.high_risk ? COLORS.danger : COLORS.success,
            },
          ]}
        >
          <View style={s.mlHeader}>
            <Text style={s.mlEdge}>Edge {mlResult.edge_id}</Text>
            <View
              style={[
                s.mlBadge,
                { backgroundColor: mlResult.high_risk ? "#3D0000" : "#003D1A" },
              ]}
            >
              <Text
                style={[
                  s.mlBadgeTxt,
                  {
                    color: mlResult.high_risk ? COLORS.danger : COLORS.success,
                  },
                ]}
              >
                {mlResult.high_risk ? "⚠  HIGH RISK" : "✓  LOW RISK"}
              </Text>
            </View>
          </View>
          <Text style={s.mlPct}>
            {(mlResult.risk * 100).toFixed(1)}% flood probability
          </Text>
          <View style={s.riskBg}>
            <View
              style={[
                s.riskFill,
                {
                  width: mlResult.risk * 100 + "%",
                  backgroundColor:
                    mlResult.risk > 0.7
                      ? COLORS.danger
                      : mlResult.risk > 0.4
                        ? COLORS.warning
                        : COLORS.success,
                },
              ]}
            />
          </View>
          {mlResult.high_risk && (
            <Text style={s.mlAction}>
              → Edge weight penalized in routing graph (M7.3){"\n"}→ Drivers
              alerted to find alternate route
            </Text>
          )}
          {!mlResult.online && (
            <Text style={s.mlOffline}>📵 Offline — simulated prediction</Text>
          )}
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  bannerTxt: { fontSize: 12, fontWeight: "600" },
  btnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  smallBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallBtnTxt: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  vehicleRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8 },
  vehicleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  vehicleCardOn: { borderColor: COLORS.primary, backgroundColor: "#0A1A30" },
  vehicleIcon: { fontSize: 22, marginBottom: 4 },
  vehicleLabel: { color: COLORS.text, fontWeight: "700", fontSize: 12 },
  vehicleRule: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  nodeCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nodeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  nodeIcon: { fontSize: 22 },
  nodeName: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  nodeType: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  nodeIdBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nodeIdTxt: { fontWeight: "800", fontSize: 12 },
  loadCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadTxt: { color: COLORS.textMuted, fontSize: 13 },
  routeCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  routeLabel: { color: COLORS.textMuted, fontSize: 12 },
  routeValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },
  routeHint: { color: COLORS.danger, fontSize: 11, marginTop: 10 },
  mlDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    paddingHorizontal: 16,
    marginBottom: 10,
    lineHeight: 17,
  },
  mlCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  mlHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mlEdge: { color: COLORS.text, fontWeight: "700", fontSize: 16 },
  mlBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  mlBadgeTxt: { fontWeight: "800", fontSize: 11 },
  mlPct: { color: COLORS.textMuted, fontSize: 12, marginBottom: 6 },
  riskBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  riskFill: { height: 6, borderRadius: 3 },
  mlAction: { color: COLORS.warning, fontSize: 11, lineHeight: 18 },
  mlOffline: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 8,
    fontStyle: "italic",
  },
});
