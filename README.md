🌊 Digital Delta

Resilient Logistics & Mesh Triage Engine for Disaster Response
HackFusion 2026 · IEEE CS LU SB Chapter · Track: Advanced Systems & Disaster Resilience

🚨 Problem Statement
During the Bangladesh Flash Floods of 2025, over 5.2 million people were displaced within 72 hours. Relief coordination collapsed because:

📡 Cellular networks went down immediately

⚡ Power grids failed across flood zones

🛣️ Road networks were washed out

🌐 Commercial internet was completely unavailable

Existing logistics software required central servers, cloud APIs, and stable internet — making them useless during the exact moments they were needed most.

💡 Solution Overview

Digital Delta is an offline-first, decentralized disaster logistics coordination platform. It coordinates delivery of critical relief supplies across a network of volunteers, boats, drones, and field hospitals — with zero dependency on central servers or commercial internet.
Three Core Pillars

PillarDescription 

📡Offline-FirstWorks when internet is unavailable for up to 90% of operation. SQLite + CRDT sync

🔗 DecentralizedNo central server required. Peer-to-peer mesh networking

<img width="787" height="786" alt="image" src="https://github.com/user-attachments/assets/5957d432-866b-4000-8ef9-20490e2fa76f" />

Data Flow:
Phone App ──► Axios HTTP ──► FastAPI Server ──► NetworkX Graph
     │                                               │
     │◄── JSON Response ◄── Route/Triage/ML ◄────────┘
     │
     ▼
SQLite CRDT (offline fallback)
     │
     ▼
Sync when reconnected

Network Topology (Sylhet Division)

        [N2 Osmani Airport]
              │ E1 Road (20min)
[N1 Sylhet City Hub]──────────────[N5 Kanaighat Point]

        │    E2 Road (90min)          E4 Road (60min)
        │    E5 Road (120min)
        │    E6 River (150min)
        ▼
[N3 Sunamganj Camp]──E7 River──[N4 Companyganj Outpost]

        │              (50min)          │
        │                               │ E3 Road (45min)
        │                              N2
        │
[N6 Habiganj Medical]

📦 Module Breakdown

Track A — UI/UX & Frontend Design 
Sub-moduleDescriptionScoreA1Responsive dark-theme dashboard with real-time stats6ptsA2Multi-tab navigation with 7 screens6ptsA3Interactive Leaflet map with route visualization8ptsA4Status badges: OFFLINE / SYNCING / VERIFIED / CONFLICT5ptsA5Pull-to-refresh, loading states, error handling5pts


M1 — Authentication & Identity 

OTP Generation (offline):  RFC 6238 TOTP → SHA-1 HMAC → 6-digit code
Key Provisioning:          Ed25519 keypair per device
RBAC Roles:                field_volunteer, supply_manager, drone_operator,
                           camp_commander, sync_admin
Audit Trail:               SHA-256 hash-chained immutable log

Sub-moduleFeatureScoreM1.1RFC 6238 TOTP — works with zero internet3ptsM1.2Ed25519 key provisioning per device3ptsM1.35-role RBAC enforcement2ptsM1.4Hash-chained tamper-evident audit log1pt

M2 — Distributed DB & CRDT Sync (10 pts)
Algorithm:    Last-Write-Wins Register (LWW-Register)
Timestamps:   Nanosecond precision for causal ordering
Delta Sync:   Only changed records since last clock tick
Conflicts:    Detected, surfaced in UI, resolved by higher timestamp
Sub-moduleFeatureScoreM2.1CRDT data model with LWW merge4ptsM2.2Vector clocks for causal ordering3ptsM2.3Conflict detection and resolution2ptsM2.4BT/mesh sync simulation1pt

