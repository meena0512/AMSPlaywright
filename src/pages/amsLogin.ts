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
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.dashboardHeader.waitFor({ state: 'visible' });
  }

  async logout() {
    await this.page.locator('[data-testid="logout-button"]').click();
  }
}