# CVE Research & Vulnerability Intelligence Dashboard

## Current State

The existing app is a Web Recon & Security Info Tool that:
- Saves domain scan results (subdomains, WHOIS, DNS, SSL, HTTP headers) per user
- Has a backend with `saveScan`, `getScanHistory`, `getScan` functions
- Has a frontend that accepts a domain/URL and displays recon data

## Requested Changes (Diff)

### Add
- Domain/software input field for CVE lookup
- CVE search by domain fingerprint (tech stack detection via HTTP headers) + software name + version
- Integration with public NVD (National Vulnerability Database) API via HTTP outcalls
- CVE result cards showing: CVE ID, CVSS score, severity badge, description, published date, known exploit indicator
- Link to NVD reference page and exploit-db entries per CVE
- Backend function to store CVE lookup history per user (domain + results + timestamp)
- Severity filter tabs (Critical, High, Medium, Low, All)
- Summary stats bar (total CVEs found, critical count, high count)

### Modify
- Backend: extend existing data model to also store CVE lookup results alongside recon data
- Backend: add HTTP outcall to NVD CVE API (https://services.nvd.nist.gov/rest/json/cves/2.0)
- Frontend: replace or augment existing recon UI with CVE intelligence dashboard as primary feature

### Remove
- Nothing removed; recon features remain as secondary tab

## Implementation Plan

1. Update backend `main.mo`:
   - Add `CveEntry` and `CveLookupResult` types
   - Add `saveCveLookup(domain, software, version, cves)` function
   - Add `getCveLookupHistory()` query function
   - Add `fetchCves(software, version)` HTTP outcall to NVD API
   - Add `detectTechStack(domain)` HTTP outcall to fetch HTTP headers from target domain

2. Frontend changes:
   - Main page: domain input + "Analyze" button
   - Two tabs: "CVE Intelligence" (primary) and "Recon Info" (secondary)
   - CVE Intelligence tab:
     - Software/version auto-detected or manually entered
     - Severity filter tabs (All / Critical / High / Medium / Low)
     - Stats bar: total, critical, high counts
     - CVE result cards: ID, CVSS score, severity badge (color-coded), description, published date, exploit indicator, NVD link, exploit-db link
   - Loading states, error states, empty states
   - Lookup history sidebar or section

3. Design: dark/security-tool aesthetic, monospace elements for CVE IDs and technical data
