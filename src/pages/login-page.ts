import { Page } from '@playwright/test';

/**
 * LoginPage - Page Object for AMS Login functionality
 * Converted from C# Selenium project
 */
export class LoginPage {
  
  /**
   * Navigate to AMS login page and perform login
   * @param page - Playwright Page object
   * @param url - AMS login URL
   * @param username - Username for login
   * @param password - Password for login
   */
  static async login(page: Page, url: string, username: string, password: string): Promise<void> {
    try {
      // Navigate to login page
      await page.goto(url);
      
      // Fill login credentials
      await page.locator('input[id="txtUserName"]').fill(username);
      await page.locator('input[id="txtPassword"]').fill(password);
      
      // Click Sign In button
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      // Wait for dashboard to load
      await page.getByRole('button', { name: 'Home' }).waitFor();
      
      console.log('✓ Successfully logged in to AMS Dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }
}
