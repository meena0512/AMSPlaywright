import { Page, Locator, expect } from '@playwright/test';

export class AmsCommonPage {
  readonly page: Page;

  // AODA
  readonly aoda: Locator;
  readonly aodaDisplayMsg: Locator;

  // Footer links
  readonly termcondition: Locator;
  readonly privacyStatement: Locator;
  readonly privacyPolicy: Locator;
  readonly privacyPolicyHeader: Locator;

  // Contact Us
  readonly contactUs: Locator;
  readonly altContactUs: Locator;
  readonly contactUsMessage: Locator;

  // Common close
  readonly close: Locator;

  constructor(page: Page) {
    this.page = page;

    // AODA locators
    this.aoda = page.locator("//*[@id='lnk_aoda']");
    this.aodaDisplayMsg = page.locator("(//h1[normalize-space()='Coming Soon'])[1]");

    // Footer links locators
    this.termcondition = page.locator("(//a[normalize-space()='Terms And Conditions'])[1]");
    this.privacyStatement = page.locator("//p[@id='privacy']");
    this.privacyPolicy = page.locator("(//a[normalize-space()='Privacy Policy'])[1]");
    this.privacyPolicyHeader = page.locator("//h1[normalize-space()='Privacy Policy']");

    // Contact Us locators (updated to match your Verify_Contactus conversion)
    this.contactUs = page.locator("(//a[normalize-space()='Contact Us'])[1]");
    this.altContactUs = page.locator("(//h1[normalize-space()='Contact Us'])[1]");
    this.contactUsMessage = page.locator("//div[contains(., 'Whatever your question')]");

    // Common close button
    this.close = page.locator("//span[normalize-space()='Close']");
  }

  private normalize(text: string): string {
    return (text ?? '').replace(/\s+/g, ' ').trim();
  }

  async verifyAoda(): Promise<void> {
    await this.aoda.evaluate(el => (el as HTMLElement).click());

    await expect(this.aodaDisplayMsg).toBeVisible();
    expect(await this.aodaDisplayMsg.count()).toBeGreaterThan(0);

    const rawText = await this.aodaDisplayMsg.first().textContent();
    const actualText = this.normalize(rawText ?? '');
    expect(actualText).toContain('Coming Soon');

    await this.page.screenshot({ path: `aoda-loaded-${Date.now()}.png`, fullPage: true });
    await this.close.click();
  }

  async verifyTermAndCondition(): Promise<void> {
    const expectedUrl = 'https://www.autotrader.ca/privacy-statement/?#terms';

    const newPagePromise = this.page.context().waitForEvent('page');
    await this.termcondition.evaluate(el => (el as HTMLElement).click());
    const newPage = await newPagePromise;

    await newPage.waitForLoadState('domcontentloaded');
    await expect(newPage).toHaveURL(expectedUrl);

    await expect(newPage.locator("//p[@id='privacy']")).toBeVisible();
    await expect(newPage.locator("//p[@id='privacy']")).toHaveCount(1);

    await newPage.screenshot({ path: `terms-and-conditions-${Date.now()}.png`, fullPage: true });

    await newPage.close();
    await this.page.bringToFront();
  }

  async verifyPrivacyPolicy(): Promise<void> {
    const expectedUrl = 'https://go.trader.ca/privacy-policy/';

    const newTabPromise = this.page.context().waitForEvent('page');
    await this.privacyPolicy.evaluate(el => (el as HTMLElement).click());
    const newTab = await newTabPromise;

    await newTab.waitForLoadState('domcontentloaded');
    await expect(newTab).toHaveURL(expectedUrl);

    await expect(newTab.locator("//h1[normalize-space()='Privacy Policy']")).toBeVisible();
    await expect(newTab.locator("//h1[normalize-space()='Privacy Policy']")).toHaveCount(1);

    await newTab.screenshot({ path: `privacy-policy-${Date.now()}.png`, fullPage: true });

    await newTab.close();
    await this.page.bringToFront();
  }

  async verifyContactUs(): Promise<void> {
    // JS click equivalent
    await this.contactUs.evaluate(el => (el as HTMLElement).click());

    // Wait for Contact Us header
    await expect(this.altContactUs).toBeVisible();
    expect(await this.altContactUs.count()).toBeGreaterThan(0);

    // Read and validate message text
    const rawText = await this.contactUsMessage.first().textContent();
    const actualMessage = this.normalize(rawText ?? '');

    const expectedMsg = this.normalize(
      "Contact UsWhatever your question or concern, we're here to help. " +
        "General Questions and Support Contact Support Team at: cms.registrysupport@trader.ca " +
        "Sales & Marketing Requests or Product Demos Email: cms.registrysupport@trader.ca Close"
    );

    expect(actualMessage).toBe(expectedMsg);

    await this.page.screenshot({ path: `contact-us-${Date.now()}.png`, fullPage: true });

    // Close dialog (JS click equivalent)
    await this.close.evaluate(el => (el as HTMLElement).click());

    await this.page.bringToFront();
  }
}
