// tests/steps/commonSteps.ts
import { Page } from '@playwright/test';
import { AmsLoginPage } from '../src/pages/amsLogin';
export class commonSteps {
  private amsLogin: AmsLoginPage;
  constructor(page: Page) {
    this.amsLogin = new AmsLoginPage(page);
  }
  async amsDashboardLogin(username?: string, count?: number) {
    // Default login
    if (!username) {
      await this.amsLogin.loginAmsDashboard();
    } 
    }
  }
