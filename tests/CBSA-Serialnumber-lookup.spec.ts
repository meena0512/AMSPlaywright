/**
 * Lookup Serial Number – Bearer token auth
 * POST {CBSAlookupURL_QA}/SerialNumber
 */

import { test } from '@playwright/test';
import { CBSALookupSerialNumber } from '../src/pages/CBSALookup';
import { CBSAAuthClient } from '../src/pages/CBSAAuth';

test('CBSA Lookup SerialNumber using CBSALookupClient', async () => {
  // Auth client (reads from .env)
  const authClient = new CBSAAuthClient();

  // Lookup client (reads lookup URL, oriGroupCode, serialNumber from .env)
  const lookupClient = new CBSALookupSerialNumber();

  // Authenticate and perform lookup
  const token = await authClient.getToken();
  if (!token) {
    throw new Error('Authentication did not return a token');
  }

  const result = await lookupClient.lookupSerialNumber(token);

  // Assertions + logging
  lookupClient.assertOk(result);
});


