// tests/steps/commonSteps.ts
import { Page } from '@playwright/test';
import { AMSLoginPage } from '../src/pages/amsLogin';


export class CommonSteps {
  private amsLogin: AMSLoginPage;

  constructor(page: Page) {
    this.amsLogin = new AMSLoginPage(page);
  }

  async amsDashboardLogin(username?: string, count?: number) {
    // Default login
    if (!username) {
      await this.amsLogin.loginAMSDashBoard();
    } else {
      // Role-based login
      await this.amsLogin.loginAMSDashBoard(username, count?.toString());
    }
  }
}