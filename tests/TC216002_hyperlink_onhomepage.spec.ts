
import { test, expect } from '@playwright/test';
import { AmsLoginPage} from '../src/pages/amsLogin';
import { CommonSteps } from '../dist/commonSteps';
import { AmsCommonPage} from '../src/pages/amsHomePage';



test('login to AMS dashboard', async ({ page }) => {
  const commSteps = new CommonSteps(page);
  const AmsCommPage = new AmsCommonPage(page);
  const footerLinksPage = new AmsCommonPage(page);
  const amsLogin = new AmsLoginPage(page);

  await commSteps.amsDashboardLogin();
  await AmsCommPage.verifyAoda();
  await AmsCommPage.verifyTermAndCondition();
  await AmsCommPage.verifyPrivacyPolicy();
  await AmsCommPage.verifyContactUs();
  await amsLogin.logout();

    
});
