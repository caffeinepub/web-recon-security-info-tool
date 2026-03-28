# Web Recon & Security Info Tool

## Current State
The app has 5 tabs: CVE Lookup, Domain Recon, Intel Fetch, WHOIS, and OWASP Checker. It performs passive OSINT, CVE searches via NVD, IP/domain intel via ip-api/Shodan/AlienVault OTX, WHOIS lookups, and OWASP security header/SSL/DNS analysis. All checks are frontend-only using public APIs.

## Requested Changes (Diff)

### Add
- **DDoS Attack Format Analyzer tab** ("DDoS Analysis"): A security testing panel for authorized use that:
  - Accepts a target URL/IP and lets the user select an attack vector category (Volumetric, Protocol, Application Layer)
  - Displays the attack profile: vector type, protocol used, packet structure/format description, rate limit thresholds, and mitigation recommendations
  - Includes a "Bridge Analysis" section that analyzes network path resilience (simulated based on IP geolocation data) and shows single points of failure
  - Shows a payload format inspector: HTTP flood format, UDP flood format, SYN flood format (text/hex representation -- educational display only)
  - All analysis is client-side simulation + pattern display. No actual traffic is generated.
  - Quick-select presets: HTTP Flood, UDP Flood, SYN Flood, DNS Amplification, Slowloris, ICMP Flood

- **Brute Force Security Testing tab** ("Brute Force"): A security testing analysis panel for authorized use that:
  - Accepts a target URL and lets the user select attack type: HTTP Basic Auth, Form Login, SSH, FTP, API Key
  - Shows the brute force profile: estimated time to crack (based on charset + length), password strength analysis, common wordlist patterns used (rockyou, seclist)
  - Includes a "Password Policy Analyzer": enter a sample password to get entropy, crack time estimate, character set analysis
  - Shows sample payload formats for each attack type (curl commands, tool syntax -- educational display)
  - Displays rate limiting and lockout recommendations
  - Has a wordlist preview panel (top 20 common passwords from public known lists)
  - Quick presets: Weak Passwords, Common Credentials, Default Credentials

### Modify
- App.tsx: Add two new tab triggers ("DDoS Analysis", "Brute Force") and their corresponding TabsContent sections
- Import new components: DDoSAnalyzer, BruteForceAnalyzer

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/DDoSAnalyzer.tsx` - full DDoS attack format and bridge analysis panel
2. Create `src/frontend/src/components/BruteForceAnalyzer.tsx` - brute force testing profile and password analysis panel
3. Update `App.tsx` to add two new tab triggers and tab content sections with appropriate icons (Waves/Zap for DDoS, Key/Lock for BruteForce)
4. Both components are self-contained with no backend calls -- all logic is client-side simulation/calculation
