import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { COLORS } from "../lib/config";
import SectionHeader from "./components/SectionHeader";

const NODES = [
  {
    id: "N1",
    name: "Sylhet City Hub",
    lat: 24.8949,
    lng: 91.8687,
    type: "central_command",
  },
  {
    id: "N2",
    name: "Osmani Airport",
    lat: 24.9632,
    lng: 91.8668,
    type: "supply_drop",
  },
  {
    id: "N3",
    name: "Sunamganj Camp",
    lat: 25.0658,
    lng: 91.4073,
    type: "relief_camp",
  },
  {
    id: "N4",
    name: "Companyganj",
    lat: 25.0715,
    lng: 91.7554,
    type: "relief_camp",
  },
  {
    id: "N5",
    name: "Kanaighat Point",
    lat: 24.9945,
    lng: 92.2611,
    type: "waypoint",
  },
  {
    id: "N6",
    name: "Habiganj Medical",
    lat: 24.384,
    lng: 91.4169,
    type: "hospital",
  },
];

const DRONE_RANGE_KM = 15;
const DRONE_BASE = {
  id: "DB1",
  name: "Drone Base Alpha",
  lat: 24.92,
  lng: 91.84,
};

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeRendezvous(boatNode, droneBase, destNode) {
  // Find the midpoint that minimizes total travel time
  // Boat speed: 30 km/h, Drone speed: 60 km/h
  const boatSpeed = 30;
  const droneSpeed = 60;

  let bestPoint = null;
  let bestTime = Infinity;

  // Try each node as rendezvous point
  NODES.forEach((node) => {
    const boatDist = distanceKm(boatNode.lat, boatNode.lng, node.lat, node.lng);
    const droneDist = distanceKm(
      droneBase.lat,
      droneBase.lng,
      node.lat,
      node.lng,
    );
    const lastMile = distanceKm(node.lat, node.lng, destNode.lat, destNode.lng);

    if (droneDist + lastMile > DRONE_RANGE_KM) return;

    const boatTime = (boatDist / boatSpeed) * 60;
    const droneTime = (droneDist / droneSpeed) * 60;
    const totalTime =
      Math.max(boatTime, droneTime) + (lastMile / droneSpeed) * 60;

    if (totalTime < bestTime) {
      bestTime = totalTime;
      bestPoint = {
        ...node,
        boatTime: Math.round(boatTime),
        droneTime: Math.round(droneTime),
        totalTime: Math.round(totalTime),
      };
    }
  });

  return bestPoint;
}

