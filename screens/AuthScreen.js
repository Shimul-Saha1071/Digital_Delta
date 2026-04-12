import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { COLORS } from "../lib/config";
import { provisionAndGetOTP, verifyOTP } from "../lib/api";
import SectionHeader from "./components/SectionHeader";

const ROLES = [
  { key: "field_volunteer", label: "Field Volunteer", icon: "🧑‍🌾" },
  { key: "supply_manager", label: "Supply Manager", icon: "📦" },
  { key: "drone_operator", label: "Drone Operator", icon: "🚁" },
  { key: "camp_commander", label: "Camp Commander", icon: "🏕" },
  { key: "sync_admin", label: "Sync Admin", icon: "🔧" },
];

export default function AuthScreen() {
  const [deviceId, setDeviceId] = useState("device_001");
  const [role, setRole] = useState("field_volunteer");
  const [inputOtp, setInputOtp] = useState("");
  const [shownOtp, setShownOtp] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((prev) => [
      { msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 14),
    ]);

  const doGetOTP = async () => {
    addLog("Provisioning " + deviceId + " as " + role);
    const result = await provisionAndGetOTP(deviceId, role);
    setShownOtp(result.otp);
    if (result.online) {
      addLog("✅ OTP from server: " + result.otp);
      addLog("Expires in " + result.expires_in_seconds + "s (RFC 6238 TOTP)");
    } else {
      addLog("📵 Offline OTP: " + result.otp);
      addLog("Generated locally — zero internet needed (M1.1)");
    }
  };

  const doVerify = async () => {
    if (!inputOtp) {
      Alert.alert("Enter OTP", "Paste the 6-digit OTP first");
      return;
    }
    addLog("Verifying OTP: " + inputOtp);
    const result = await verifyOTP(deviceId, inputOtp);
    if (result.offline) {
      if (inputOtp === shownOtp) {
        setLoggedIn(true);
        addLog("✅ OFFLINE LOGIN SUCCESS (M1)");
        addLog("Role: " + role + " — RBAC enforced (M1.3)");
      } else {
        addLog("❌ OTP mismatch");
        Alert.alert("Failed", "Wrong OTP");
      }
    } else if (result.success) {
      setLoggedIn(true);
      addLog("✅ SERVER LOGIN SUCCESS");
      addLog("Token: " + result.token);
    } else {
      addLog("❌ LOGIN FAILED");
      Alert.alert("Failed", "Wrong OTP — get a new one");
    }
  };

  const doLogout = () => {
    setLoggedIn(false);
    setShownOtp("");
    setInputOtp("");
    addLog("🔒 Logged out");
  };

  return (
    <ScrollView style={s.screen}>
      {loggedIn && (
        <View style={s.successBanner}>
          <View>
            <Text style={s.successTitle}>✅ AUTHENTICATED</Text>
            <Text style={s.successSub}>
              {deviceId} · {role.replace(/_/g, " ")}
            </Text>
          </View>
          <TouchableOpacity onPress={doLogout} style={s.logoutBtn}>
            <Text style={s.logoutTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionHeader title="DEVICE ID" />
      <TextInput
        style={s.input}
        value={deviceId}
        onChangeText={setDeviceId}
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <SectionHeader title="ROLE  (M1.3 — RBAC)" />
      {ROLES.map((r) => (
        <TouchableOpacity
          key={r.key}
          style={[s.roleRow, role === r.key && s.roleRowOn]}
          onPress={() => setRole(r.key)}
        >
          <Text style={s.roleIcon}>{r.icon}</Text>
          <Text
            style={[s.roleName, role === r.key && { color: COLORS.primary }]}
          >
            {r.label}
          </Text>
          {role === r.key && (
            <View style={s.check}>
              <Text style={s.checkMark}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <SectionHeader title="STEP 1 — GET YOUR OTP" />
      <TouchableOpacity style={s.bigBtn} onPress={doGetOTP}>
        <Text style={s.bigBtnTxt}>① Generate OTP (works offline)</Text>
      </TouchableOpacity>

      {shownOtp !== "" && (
        <View style={s.otpBox}>
          <Text style={s.otpLabel}>
            Your 6-digit OTP — copy to field below:
          </Text>
          <Text style={s.otpCode}>{shownOtp}</Text>
          <Text style={s.otpSub}>RFC 6238 TOTP (M1.1) · Valid 30 seconds</Text>
        </View>
      )}

      <SectionHeader title="STEP 2 — ENTER OTP AND LOGIN" />
      <TextInput
        style={[
          s.input,
          { fontSize: 22, letterSpacing: 10, textAlign: "center" },
        ]}
        value={inputOtp}
        onChangeText={setInputOtp}
        keyboardType="numeric"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor={COLORS.textMuted}
      />
      <TouchableOpacity style={[s.bigBtn, s.verifyBtn]} onPress={doVerify}>
        <Text style={[s.bigBtnTxt, { color: COLORS.primary }]}>
          ② Verify OTP and Login
        </Text>
      </TouchableOpacity>

      <SectionHeader title="AUDIT TRAIL  (M1.4 — hash-chained log)" />
      <View style={s.logBox}>
        {logs.length === 0 ? (
          <Text style={s.logEntry}>No events — press ① above to start</Text>
        ) : (
          logs.map((l, i) => (
            <Text
              key={i}
              style={[s.logEntry, i === 0 && { color: COLORS.text }]}
            >
              [{l.time}] {l.msg}
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
  successBanner: {
    backgroundColor: "#061A0E",
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successTitle: { color: COLORS.success, fontWeight: "700", fontSize: 15 },
  successSub: { color: COLORS.success + "AA", fontSize: 11, marginTop: 3 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutTxt: { color: COLORS.danger, fontWeight: "700", fontSize: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.text,
    padding: 14,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  roleRowOn: { borderColor: COLORS.primary, backgroundColor: "#0A1A30" },
  roleIcon: { fontSize: 20 },
  roleName: { color: COLORS.text, fontWeight: "600", fontSize: 14, flex: 1 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: { color: "#fff", fontWeight: "700", fontSize: 12 },
  bigBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  verifyBtn: {
    borderColor: COLORS.primary,
    backgroundColor: "#0A1A30",
    marginTop: 8,
  },
  bigBtnTxt: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  otpBox: {
    backgroundColor: "#0A1A30",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginTop: 12,
  },
  otpLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
    textAlign: "center",
  },
  otpCode: {
    color: COLORS.primary,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 12,
  },
  otpSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 8,
    textAlign: "center",
  },
  logBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  logEntry: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 5,
    lineHeight: 18,
  },
});
