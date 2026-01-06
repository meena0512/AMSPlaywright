import { expect } from '@playwright/test';

export interface AuthenticateResponse {
  success?: boolean;
  token?: string;
  expiresIn?: number;
  message?: string;
  [key: string]: unknown;
}

export class CBSAAuthClient {
  private readonly authUrl: string;
  private readonly securityKey: string;

  constructor(opts?: { authUrl?: string; securityKey?: string }) {
    this.authUrl = opts?.authUrl ?? process.env.CBSAAuthURL_QA ?? '';
    this.securityKey = opts?.securityKey ?? process.env.CBSASecuritykey_QA ?? '';

    if (!this.authUrl) throw new Error('CBSAAuthURL_QA is not set in .env (or authUrl not provided)');
    if (!this.securityKey) throw new Error('CBSASecuritykey_QA is not set in .env (or securityKey not provided)');
  }

  /**
   * Calls Authenticate endpoint (multipart/form-data) and returns parsed JSON if present.
   * If response is 2xx but empty/non-JSON, returns undefined.
   */
  async authenticate(): Promise<AuthenticateResponse | undefined> {
    const formData = new FormData();
    formData.append('securityKey', this.securityKey);

    const res = await fetch(this.authUrl, { method: 'POST', body: formData });

    const contentType = res.headers.get('content-type') ?? '';
    const raw = await res.text();

   //console.log('STATUS:', res.status, res.statusText);
   // console.log('CONTENT-TYPE:', contentType);
   // console.log('RAW BODY:', raw);

    if (!res.ok) {
      throw new Error(
        `Auth failed: ${res.status} ${res.statusText}${raw ? ` - ${raw}` : ''}`
      );
    }

    if (contentType.includes('application/json') && raw.trim().length > 0) {
      try {
        return JSON.parse(raw) as AuthenticateResponse;
      } catch {
        throw new Error(`Response said JSON but was not valid JSON. Raw body: ${raw}`);
      }
    }

    return undefined;
  }

  /**
   * Optional helper: validates expected fields when JSON is returned.
   * Call from tests if you want assertions.
   */
  assertAuthResponse(data: AuthenticateResponse | undefined): void {
    if (data === undefined) return;

    expect(data).toBeTruthy();

    if (typeof data === 'object' && data) {
      if ('success' in data) expect(Boolean((data as any).success)).toBe(true);
      if ('token' in data) expect(String((data as any).token || '')).not.toHaveLength(0);
    }
  }

  /**
   * Convenience helper if you want just the token.
   */
  async getToken(): Promise<string | undefined> {
    const data = await this.authenticate();
    const token = data && typeof data === 'object' ? (data as any).token : undefined;
    return typeof token === 'string' && token.trim() ? token : undefined;
  }
}
