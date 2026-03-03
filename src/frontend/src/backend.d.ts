import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ScanResult {
    httpHeaders: string;
    subdomains: Array<string>;
    sslCertDetails: string;
    dnsRecords: string;
    timestamp: Time;
    whoisData: string;
    hostingInfo: string;
}
export type Time = bigint;
export interface backendInterface {
    getScan(domain: string): Promise<ScanResult>;
    getScanHistory(): Promise<Array<[string, Time]>>;
    saveScan(domain: string, subdomains: Array<string>, hostingInfo: string, whoisData: string, dnsRecords: string, sslCertDetails: string, httpHeaders: string): Promise<void>;
}
