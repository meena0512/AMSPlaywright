import type { Page } from '@playwright/test';

/**
 * Utility for downloading the latest file from AMS Source Files page.
 * Migrated from C# CommonSteps.DownloadLatestFile
 */
export class FileDownloadUtility {
  /**
   * Download the latest file for a given source and type (Inbound/Outbound)
   * @param page Playwright Page object
   * @param fileSourceType e.g. 'Carfax', 'CleanList', 'Locator'
   * @param fileType 'Inbound' or 'Outbound'
   */
  static async downloadLatestFile(page: Page, fileSourceType: string, fileType: string): Promise<void> {
    // Navigate to Source Files tab
    await page.getByRole('button', { name: 'Administration' }).click();
    await page.getByRole('menuitem', { name: 'Source Files' }).click();
    // Select file source type
// Open the Source Type dropdown
await page.locator('mat-select[formcontrolname="sourceId"]').click();
// Click the option (replace 'Carfax' with your variable)
await page.locator('mat-option span', { hasText: fileSourceType }).click();
// Open the File Type dropdown
await page.locator('mat-select[formcontrolname="fileTypeId"]').click();
    // Select file type
    await page.locator('mat-option span', { hasText: fileType }).click();
    // Click Lookup button (inside Source File Download form)
    await page.getByLabel('Source File Download').getByRole('button', { name: 'Lookup' }).click();
    // Wait for file list to update and download icons to appear
    await page.waitForSelector('span#iconDownload', { timeout: 60000 });
    // Click the first download icon (latest file)
    const downloadIcon = page.locator('span#iconDownload').first();
    // Start download and wait for completion
    const [ , download ] = await Promise.all([
       new Promise(resolve => setTimeout(resolve, 60000)),
      page.waitForEvent('download'),
       downloadIcon.click()
    ]);
    // Save Outbound files to respective csvfiles folders based on source type
    const suggestedName = download.suggestedFilename();
    let outDir = './downloads';
    if (fileType.toLowerCase() === 'outbound') {
      const sourceType = fileSourceType.toLowerCase();
      switch (sourceType) {
        case 'carfax':
          outDir = './csvfiles/CarfaxOutbound';
          break;
        case 'cleanlist':
          outDir = './csvfiles/CleanListOutbound';
          break;
        case 'locator':
          outDir = './csvfiles/LocatorOutbound';
          break;
        default:
          outDir = './downloads';
      }
    }
    // Create directory if it doesn't exist
    const fs = await import('fs');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    await download.saveAs(`${outDir}/${suggestedName}`);
  }
}