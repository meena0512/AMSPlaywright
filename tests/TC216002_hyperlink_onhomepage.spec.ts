import { test, expect } from '@playwright/test';
import { AmsLoginPage } from '../src/pages/amsLogin';

test('login to AMS dashboard', async ({ page }) => {
  const ams = new AmsLoginPage(page);
  const screenshot = await ams.loginAmsDashboard({
    url: process.env.LMSDashBoard,
    username: process.env.LMSDashBoardUserNameQA,
    password: process.env.AMSUpdatedPswd,
  });
  console.log('Screenshot saved to', screenshot);
});
