import { Page } from '@playwright/test';

export interface AmsSelectors {
	username?: string;
	password?: string;
	signInButton?: string;
	home?: string;
	spinner?: string;
}

export class AmsLoginPage {
	readonly page: Page;
	readonly username: string;
	readonly password: string;
	readonly signInButton: string;
	readonly home: string;
	readonly spinner: string;

	constructor(page: Page, selectors: AmsSelectors = {}) {
		this.page = page;
		this.username = selectors.username ?? 'xpath=//input[@id="txtUserName"]';
		this.password = selectors.password ?? 'xpath=//input[@id="txtPassword"]';
		this.signInButton = selectors.signInButton ?? 'xpath=//button[contains(., "Sign") or @id="signIn"]';
		this.home = selectors.home ?? 'xpath=//div[@id="home"]';
		this.spinner = selectors.spinner ?? 'xpath=//div[contains(@class,"ball-clip") or contains(@class,"spinner")]';
	}

	async loginAmsDashboard(opts?: { url?: string; username?: string; password?: string; screenshotPath?: string; }) {
		const url = opts?.url ?? process.env.LMSDashBoard ?? '';
		const user = opts?.username ?? process.env.LMSDashBoardUserNameQA ?? '';
		const pass = opts?.password ?? process.env.AMSUpdatedPswd ?? '';

		try {
			if (!url) throw new Error('No URL provided for LMS dashboard');
			await this.page.goto(url);

			await this.page.waitForSelector(this.username, { timeout: 30000 });
			let count = await this.page.locator(this.username).count();
			while (count === 0) {
				await this.page.waitForTimeout(2000);
				count = await this.page.locator(this.username).count();
			}

			await this.page.click(this.username, { force: true });
			await this.page.fill(this.username, user);
			await this.page.fill(this.password, pass);

			console.log('Enter username and password in LMS DashBoard login page');
			await this.page.waitForTimeout(1000);
			await this.page.click(this.signInButton, { force: true });

			try {
				await this.page.waitForSelector(this.spinner, { state: 'detached', timeout: 15000 });
			} catch (e) {
				// spinner may not exist
			}

			console.log('User logged in');
			const screenshotPath = opts?.screenshotPath ?? `screenshots/Screenshot${Date.now()}.png`;
			await this.page.screenshot({ path: screenshotPath, fullPage: true });
			return screenshotPath;
		} catch (ex: any) {
			await this.page.waitForTimeout(1000);
			const homeCount = await this.page.locator(this.home).count();
			if (homeCount !== 1) {
				throw new Error('User not logged in: ' + (ex?.message ?? ex));
			}
			return null;
		}
	}
}
