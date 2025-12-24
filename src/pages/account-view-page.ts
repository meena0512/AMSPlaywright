import type { Page } from '@playwright/test';

/**
 * AccountViewPage - Page Object for AMS Account View validation
 */
export class AccountViewPage {
  // XPath selectors for Confirmed Move history fields
  static AV_History_ConfirmedMove_Status = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Confirmed Moves")]/following::*[@id="Status"])[1]';
  static AV_History_ConfirmedMove_MVR = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Confirmed Moves")]/following::*[@id="MVR"])[1]';
  static AV_History_ConfirmedMove_NCOA = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Confirmed Moves")]/following::*[@id="NCOA"])[1]';
  static AV_History_ConfirmedMove_PCOA = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Confirmed Moves")]/following::*[@id="PCOA"])[1]';
  static AV_ConfirmedMove_Comment = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Confirmed Moves")]/following::*[@id="Comment"])[1]';

  // XPath selectors for DNS (Daily Monitoring) history fields
  static AV_History_DNS_Status = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Daily Monitoring")]/following::*[@id="Status"])[1]';
  static AV_History_DNS_Comment = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Daily Monitoring")]/following::*[@id="Comment"])[1]';
  static AV_History_DNS_Stolen = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Daily Monitoring")]/following::*[@id="Stolen"])';
  static AV_History_DNS_Impound = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Daily Monitoring")]/following::*[@id="Impound"])';
  static AV_History_DNS_Salvage = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Daily Monitoring")]/following::*[@id="Salvage"])';
  static AV_History_DNS_Ebay = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Daily Monitoring")]/following::*[@id="Ebay"])';
  static AV_History_DNS_Other = '(//mat-panel-title//b[contains(text(), "History")]/following::text()[contains(., "Daily Monitoring")]/following::*[@id="Other"])';

  /**
   * Validate Account View by extracting Confirmed Move or DNS (Daily Monitoring) history fields
   * @param page Playwright Page object
   * @param type 'confirmed' for Confirmed Move, 'dns' for Daily Monitoring
   * @returns Object with relevant fields for the type
   */
  /**
   * Validate Account View by extracting Confirmed Move or DNS (Daily Monitoring) history fields
   * @param page Playwright Page object
   * @param move Move type: 'confirmed' for Confirmed Move, 'dns' for Daily Monitoring
   * @param trigger Additional trigger parameter (string, for future use)
   * @returns Object with relevant fields for the type
   */
  static async accountViewValidation(
    page: Page,
    move: 'confirmed' | 'dns' = 'confirmed',
    trigger?: string
  ): Promise<
    | { status: string | null; mvr: string | null; ncoa: string | null; pcoa: string | null; comment: string | null }
    | { status: string | null; comment: string | null; stolen: string | null; impound: string | null; salvage: string | null; ebay: string | null; other: string | null }
  > {
    // Define selector maps for each move type
    const selectors: Record<string, string[]> = {
      confirmed: [
        AccountViewPage.AV_History_ConfirmedMove_Status,
        AccountViewPage.AV_History_ConfirmedMove_MVR,
        AccountViewPage.AV_History_ConfirmedMove_NCOA,
        AccountViewPage.AV_History_ConfirmedMove_PCOA,
        AccountViewPage.AV_ConfirmedMove_Comment,
      ],
      dns: [
        AccountViewPage.AV_History_DNS_Status,
        AccountViewPage.AV_History_DNS_Comment,
        AccountViewPage.AV_History_DNS_Stolen,
        AccountViewPage.AV_History_DNS_Impound,
        AccountViewPage.AV_History_DNS_Salvage,
        AccountViewPage.AV_History_DNS_Ebay,
        AccountViewPage.AV_History_DNS_Other,
      ],
    };

    if (!(move in selectors)) {
      throw new Error(`Unsupported move type: ${move}`);
    }

    // Extract field values using Promise.all
    const values = (await Promise.all(
      selectors[move].map((xpath) => page.locator(xpath).textContent())
    )).map(v => (typeof v === 'string' ? v.trim() : v));

    if (move === 'confirmed') {
      const [status, mvr, ncoa, pcoa, comment] = values;
      // Trigger-based validation
      if (trigger === 'MVR') {
        if (mvr !== 'TRUE') throw new Error(`MVR status is - ${mvr}`);
        if (ncoa !== '') throw new Error(`NCOA status is - ${ncoa}`);
        if (pcoa !== '') throw new Error(`PCOA status is - ${pcoa}`);
        if (comment !== 'Confirmed Move (MVR)') throw new Error(`Comments are - ${comment}`);
      }
      // Add more trigger cases as needed
      return { status, mvr, ncoa, pcoa, comment };
    } else if (move == 'dns') {
      const [status, comment, stolen, impound, salvage, ebay, other] = values;
      if (trigger === 'EBAY') {
        if (ebay !== 'TRUE') throw new Error(`Ebay status is - ${ebay}`);
        if (comment !== 'Daily Monitoring (Ebay)') throw new Error(`Comments are - ${comment}`);
      }
      return { status, comment, stolen, impound, salvage, ebay, other };
    }
    // Should never reach here due to earlier check
    throw new Error('Unexpected error in accountViewValidation');
  }
}