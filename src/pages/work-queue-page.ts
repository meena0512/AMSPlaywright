import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * WorkQueuePage - Page Object for AMS Work Queue functionality
 */
export class WorkQueuePage {
  /**
   * Validate that an account appears in the Confirmed Moves Work Queue
   * @param page - Playwright Page object
   * @param accountNumber - Account number to search for
   */
  static async validateAccountInWorkQueue(
    page: Page,
    accountNumber: string,
    moveType: 'confirmed' | 'potential' | 'dns'
  ): Promise<void> {
    // Locators
    const workQueueBtn = page.getByRole('button', { name: 'Work Queues', exact: true }).first();
    const confirmedMovesTab = page.locator("//div[contains(text(),'Confirmed Moves')]");
    const potentialMovesTab = page.locator("//div[contains(text(),'Potential Moves')]");
    const dnsMovesTab = page.locator("//div[contains(text(),'Daily Monitoring')]");
    const resetColumnBtn = page.locator("//button[normalize-space()='Reset Column Settings']");
    const clearFilterBtn = page.locator("//button[normalize-space()='Clear Filters']");

    // Use a locator for the clickable <a> element containing the vertical dots icon for Account Number
    const accNoHeader = page.getByRole('columnheader', { name: 'Vehicle Identification Number' });
    // The clickable control shown in the snapshot is a link inside the header
    const accNoSortOption = accNoHeader.getByRole('link').first();

    const filterBtn = page.locator("//*[.=' Filter ']");
    const accNoInput = page.locator("//input[contains(@aria-label, 'Vehicle Identification Number')]");
    const submitBtn = page.locator("//button[@type='submit']");
    const accResult = page.locator(`//a[@title='${accountNumber}']`);

    // Navigate to Work Queues
    await workQueueBtn.click();
    switch (moveType) {
      case 'confirmed':
        await confirmedMovesTab.click();
        break;
      case 'potential':
        await potentialMovesTab.click();
        break;
      case 'dns':
        await dnsMovesTab.click();
        break;
      default:
        throw new Error(`Unknown moveType: ${moveType}`);
    }

    // Reset & clear filters
    await resetColumnBtn.waitFor({ state: 'visible', timeout: 10000 });
    await resetColumnBtn.click();
    await clearFilterBtn.waitFor({ state: 'visible', timeout: 10000 });
    await clearFilterBtn.click();

    // Open Account Number filter
    await accNoSortOption.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Account number', accountNumber);

    // Scroll into view and add a short delay to improve reliability in headless/run mode
    try {
      console.log('[DEBUG] Attempting to click Account Number sort option');
      await accNoSortOption.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300); // Small delay for UI to settle
      await accNoSortOption.click({ timeout: 5000 });
      console.log('[DEBUG] Clicked Account Number sort option successfully');
    } catch (err) {
      console.warn('[DEBUG] Standard click failed on Account Number sort option, trying force click');
      await accNoSortOption.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await accNoSortOption.click({ force: true, timeout: 5000 });
      console.log('[DEBUG] Force clicked Account Number sort option');
    }

    // Debug: Take a screenshot and log menu items before waiting for Filter button
    await page.screenshot({ path: 'debug-before-filter-btn.png', fullPage: true });
    const menuItems = await page.locator('//kendo-grid-columnmenu').allTextContents();
    console.log('[DEBUG] Column menu items:', menuItems);

    await filterBtn.waitFor({ state: 'visible', timeout: 10000 });
    await expect(filterBtn).toBeEnabled();
    await filterBtn.click();
    console.log('[DEBUG] Clicked Filter button');

    // Enter Account Number
    await accNoInput.waitFor({ state: 'visible' });
    await accNoInput.click();
    await accNoInput.fill(accountNumber);

    // Submit filter
    await submitBtn.click();

    // Wait for spinner to disappear (adjust selector if needed)
    await page.waitForSelector('.ball-clip-rotate', { state: 'hidden' });

    // Validate result
    await expect(accResult).toHaveCount(1);
    console.log(`✓ Account ${accountNumber} found in ${moveType} Work Queue`);
  }

  // =========================
  // 🔴 CHANGES START HERE
  // =========================

  // ✅ NEW helper: Kendo grid cells often have whitespace in <td>; value is in descendants/innerText.
  private static async expectKendoCellToHaveText(cell: Locator, expected: string): Promise<void> {
    await cell.scrollIntoViewIfNeeded();

    // ✅ NEW: Prefer innerText (closer to what user sees)
    const inner = (await cell.innerText()).trim();
    if (inner) {
      expect(inner).toContain(expected);
      return;
    }

    // ✅ NEW: Fallback to descendant content (common in Kendo templates)
    await expect(cell.locator(':scope *')).toContainText(expected);
  }

 static async validateWQTriggers(page: Page, trigger: 'MVR' | 'Ebay'): Promise<void> {
  // ✅ CHANGED: define the row ONCE and wait for it (stability)
  const normalizedTrigger = (trigger ?? '').trim().toUpperCase();
  console.log('normalizedTrigger', normalizedTrigger);
  const row = page
    .locator("tr[role='row']")
    .filter({ has: page.locator("a[href*='accountview']") })
    .first();
  await row.waitFor({ state: 'visible', timeout: 10000 });

  // ✅ CHANGED: use Locators (not strings) so Playwright can auto-wait
  let triggerSpan: Locator; // 🔧 CHANGED (was: let triggerLocator;)
  let expectedTriggerText = '';
  let expectedCommentsText = '';
  let logMessage = '';
  await page.waitForTimeout(1000); // Small delay to ensure row is fully loaded
  
  switch (normalizedTrigger) {
    case 'MVR': {
      // ✅ CHANGED: scope to the row (avoids "10 elements"/strict mode)
      triggerSpan = row.locator("span[id='MVR']").first();
      expectedTriggerText = 'TRUE';
      expectedCommentsText = 'Confirmed Move (MVR)';
      logMessage = 'Validating MVR trigger in Work Queue';
      console.log('caseTrigger', trigger);
      break;
    }
case 'Ebay': {
  console.log('[DEBUG] Entered case Ebay');

  console.log('[DEBUG] locating row');
  const row = page.locator("tr[role='row']").filter({ has: page.locator("a[href*='accountview']") }).first();
  await row.waitFor({ state: 'visible', timeout: 1000 });
  console.log('[DEBUG] row visible');

  triggerSpan = row.locator("span[id='Ebay']").first();
  console.log('[DEBUG] triggerSpan count=', await triggerSpan.count());

  // If count is 0, next line will timeout/throw:
  console.log('[DEBUG] before assert triggerSpan');
  await this.expectKendoCellToHaveText(triggerSpan, 'TRUE');
  console.log('[DEBUG] after assert triggerSpan');

  break;
}
default:
      throw new Error(`Unknown trigger: ${trigger}`);
  }

  // ✅ CHANGED: Latest Comments also scoped to the SAME row and kept as Locator
  const latestCommentsSpan = row.locator("span[id='Latest Comments']").first();

  // ✅ CHANGED: Debug prints read from locators (optional)
  console.log('Trigger Text:', (await triggerSpan.innerText()).trim());
  console.log('Latest Comments Text:', (await latestCommentsSpan.innerText()).trim());

  // ✅ CHANGED: use your Kendo-safe helper for BOTH assertions (stable)
  await this.expectKendoCellToHaveText(triggerSpan, expectedTriggerText);
  await this.expectKendoCellToHaveText(latestCommentsSpan, expectedCommentsText);

  console.log(logMessage);
}
}