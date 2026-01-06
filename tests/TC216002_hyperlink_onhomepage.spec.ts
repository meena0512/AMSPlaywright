
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
  console.log('Verified AODA link on AMS homepage');
  await AmsCommPage.verifyTermAndCondition();
  console.log('Verified Terms and Conditions link on AMS homepage');
  await AmsCommPage.verifyPrivacyPolicy();
  console.log('Verified Privacy Policy link on AMS homepage');
  await AmsCommPage.verifyContactUs();
  console.log('Verified Contact Us link on AMS homepage');
  await amsLogin.logout();
  console.log('Logged out from AMS dashboard');
    
});