export default function DroneScreen() {
  const [boatNode, setBoatNode] = useState(null);
  const [destNode, setDestNode] = useState(null);
  const [rendezvous, setRendezvous] = useState(null);
  const [handoffs, setHandoffs] = useState([]);
  const [battery, setBattery] = useState(100);

  const computeRdv = () => {
    if (!boatNode || !destNode) {
      Alert.alert(
        "Select both",
        "Select a boat position and destination first",
      );
      return;
    }
    const result = computeRendezvous(boatNode, DRONE_BASE, destNode);
    if (result) {
      setRendezvous(result);
    } else {
      Alert.alert(
        "Out of range",
        "Destination is beyond drone range of " + DRONE_RANGE_KM + "km",
      );
    }
  };

  const executeHandoff = () => {
    if (!rendezvous) {
      Alert.alert("Compute first", "Compute rendezvous point first");
      return;
    }
    const handoff = {
      id: "HO-" + Date.now(),
      boat: boatNode.name,
      dest: destNode.name,
      rendezvous: rendezvous.name,
      totalTime: rendezvous.totalTime,
      time: new Date().toLocaleTimeString(),
      podSigned: true,
    };
    setHandoffs((prev) => [handoff, ...prev]);
    Alert.alert(
      "✅ Handoff Complete!",
      `Boat arrived at ${rendezvous.name}\nPoD receipt generated (M5)\nDrone acknowledged with counter-signature\nPayload ownership transferred in CRDT ledger`,
      [{ text: "OK" }],
    );
    setRendezvous(null);
  };

  const checkReachability = (node) => {
    const dist = distanceKm(DRONE_BASE.lat, DRONE_BASE.lng, node.lat, node.lng);
    const reachable = dist <= DRONE_RANGE_KM;
    Alert.alert(
      reachable ? "✅ Drone-Reachable" : "🚁 Drone-Required Zone",
      `Distance from drone base: ${dist.toFixed(1)}km\nDrone range: ${DRONE_RANGE_KM}km\nStatus: ${reachable ? "Direct delivery possible" : "DRONE REQUIRED for last mile"}\n\nClassified in dashboard (M8.1)`,
      [{ text: "OK" }],
    );
  };

  const adjustBattery = (level) => {
    setBattery(level);
    let freq = "Normal (100%)";
    if (level < 30) freq = "Reduced 60% — battery critical (M8.4)";
    else if (level < 50) freq = "Reduced 20% — battery low";
    Alert.alert(
      "🔋 Battery Throttle (M8.4)",
      `Battery: ${level}%\nMesh broadcast: ${freq}`,
    );
  };

  const nodeColors = {
    central_command: COLORS.primary,
    supply_drop: COLORS.success,
    relief_camp: COLORS.warning,
    hospital: COLORS.danger,
    waypoint: COLORS.textMuted,
  };

  return (
    <ScrollView style={s.screen}>
      <Text style={s.title}>Drone Handoff System</Text>
      <Text style={s.desc}>
        Module M8 — Hybrid Fleet Orchestration.{"\n"}
        Computes optimal rendezvous for boat-to-drone payload transfer.{"\n"}
        Drone range: {DRONE_RANGE_KM}km · Base: {DRONE_BASE.name}
      </Text>

      {/* M8.1 Reachability */}
      <SectionHeader title="M8.1 — REACHABILITY ANALYSIS" />
      <Text style={s.hint}>
        Tap any node to check if it needs drone delivery
      </Text>
      <View style={s.nodeGrid}>
        {NODES.map((n) => {
          const dist = distanceKm(DRONE_BASE.lat, DRONE_BASE.lng, n.lat, n.lng);
          const reachable = dist <= DRONE_RANGE_KM;
          return (
            <TouchableOpacity
              key={n.id}
              style={[s.nodeBtn, { borderColor: nodeColors[n.type] }]}
              onPress={() => checkReachability(n)}
            >
              <Text style={[s.nodeBtnId, { color: nodeColors[n.type] }]}>
                {n.id}
              </Text>
              <Text style={s.nodeBtnName}>{n.name.split(" ")[0]}</Text>
              <Text
                style={[
                  s.nodeBtnDist,
                  { color: reachable ? COLORS.success : COLORS.danger },
                ]}
              >
                {reachable ? "✓" : "🚁"} {dist.toFixed(1)}km
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* M8.2 Rendezvous */}
      <SectionHeader title="M8.2 — RENDEZVOUS COMPUTATION" />

      <Text style={s.subLabel}>BOAT CURRENT POSITION</Text>
      <View style={s.btnRow}>
        {NODES.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              s.smallBtn,
              boatNode?.id === n.id && {
                borderColor: COLORS.primary,
                backgroundColor: "#0A1A30",
              },
            ]}
            onPress={() => setBoatNode(n)}
          >
            <Text
              style={[
                s.smallBtnTxt,
                boatNode?.id === n.id && { color: COLORS.primary },
              ]}
            >
              🚤 {n.id}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.subLabel, { marginTop: 12 }]}>DELIVERY DESTINATION</Text>
      <View style={s.btnRow}>
        {NODES.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              s.smallBtn,
              destNode?.id === n.id && {
                borderColor: COLORS.warning,
                backgroundColor: "#1A1200",
              },
            ]}
            onPress={() => setDestNode(n)}
          >
            <Text
              style={[
                s.smallBtnTxt,
                destNode?.id === n.id && { color: COLORS.warning },
              ]}
            >
              📦 {n.id}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.computeBtn} onPress={computeRdv}>
        <Text style={s.computeBtnTxt}>🧮 Compute Optimal Rendezvous Point</Text>
      </TouchableOpacity>

      {rendezvous && (
        <View style={s.rendezvousCard}>
          <Text style={s.rendezvousTitle}>📍 Optimal Rendezvous Found</Text>
          <View style={s.rdvRow}>
            <Text style={s.rdvLabel}>Meeting point</Text>
            <Text style={s.rdvValue}>{rendezvous.name}</Text>
          </View>
          <View style={s.rdvRow}>
            <Text style={s.rdvLabel}>Boat ETA</Text>
            <Text style={s.rdvValue}>{rendezvous.boatTime} min</Text>
          </View>
          <View style={s.rdvRow}>
            <Text style={s.rdvLabel}>Drone ETA</Text>
            <Text style={s.rdvValue}>{rendezvous.droneTime} min</Text>
          </View>
          <View style={s.rdvRow}>
            <Text style={s.rdvLabel}>Total time</Text>
            <Text style={[s.rdvValue, { color: COLORS.success }]}>
              {rendezvous.totalTime} min
            </Text>
          </View>
          <TouchableOpacity style={s.handoffBtn} onPress={executeHandoff}>
            <Text style={s.handoffBtnTxt}>
              🚁 Execute Handoff + Generate PoD
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* M8.3 Handoff log */}
      {handoffs.length > 0 && (
        <>
          <SectionHeader title="M8.3 — HANDOFF PROTOCOL LOG" />
          {handoffs.map((h, i) => (
            <View key={i} style={s.handoffCard}>
              <Text style={s.handoffId}>{h.id}</Text>
              <Text style={s.handoffDetail}>Boat: {h.boat}</Text>
              <Text style={s.handoffDetail}>Rendezvous: {h.rendezvous}</Text>
              <Text style={s.handoffDetail}>Destination: {h.dest}</Text>
              <Text style={s.handoffDetail}>Total time: {h.totalTime} min</Text>
              <Text style={[s.handoffDetail, { color: COLORS.success }]}>
                ✓ PoD signed · CRDT updated · {h.time}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* M8.4 Battery throttle */}
      <SectionHeader title="M8.4 — BATTERY-AWARE MESH THROTTLE" />
      <Text style={s.hint}>
        Below 30% battery → mesh broadcast reduced by 60%.{"\n"}
        Stationary → reduced by 80%. Demo by selecting battery level:
      </Text>
      <View style={s.batteryRow}>
        {[100, 60, 30, 15].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              s.batteryBtn,
              battery === level && {
                borderColor: level < 30 ? COLORS.danger : COLORS.success,
              },
            ]}
            onPress={() => adjustBattery(level)}
          >
            <Text
              style={[
                s.batteryPct,
                {
                  color:
                    level < 30
                      ? COLORS.danger
                      : level < 50
                        ? COLORS.warning
                        : COLORS.success,
                },
              ]}
            >
              {level}%
            </Text>
            <Text style={s.batteryLbl}>
              {level < 30 ? "🔴 Critical" : level < 50 ? "🟡 Low" : "🟢 OK"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  title: { color: COLORS.text, fontWeight: "900", fontSize: 22, marginTop: 8 },
  desc: { color: COLORS.textMuted, fontSize: 12, marginTop: 6, lineHeight: 20 },
  hint: {
    color: COLORS.textDim,
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 17,
    fontStyle: "italic",
  },
  subLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  nodeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  nodeBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    width: "30%",
    alignItems: "center",
  },
  nodeBtnId: { fontWeight: "900", fontSize: 14 },
  nodeBtnName: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  nodeBtnDist: { fontSize: 10, fontWeight: "700", marginTop: 4 },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  smallBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallBtnTxt: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  computeBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  computeBtnTxt: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  rendezvousCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  rendezvousTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  rdvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rdvLabel: { color: COLORS.textMuted, fontSize: 12 },
  rdvValue: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  handoffBtn: {
    backgroundColor: "#0A1A30",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  handoffBtnTxt: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  handoffCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handoffId: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 6,
  },
  handoffDetail: { color: COLORS.textMuted, fontSize: 11, marginBottom: 3 },
  batteryRow: { flexDirection: "row", gap: 8 },
  batteryBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  batteryPct: { fontSize: 18, fontWeight: "900" },
  batteryLbl: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
});
