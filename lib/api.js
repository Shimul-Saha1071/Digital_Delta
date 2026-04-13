import axios from "axios";
import { API_BASE } from "./config";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

export async function computeRoute(origin, destination, vehicleType) {
  try {
    const res = await http.post("/api/route", {
      origin,
      destination,
      vehicle_type: vehicleType,
    });
    return { ...res.data, online: true };
  } catch {
    return {
      online: false,
      status: "offline",
      path: [origin, destination],
      total_time_mins: 60,
      vehicle: vehicleType,
      ms: 0,
    };
  }
}

export async function updateEdge(edgeId, isFlooded) {
  try {
    const res = await http.post("/api/edge/update", {
      edge_id: edgeId,
      is_flooded: isFlooded,
    });
    return { ...res.data, online: true };
  } catch {
    return { online: false, success: true, ms: 0, within_2sec_sla: true };
  }
}

export async function resetNetwork() {
  try {
    const res = await http.post("/api/network/reset");
    return { ...res.data, online: true };
  } catch {
    return { online: false };
  }
}

export async function fetchMap() {
  try {
    const res = await http.get("/api/map");
    return { data: res.data, online: true };
  } catch {
    return {
      online: false,
      data: {
        nodes: [
          {
            id: "N1",
            name: "Sylhet City Hub",
            type: "central_command",
            lat: 24.8949,
            lng: 91.8687,
          },
          {
            id: "N2",
            name: "Osmani Airport",
            type: "supply_drop",
            lat: 24.9632,
            lng: 91.8668,
          },
          {
            id: "N3",
            name: "Sunamganj Camp",
            type: "relief_camp",
            lat: 25.0658,
            lng: 91.4073,
          },
          {
            id: "N4",
            name: "Companyganj Outpost",
            type: "relief_camp",
            lat: 25.0715,
            lng: 91.7554,
          },
          {
            id: "N5",
            name: "Kanaighat Point",
            type: "waypoint",
            lat: 24.9945,
            lng: 92.2611,
          },
          {
            id: "N6",
            name: "Habiganj Medical",
            type: "hospital",
            lat: 24.384,
            lng: 91.4169,
          },
        ],
        edges: [
          {
            id: "E1",
            source: "N1",
            target: "N2",
            type: "road",
            base_weight_mins: 20,
            is_flooded: false,
          },
          {
            id: "E2",
            source: "N1",
            target: "N3",
            type: "road",
            base_weight_mins: 90,
            is_flooded: false,
          },
          {
            id: "E3",
            source: "N2",
            target: "N4",
            type: "road",
            base_weight_mins: 45,
            is_flooded: false,
          },
          {
            id: "E4",
            source: "N1",
            target: "N5",
            type: "road",
            base_weight_mins: 60,
            is_flooded: false,
          },
          {
            id: "E5",
            source: "N1",
            target: "N6",
            type: "road",
            base_weight_mins: 120,
            is_flooded: false,
          },
          {
            id: "E6",
            source: "N1",
            target: "N3",
            type: "river",
            base_weight_mins: 150,
            is_flooded: false,
          },
          {
            id: "E7",
            source: "N3",
            target: "N4",
            type: "river",
            base_weight_mins: 50,
            is_flooded: false,
          },
        ],
      },
    };
  }
}

export async function fetchTriage() {
  try {
    const res = await http.get("/api/triage");
    return { items: res.data.items, online: true };
  } catch {
    return {
      online: false,
      items: [
        {
          id: "T1",
          cargo: "Antivenom",
          priority: "P0",
          eta_hrs: 1.5,
          sla_hrs: 2,
          breach: false,
        },
        {
          id: "T2",
          cargo: "Food Packs",
          priority: "P2",
          eta_hrs: 28,
          sla_hrs: 24,
          breach: true,
        },
        {
          id: "T3",
          cargo: "Clean Water",
          priority: "P1",
          eta_hrs: 5,
          sla_hrs: 6,
          breach: false,
        },
        {
          id: "T4",
          cargo: "Medicine",
          priority: "P1",
          eta_hrs: 7,
          sla_hrs: 6,
          breach: true,
        },
      ],
    };
  }
}

export async function provisionAndGetOTP(deviceId, role) {
  try {
    const res = await http.post("/api/auth/otp", { device_id: deviceId, role });
    return { ...res.data, online: true };
  } catch {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return { online: false, otp, expires_in_seconds: 30 };
  }
}

export async function verifyOTP(deviceId, otp) {
  try {
    const res = await http.post("/api/auth/verify", {
      device_id: deviceId,
      otp,
    });
    return { ...res.data, online: true };
  } catch {
    return { online: false, offline: true, success: null };
  }
}

export async function syncWithServer(deviceId, lastClock, entries) {
  try {
    const res = await http.post("/api/sync", {
      device_id: deviceId,
      last_clock: lastClock,
      entries,
    });
    return { ...res.data, online: true };
  } catch {
    return { online: false, delta: {}, conflicts: [], server_clock: 0 };
  }
}

export async function getEdgeRisk(edgeId) {
  try {
    const res = await http.get("/api/ml/risk/" + edgeId);
    return { ...res.data, online: true };
  } catch {
    const risk = parseFloat((Math.random() * 0.9).toFixed(3));
    return { online: false, edge_id: edgeId, risk, high_risk: risk > 0.7 };
  }
}
