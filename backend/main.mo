import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

actor {
  type ScanResult = {
    subdomains : [Text];
    hostingInfo : Text;
    whoisData : Text;
    dnsRecords : Text;
    sslCertDetails : Text;
    httpHeaders : Text;
    timestamp : Time.Time;
  };

  let scans = Map.empty<Principal, Map.Map<Text, ScanResult>>();

  public shared ({ caller }) func saveScan(domain : Text, subdomains : [Text], hostingInfo : Text, whoisData : Text, dnsRecords : Text, sslCertDetails : Text, httpHeaders : Text) : async () {
    let newScan : ScanResult = {
      subdomains;
      hostingInfo;
      whoisData;
      dnsRecords;
      sslCertDetails;
      httpHeaders;
      timestamp = Time.now();
    };

    let existingUserScans = switch (scans.get(caller)) {
      case (null) {
        let userScans = Map.empty<Text, ScanResult>();
        scans.add(caller, userScans);
        userScans;
      };
      case (?userScans) { userScans };
    };

    existingUserScans.add(domain, newScan);
  };

  public query ({ caller }) func getScanHistory() : async [(Text, Time.Time)] {
    switch (scans.get(caller)) {
      case (null) { Runtime.trap("No scan history found") };
      case (?userScans) {
        let history = List.empty<(Text, Time.Time)>();
        for ((domain, scanResult) in userScans.entries()) {
          history.add((domain, scanResult.timestamp));
        };
        history.toArray();
      };
    };
  };

  public query ({ caller }) func getScan(domain : Text) : async ScanResult {
    switch (scans.get(caller)) {
      case (null) { Runtime.trap("No scans found for user") };
      case (?userScans) {
        switch (userScans.get(domain)) {
          case (null) { Runtime.trap("Scan not found for domain") };
          case (?scanResult) { scanResult };
        };
      };
    };
  };
};
