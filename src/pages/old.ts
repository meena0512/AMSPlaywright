// tests/pages/amsLogin.ts
import { Page, Locator } from '@playwright/test';

export class AMSLoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly dashboardHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-testid="username-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.dashboardHeader = page.locator('[data-testid="dashboard-header"]');
  }

  async loginAMSDashBoard(username: string = 'default', password: string = 'default') {
    try {
      // Navigate to dashboard URL if provided via env
      const targetUrl = process.env.LMS_DASHBOARD_URL || process.env.LMSDashBoard || undefined;
      if (targetUrl) await this.page.goto(targetUrl);

      const usernameSelector = '[data-testid="username-input"]';
      // Poll until the username element is present
      let count = await this.page.locator(usernameSelector).count();
      const maxRetries = 30;
      let retries = 0;
      while (count === 0 && retries < maxRetries) {
        await this.page.waitForTimeout(2000);
        count = await this.page.locator(usernameSelector).count();
        retries++;
      }
      if (count === 0) throw new Error('Username input not found');

      // JavaScript click (to mimic JavaScriptClick)
      await this.page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) el.click();
      }, usernameSelector);

      // Clear and enter credentials
      await this.page.locator(usernameSelector).fill('');
      const userValue = process.env.LMS_DASHBOARD_USER || process.env.LMSDashBoardUserNameQA || username;
      const passValue = process.env.AMS_UPDATED_PSWD || process.env.AMSUpdatedPswd || password;
      await this.page.locator(usernameSelector).fill(userValue);
      await this.passwordInput.fill(passValue);

      console.log('Enter username and password in LMS DashBoard login page');
      await this.page.waitForTimeout(1000);

      // Click sign in via JS
      const signInSelector = '[data-testid="login-button"]';
      await this.page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) el.click();
      }, signInSelector);

      await this.waitForLoaderToDisappear();
      console.log('User logged in');

      const ts = new Date().toISOString().replace(/[:.]/g, '');
      const screenshotPath = `screenshots/Screenshot${ts}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      // return screenshot path for caller if they want it
      return screenshotPath;
    } catch (ex) {
      await this.page.waitForTimeout(1000);
      const homeCount = await this.dashboardHeader.count();
      if (homeCount !== 1) {
        throw new Error('User not logged in: ' + (ex instanceof Error ? ex.message : String(ex)));
      }
    }
  }

  private async waitForLoaderToDisappear() {
    // Try common loader selectors; ignore errors/timeouts
    try {
      await this.page.waitForSelector('.ball-clip, [data-testid="loader"]', { state: 'hidden', timeout: 10000 });
    } catch (e) {
      // ignore: loader might not exist
    }
  }

  async logout() {
    await this.page.locator('[data-testid="logout-button"]').click();
  }
}