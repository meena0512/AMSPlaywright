import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * WorkQueuePage - Page Object for AMS Work Queue functionality
 */
export class WorkQueuePage {
  /**
   * Validate that an account appears in the Confirmed Moves Work Queue
   * @param page - Playwright Page object
   * @param accountNumber - Account number to search for
   */
    static async validateAccountInWorkQueue(page: Page, accountNumber: string, moveType: 'confirmed' | 'potential' | 'dns'): Promise<void> {
    // Locators
    const workQueueBtn = page.getByRole('button', { name: 'Work Queues', exact: true }).first();
    const confirmedMovesTab = page.locator("//div[contains(text(),'Confirmed Moves')]");
    const potentialMovesTab = page.locator("//div[contains(text(),'Potential Moves')]");
    const dnsMovesTab = page.locator("//div[contains(text(),'Daily Monitoring')]");
    const resetColumnBtn = page.locator("//button[normalize-space()='Reset Column Settings']");
    const clearFilterBtn = page.locator("//button[normalize-space()='Clear Filters']");
    // Use a locator for the clickable <a> element containing the vertical dots icon for Account Number
    //from Brenta -const accNoSortOption = page.locator("//th[@role='columnheader' and .//span[@title='Account Number']]//a[kendo-svgicon[contains(@class,'k-svg-i-more-vertical')]]");
    
   const accNoHeader = page.getByRole('columnheader', { name: 'Account Number' });

// The clickable control shown in the snapshot is a link inside the header
const accNoSortOption = accNoHeader.getByRole('link').first();

const filterBtn = page.locator("//*[.=' Filter ']");
    const accNoInput = page.locator("//input[@aria-label='Account Number Filter']");
    const submitBtn = page.locator("//button[@type='submit']");
    const accResult = page.locator(`//a[@title='${accountNumber}']`);

    // Navigate to Work Queues
    await workQueueBtn.click();
    let queueName = '';
    switch (moveType) {
      case 'confirmed':
        await confirmedMovesTab.click();
        queueName = 'Confirmed Moves';
        break;
      case 'potential':
        await potentialMovesTab.click();
        queueName = 'Potential Moves';
        break;
      case 'dns':
        await dnsMovesTab.click();
        queueName = 'Daily Monitoring';
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
    try {
      await filterBtn.waitFor({ state: 'visible', timeout: 10000 });
      await expect(filterBtn).toBeEnabled();
      await filterBtn.click();
      console.log('[DEBUG] Clicked Filter button');
    } catch (err) {
      console.error('[DEBUG] Filter button not found or not clickable:', err);
      throw err;
    }

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
    console.log(`✓ Account ${accountNumber} found in ${moveType} Work Queue`   );
  }
 /* from Brenta static async validateWQTriggers(page: Page, trigger: 'MVR' | 'Ebay'): Promise<void> {
    const latestComments = page.locator("//span[@id='Latest Comments']");
    let triggerLocator;
    let expectedTriggerText = '';
    let expectedCommentsText = '';
    let logMessage = '';

    switch (trigger) {
      case 'MVR':
        triggerLocator = page.locator("//span[@id='MVR']");
        expectedTriggerText = 'TRUE';
        expectedCommentsText = 'Confirmed Move (MVR)';
        logMessage = 'Validating MVR trigger in Work Queue';
        break;
      case 'Ebay':
        triggerLocator = page.locator("//span[@id='Ebay']");
        expectedTriggerText = 'TRUE';
        expectedCommentsText = 'Daily Monitoring (Ebay)';
        logMessage = 'Validating Ebay trigger in Work Queue';
        break;
      default:
        throw new Error(`Unknown trigger: ${trigger}`);
    }*/

        static async validateWQTriggers(page: Page, trigger: 'MVR' | 'Ebay'): Promise<void> {
  // 🔴 UPDATED — Latest Comments is a grid cell, not a span with id
  const latestCommentsCell = page
    .locator("tr[role='row']")
    .filter({ has: page.locator("a[href*='accountview']") })
    .first()
    .locator("td[role='gridcell']")
    .last();

  let triggerLocator;
  let expectedTriggerText = '';
  let expectedCommentsText = '';
  let logMessage = '';

  switch (trigger) {
    case 'MVR': {
      // 🔴 UPDATED — MVR value is in a grid cell, not span[@id='MVR']
      const row = page
        .locator("tr[role='row']")
        .filter({ has: page.locator("a[href*='accountview']") })
        .first();

      // 🔴 UPDATED — column index for MVR (adjust only if grid order changes)
      triggerLocator = row.locator("td[role='gridcell']").nth(11);

      expectedTriggerText = 'TRUE';
      expectedCommentsText = 'Confirmed Move (MVR)';
      logMessage = 'Validating MVR trigger in Work Queue';
      break;
    }

    case 'Ebay':
      // ❌ unchanged (left as-is per request)
      triggerLocator = page.locator("//span[@id='Ebay']");
      expectedTriggerText = 'TRUE';
      expectedCommentsText = 'Daily Monitoring (Ebay)';
      logMessage = 'Validating Ebay trigger in Work Queue';
      break;

    default:
      throw new Error(`Unknown trigger: ${trigger}`);
  }

  // Assertions
  await expect(triggerLocator).toHaveText(expectedTriggerText);
  await expect(latestCommentsCell).toContainText(expectedCommentsText);
  console.log(logMessage);
}

}
