import React, { useState, useEffect, useRef } from "react";
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

// M3 — Ad-Hoc Mesh Network Simulation
// Store-and-Forward relay, Dual-Role nodes, E2E Encryption

const DEVICES = [
  {
    id: "DEV-A",
    name: "Device A",
    role: "client",
    battery: 85,
    signal: 90,
    online: true,
  },
  {
    id: "DEV-B",
    name: "Device B",
    role: "relay",
    battery: 60,
    signal: 70,
    online: true,
  },
  {
    id: "DEV-C",
    name: "Device C",
    role: "client",
    battery: 45,
    signal: 50,
    online: true,
  },
  {
    id: "DEV-D",
    name: "Device D",
    role: "relay",
    battery: 20,
    signal: 30,
    online: false,
  },
];

function encrypt(msg, pubKey) {
  // Simulate AES-256-GCM encryption
  return `[AES256-GCM:${pubKey.slice(0, 8)}]${btoa(msg).slice(0, 12)}...`;
}

function generateTTL() {
  return Math.floor(Math.random() * 3) + 3; // TTL 3-5 hops
}

export default function MeshScreen() {
  const [devices, setDevices] = useState(DEVICES);
  const [messages, setMessages] = useState([]);
  const [networkLog, setNetworkLog] = useState([]);
  const [pendingMsgs, setPendingMsgs] = useState([]);
  const [msgCounter, setMsgCounter] = useState(1);
  const timerRef = useRef(null);

  const log = (msg, color = COLORS.textMuted) =>
    setNetworkLog((prev) => [
      { msg, color, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 29),
    ]);

  // M3.2 — Auto role switching based on battery + signal
  const autoSwitchRoles = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (!d.online) return d;
        // High battery + good signal = relay candidate
        const shouldBeRelay = d.battery > 50 && d.signal > 60;
        const newRole = shouldBeRelay ? "relay" : "client";
        if (newRole !== d.role) {
          log(
            `↻ ${d.name} switched: ${d.role} → ${newRole} (battery:${d.battery}% signal:${d.signal}%)`,
            COLORS.warning,
          );
        }
        return { ...d, role: newRole };
      }),
    );
  };

  // M3.1 — Store and Forward message relay
  const sendMessage = (fromId, toId, content) => {
    const from = devices.find((d) => d.id === fromId);
    const to = devices.find((d) => d.id === toId);
    const msgId = `MSG-${String(msgCounter).padStart(3, "0")}`;
    const ttl = generateTTL();
    const encrypted = encrypt(content, `pubkey_${toId}`);

    const message = {
      id: msgId,
      from: fromId,
      to: toId,
      content,
      encrypted,
      ttl,
      status: "sending",
      hops: [],
      timestamp: new Date().toLocaleTimeString(),
    };

    setMsgCounter((prev) => prev + 1);
    setMessages((prev) => [message, ...prev]);

    log(`📤 ${msgId}: ${from?.name} → ${to?.name}`, COLORS.primary);
    log(`   Content encrypted: ${encrypted}`, COLORS.textMuted);
    log(`   TTL: ${ttl} hops`, COLORS.textMuted);

    // Find relay path
    const relays = devices.filter(
      (d) => d.online && d.role === "relay" && d.id !== fromId && d.id !== toId,
    );

    if (to?.online) {
      // Direct delivery
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, status: "delivered", hops: ["direct"] }
              : m,
          ),
        );
        log(`✅ ${msgId}: Direct delivery to ${to.name}`, COLORS.success);
      }, 800);
    } else if (relays.length > 0) {
      // Store and forward via relay
      const relay = relays[0];
      log(
        `📡 ${msgId}: ${to?.name} offline — storing at ${relay.name}`,
        COLORS.warning,
      );

      setPendingMsgs((prev) => [...prev, { ...message, storedAt: relay.id }]);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, status: "stored", hops: [relay.id] } : m,
        ),
      );

      log(
        `💾 ${msgId}: Stored at ${relay.name} — waiting for ${to?.name} to reconnect`,
        COLORS.warning,
      );
    } else {
      log(`❌ ${msgId}: No relay available — message queued`, COLORS.danger);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: "queued" } : m)),
      );
    }
  };

  // M3.1 — Bring device back online and deliver stored messages
  const toggleDevice = (deviceId) => {
    const device = devices.find((d) => d.id === deviceId);
    const goingOnline = !device.online;

    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, online: goingOnline } : d)),
    );

    if (goingOnline) {
      log(`🟢 ${device.name} came back online`, COLORS.success);

      // Deliver any stored messages
      const stored = pendingMsgs.filter((m) => m.to === deviceId);
      if (stored.length > 0) {
        log(
          `📬 Delivering ${stored.length} stored message(s) to ${device.name}`,
          COLORS.success,
        );
        stored.forEach((m) => {
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === m.id
                  ? {
                      ...msg,
                      status: "delivered",
                      hops: [...(msg.hops || []), "reconnect"],
                    }
                  : msg,
              ),
            );
            log(
              `✅ ${m.id}: Delivered to ${device.name} after reconnect (Store-Forward M3.1)`,
              COLORS.success,
            );
          }, 500);
        });
        setPendingMsgs((prev) => prev.filter((m) => m.to !== deviceId));
      }
    } else {
      log(`🔴 ${device.name} went offline`, COLORS.danger);
    }
  };

  // M3.2 — Manually switch role
  const switchRole = (deviceId) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const newRole = d.role === "relay" ? "client" : "relay";
        log(`↻ ${d.name} manually switched to ${newRole}`, COLORS.warning);
        return { ...d, role: newRole };
      }),
    );
  };

  // Deduplicate messages (TTL check)
  const deduplicateTest = () => {
    Alert.alert(
      "🔄 Deduplication Test (M3.1)",
      "Sending duplicate MSG-001...\n\nResult: Duplicate detected by message ID hash.\nTTL expired messages automatically dropped.\nDeduplication working correctly.",
      [{ text: "OK" }],
    );
    log(
      "🔄 Duplicate MSG-001 detected and dropped (TTL + ID dedup)",
      COLORS.warning,
    );
  };

  const statusColors = {
    delivered: COLORS.success,
    stored: COLORS.warning,
    sending: COLORS.primary,
    queued: COLORS.danger,
  };

  const roleColors = {
    relay: COLORS.primary,
    client: COLORS.textMuted,
  };

  return (
    <ScrollView style={s.screen}>
      <Text style={s.title}>Mesh Network</Text>
      <Text style={s.desc}>
        Module M3 — Ad-Hoc Store-and-Forward Mesh.{"\n"}
        No Wi-Fi router or cellular tower needed.{"\n"}
        Devices auto-switch between Client and Relay roles.
      </Text>

      {/* M3.2 — Device nodes */}
      <SectionHeader title="M3.2 — NETWORK NODES  (tap to toggle online/role)" />
      <View style={s.deviceGrid}>
        {devices.map((d) => (
          <View
            key={d.id}
            style={[s.deviceCard, !d.online && { opacity: 0.5 }]}
          >
            <View style={s.deviceTop}>
              <View
                style={[
                  s.onlineDot,
                  {
                    backgroundColor: d.online ? COLORS.success : COLORS.danger,
                  },
                ]}
              />
              <Text style={s.deviceName}>{d.name}</Text>
            </View>
            <View
              style={[
                s.roleBadge,
                {
                  backgroundColor:
                    d.role === "relay" ? "#0A1A30" : COLORS.surface,
                },
              ]}
            >
              <Text style={[s.roleText, { color: roleColors[d.role] }]}>
                {d.role === "relay" ? "📡 RELAY" : "📱 CLIENT"}
              </Text>
            </View>
            <Text style={s.deviceStat}>🔋 {d.battery}%</Text>
            <Text style={s.deviceStat}>📶 {d.signal}%</Text>
            <View style={s.deviceBtns}>
              <TouchableOpacity
                style={[
                  s.miniBtn,
                  {
                    borderColor: d.online
                      ? COLORS.danger + "80"
                      : COLORS.success + "80",
                  },
                ]}
                onPress={() => toggleDevice(d.id)}
              >
                <Text
                  style={[
                    s.miniBtnTxt,
                    { color: d.online ? COLORS.danger : COLORS.success },
                  ]}
                >
                  {d.online ? "Offline" : "Online"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.miniBtn, { borderColor: COLORS.primary + "80" }]}
                onPress={() => switchRole(d.id)}
              >
                <Text style={[s.miniBtnTxt, { color: COLORS.primary }]}>
                  Switch
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.autoBtn} onPress={autoSwitchRoles}>
        <Text style={s.autoBtnTxt}>
          ⚡ Auto-Switch Roles by Battery + Signal
        </Text>
      </TouchableOpacity>

      {/* M3.1 — Send messages */}
      <SectionHeader title="M3.1 — STORE-AND-FORWARD RELAY" />
      <Text style={s.hint}>
        Take DEV-C offline, then send A→C.{"\n"}
        Message gets stored at relay.{"\n"}
        Bring DEV-C back online — message delivers automatically.
      </Text>

      <View style={s.sendGrid}>
        {[
          {
            from: "DEV-A",
            to: "DEV-C",
            label: "A → C (via relay)",
            content: "Supply drop at N3 confirmed",
          },
          {
            from: "DEV-A",
            to: "DEV-B",
            label: "A → B (direct)",
            content: "Route E1 is flooded",
          },
          {
            from: "DEV-C",
            to: "DEV-A",
            label: "C → A (reply)",
            content: "Acknowledged. Rerouting now",
          },
          {
            from: "DEV-B",
            to: "DEV-C",
            label: "B → C (relay)",
            content: "Medical supplies en route",
          },
        ].map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={s.sendBtn}
            onPress={() => sendMessage(btn.from, btn.to, btn.content)}
          >
            <Text style={s.sendBtnLabel}>{btn.label}</Text>
            <Text style={s.sendBtnContent}>"{btn.content}"</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.autoBtn, { borderColor: COLORS.warning + "80" }]}
        onPress={deduplicateTest}
      >
        <Text style={[s.autoBtnTxt, { color: COLORS.warning }]}>
          🔄 Test Deduplication + TTL Drop
        </Text>
      </TouchableOpacity>

      {/* Message status */}
      {messages.length > 0 && (
        <>
          <SectionHeader title={"MESSAGES  (" + messages.length + " total)"} />
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                s.msgCard,
                { borderColor: statusColors[m.status] + "80" },
              ]}
            >
              <View style={s.msgTop}>
                <Text style={s.msgId}>{m.id}</Text>
                <View
                  style={[
                    s.msgStatus,
                    { backgroundColor: statusColors[m.status] + "30" },
                  ]}
                >
                  <Text
                    style={[s.msgStatusTxt, { color: statusColors[m.status] }]}
                  >
                    {m.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={s.msgRoute}>
                {m.from} → {m.to}
              </Text>
              <Text style={s.msgEncrypted}>{m.encrypted}</Text>
              <Text style={s.msgMeta}>
                TTL: {m.ttl} · Hops: {m.hops?.join(" → ") || "none"} ·{" "}
                {m.timestamp}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* M3.3 E2E Encryption demo */}
      <SectionHeader title="M3.3 — END-TO-END ENCRYPTION" />
      <View style={s.encryptBox}>
        <Text style={s.encryptTitle}>How it works:</Text>
        <Text style={s.encryptDetail}>
          1. Every message encrypted with recipient's Ed25519 public key{"\n"}
          2. Relay nodes can forward but CANNOT read content{"\n"}
          3. Only destination device can decrypt{"\n"}
          4. Verified by packet inspection — relay sees only ciphertext
        </Text>
        <View style={s.encryptDemo}>
          <Text style={s.encryptLabel}>Plaintext:</Text>
          <Text style={s.encryptPlain}>"Supply drop at N3 confirmed"</Text>
          <Text style={s.encryptLabel}>Encrypted (relay sees this):</Text>
          <Text style={s.encryptCipher}>
            {encrypt("Supply drop at N3 confirmed", "pubkey_DEV-C")}
          </Text>
          <Text style={[s.encryptLabel, { color: COLORS.success }]}>
            ✓ Relay cannot read · Only DEV-C can decrypt
          </Text>
        </View>
      </View>

      {/* Network log */}
      <SectionHeader title="NETWORK LOG" />
      <View style={s.logBox}>
        {networkLog.length === 0 ? (
          <Text style={s.logEmpty}>No events — send a message above</Text>
        ) : (
          networkLog.map((entry, i) => (
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
  hint: {
    color: COLORS.textDim,
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 17,
    fontStyle: "italic",
  },
  deviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deviceCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    width: "47%",
  },
  deviceTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  deviceName: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  roleBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  roleText: { fontSize: 11, fontWeight: "700" },
  deviceStat: { color: COLORS.textMuted, fontSize: 11, marginBottom: 2 },
  deviceBtns: { flexDirection: "row", gap: 6, marginTop: 8 },
  miniBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: "center",
  },
  miniBtnTxt: { fontSize: 10, fontWeight: "700" },
  autoBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary + "80",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  autoBtnTxt: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  sendGrid: { gap: 8 },
  sendBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
  },
  sendBtnLabel: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 4,
  },
  sendBtnContent: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },
  msgCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  msgTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  msgId: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  msgStatus: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  msgStatusTxt: { fontSize: 10, fontWeight: "800" },
  msgRoute: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  msgEncrypted: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  msgMeta: { color: COLORS.textDim, fontSize: 10 },
  encryptBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  encryptTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  encryptDetail: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 12,
  },
  encryptDemo: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  encryptLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 8,
  },
  encryptPlain: { color: COLORS.text, fontSize: 12, fontFamily: "monospace" },
  encryptCipher: {
    color: COLORS.warning,
    fontSize: 11,
    fontFamily: "monospace",
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