M3 — Ad-Hoc Mesh Networking (9 pts)
Protocol:     Store-and-Forward relay with TTL hop limit
Roles:        Client ↔ Relay (auto-switches by battery + signal)
Encryption:   AES-256-GCM per message, E2E only
Dedup:        Message ID hash + TTL expiry check
Sub-moduleFeatureScoreM3.1Store-and-forward with TTL and deduplication4ptsM3.2Dual-role nodes with auto Client/Relay switching3ptsM3.3AES-256-GCM end-to-end encryption2pts
Demo scenario: Take DEV-C offline → Send A→C → Stored at relay → Bring DEV-C online → Auto-delivers

M4 — Multi-Modal VRP Routing (10 pts)
Algorithm:    Dijkstra shortest path on weighted directed graph
Graph:        6 nodes, 7 edges, 3 edge types
Vehicles:     truck (roads), speedboat (rivers), drone (all)
Flood SLA:    Dynamic edge update → reroute in <2 seconds
Sub-moduleFeatureScoreM4.1NetworkX DiGraph with Dijkstra3ptsM4.2Dynamic flood → reroute in <2s4ptsM4.3Vehicle type constraints2ptsM4.4Route visible on dashboard1pt

M5 — Zero-Trust Proof of Delivery (7 pts)
QR Payload:   {delivery_id, sender_pubkey, payload_hash, nonce, timestamp}
Signature:    Ed25519 driver private key
Nonce:        Single-use, stored on first verify — replay rejected
Ledger:       CRDT chain-of-custody record per delivery
Sub-moduleFeatureScoreM5.1Signed QR handshake3ptsM5.2Single-use nonce replay protection2ptsM5.3CRDT delivery ledger chain2pts

M6 — Triage & Priority Preemption (7 pts)
Priority:   P0 (SLA 2h) > P1 (SLA 6h) > P2 (SLA 24h) > P3 (SLA 72h)
Breach:     ETA > SLA → flag as breach → trigger auto-reroute
Display:    Color-coded cards with progress bars, SLA countdowns
Sub-moduleFeatureScoreM6.1P0/P1/P2/P3 taxonomy2ptsM6.2SLA breach prediction3ptsM6.3Auto-reroute on breach2pts

M7 — Predictive Route Decay (ML) (9 pts)
Model:      GradientBoostingClassifier (scikit-learn)
Training:   2000 synthetic flood samples, 80/20 split
Features:   rainfall, rate, elevation, soil_saturation,
            hours_since_rain, road_type
Output:     P(flood) per edge → >70% triggers weight penalty
Metrics:    F1=0.341, Precision=0.636
Sub-moduleFeatureScoreM7.16-feature engineering2ptsM7.2GBM classifier + metrics3ptsM7.3Proactive routing integration3ptsM7.4Risk visualization in app1pt

M8 — Hybrid Fleet & Drone Handoff (9 pts)
Reachability:   Haversine distance from drone base (15km range)
Rendezvous:     Minimize(max(boat_ETA, drone_ETA) + last_mile_time)
Handoff:        PoD receipt generated at meeting point
Battery:        <30% → 60% reduction, stationary → 80% reduction
Sub-moduleFeatureScoreM8.1Reachability classification2ptsM8.2Optimal rendezvous computation3ptsM8.3Handoff protocol with PoD2ptsM8.4Battery-aware mesh throttle2pts

🛠️ Tech Stack
LayerTechnologyPurposeMobile FrontendReact Native + ExpoCross-platform appNavigationReact Navigation v6Bottom tab navigationHTTP ClientAxiosAPI communicationMapLeaflet.js + WebViewInteractive route mapBackendFastAPI (Python)REST API serverGraph EngineNetworkXDijkstra VRP routingMLscikit-learnRoute decay predictionDatabaseSQLite (via CRDT)Offline-first storageCryptoEd25519 + SHA-256Auth & signaturesOTPRFC 6238 TOTPOffline authentication

👥 Team
BroCode — Leading University, Bangladesh

Members

             Leader - Touhidul Islam Saief
             Team Member - Shimul Saha
                           Sukman Islam Chowdhury


