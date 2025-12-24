import type { Page } from '@playwright/test';

/**
 * LookupPage - Page Object for AMS Lookup functionality
 */
export class LookupPage {
  /**
   * Search for a vehicle by VIN number
   * @param page - Playwright Page object
   * @param vinNumber - VIN to search for
   */
  static async lookupByVIN(page: Page, vinNumber: string): Promise<void> {
    // Click the first Lookup button (exact match)
    await page.getByRole('button', { name: 'Lookup', exact: true }).first().click();
    // Wait for the VIN input to be visible, then fill
    const vinInput = page.locator('[formcontrolname="vin"]');
    await vinInput.waitFor({ state: 'visible' });
    // Debug: log count and state
    const vinCount = await vinInput.count();
    console.log(`[DEBUG] VIN input count: ${vinCount}`);
    if (vinCount === 0) {
      throw new Error('[DEBUG] VIN input not found in DOM');
    }
    const isEnabled = await vinInput.isEnabled();
    const isEditable = await vinInput.isEditable();
    const isVisible = await vinInput.isVisible();
    console.log(`[DEBUG] VIN input enabled: ${isEnabled}, editable: ${isEditable}, visible: ${isVisible}`);
    // Take a screenshot before filling
    await page.screenshot({ path: 'debug-vin-before-fill.png', fullPage: true });
    await vinInput.fill(vinNumber);
    // Debug: check value after fill
    const filledValue = await vinInput.inputValue();
    console.log(`[DEBUG] VIN input value after fill: ${filledValue}`);
    // Take a screenshot after filling
    await page.screenshot({ path: 'debug-vin-after-fill.png', fullPage: true });
    // Click the second Lookup button (use a more specific selector or exact: true if possible)
   await page.getByRole('button', { name: 'Lookup' }).nth(1).click();
   // Click the link with the VIN number
    await page.getByRole('link', { name: vinNumber }).click();
  }
}
