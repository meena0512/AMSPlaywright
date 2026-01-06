/**
 * Lookup Serial Number – Bearer token auth
 * POST {CBSAlookupURL_QA}/SerialNumber
 */

import { expect } from '@playwright/test';
import { CBSAAuthClient } from './CBSAAuth';

/** ===== Request format ===== */
export interface SerialNumberLookupRequest {
  oriGroupCode: string;
  serialNumber: string;
}

/** ===== Response format ===== */
export interface SerialNumberLookupResponse {
  id?: number;
  lenderContactInfos?: unknown;
  messages?: unknown;
  noExport?: boolean;
  oriGroupCode?: string;
  registrationInformation?: unknown;
  resultFound?: boolean;
  serialNumber?: string;
  [key: string]: unknown;
}

/** ===== Result wrapper ===== */
export interface SerialNumberLookupResult {
  status: number;
  body: SerialNumberLookupResponse;
}

export class CBSALookupSerialNumber{
  private readonly lookupUrl: string;
  private readonly oriGroupCode: string;
  private readonly serialNumber: string;

  constructor(opts?: {
    lookupBaseUrl?: string;
    oriGroupCode?: string;
    serialNumber?: string;
  }) {
    const baseUrl = opts?.lookupBaseUrl ?? process.env.CBSAlookupURL_QA ?? '';
    this.oriGroupCode = opts?.oriGroupCode ?? process.env.CBSALookupOriGroupCode ?? '';
    this.serialNumber = opts?.serialNumber ?? process.env.CBSALookupSerialNumber ?? '';

    if (!baseUrl) throw new Error('CBSAlookupURL_QA is not set in .env (or lookupBaseUrl not provided)');
    if (!this.oriGroupCode) throw new Error('CBSALookupOriGroupCode is not set in .env (or oriGroupCode not provided)');
    if (!this.serialNumber) throw new Error('CBSALookupSerialNumber is not set in .env (or serialNumber not provided)');

    this.lookupUrl = `${baseUrl}/SerialNumber`;
  }

  /** Calls lookup API using provided bearer token */
  async lookupSerialNumber(token: string, payload?: Partial<SerialNumberLookupRequest>): Promise<SerialNumberLookupResult> {
    if (!token) throw new Error('Bearer token is required');

    const requestBody: SerialNumberLookupRequest = {
      oriGroupCode: payload?.oriGroupCode ?? this.oriGroupCode,
      serialNumber: payload?.serialNumber ?? this.serialNumber,
    };

    const response = await fetch(this.lookupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const status = response.status;
    const raw = await response.text().catch(() => '');

    if (!response.ok) {
      throw new Error(
        `Lookup failed: ${status} ${response.statusText}${raw ? ` - ${raw}` : ''}`
      );
    }

    const body: SerialNumberLookupResponse = raw ? JSON.parse(raw) : {};
    return { status, body };
  }

  /** Convenience: authenticates + lookup in one call */
  async lookupWithAuth(authClient?: CBSAAuthClient): Promise<SerialNumberLookupResult> {
    const client = authClient ?? new CBSAAuthClient();
    const token = await client.getToken();
    if (!token) throw new Error('Authentication did not return a token');

    return this.lookupSerialNumber(token);
  }

  /** Optional helper for assertions in tests */
  assertOk(result: SerialNumberLookupResult): void {
    console.log('HTTP STATUS:', result.status);
    console.log('LOOKUP RESPONSE JSON:');
    console.log(JSON.stringify(result.body, null, 2));

    expect(result.status).toBeGreaterThanOrEqual(200);
    expect(result.status).toBeLessThan(300);
    expect(result.body).toBeTruthy();
  }
}
