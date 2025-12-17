import { Page } from '@playwright/test';

export interface AmsSelectors {
	username?: string;
	password?: string;
	signInButton?: string;
	home?: string;
	spinner?: string;

	// Logout selectors (optional overrides)
	userSettings?: string;
	signOut?: string;
}

export class AmsLoginPage {
	readonly page: Page;

	readonly username: string;
	readonly password: string;
	readonly signInButton: string;
	readonly home: string;
	readonly spinner: string;

	readonly userSettings: string;
	readonly signOut: string;

	constructor(page: Page, selectors: AmsSelectors = {}) {
		this.page = page;

		// Login selectors
		this.username = selectors.username ?? 'xpath=//input[@id="txtUserName"]';
		this.password = selectors.password ?? 'xpath=//input[@id="txtPassword"]';
		this.signInButton = selectors.signInButton ?? 'xpath=//button[contains(., "Sign") or @id="signIn"]';
		this.home = selectors.home ?? 'xpath=//div[@id="home"]';
		this.spinner = selectors.spinner ?? 'xpath=//div[contains(@class,"ball-clip") or contains(@class,"spinner")]';

		// Logout selectors (from your C#)
		this.userSettings =
			selectors.userSettings ??
			"xpath=//span[contains(text(),'User Manual')]//following::button[1]";
		this.signOut =
			selectors.signOut ??
			"xpath=//span[contains(text(),'Sign Out')]";
	}

	private async zoomIn(level = 1): Promise<void> {
		// Optional equivalent of driver.ZoomIn()
		const factor = 1 + 0.1 * level;
		await this.page.evaluate((f) => {
			const current = document.body.style.zoom ? Number(document.body.style.zoom) : 1;
			document.body.style.zoom = String(current * f);
		}, factor);
	}

	private async waitSpinnerGone(timeoutMs = 15000): Promise<void> {
		// Equivalent of AMSCommonMethods.Wait_Ball_Clip_Disappears()
		try {
			await this.page.waitForSelector(this.spinner, { state: 'detached', timeout: timeoutMs });
		} catch {
			// spinner may not exist or may already be gone
		}
	}

	async loginAmsDashboard(opts?: {
		url?: string;
		username?: string;
		password?: string;
		screenshotPath?: string;
	}) {
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

			await this.waitSpinnerGone(15000);

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

	async logout(opts?: { screenshotPath?: string; zoomLevel?: number }) {
		try {
			await this.page.waitForTimeout(2000);

			await this.zoomIn(opts?.zoomLevel ?? 1);

			// JS click equivalent of driver.JavaScriptClick(...)
			await this.page.locator(this.userSettings).evaluate((el: HTMLElement) => el.click());
			await this.page.locator(this.signOut).evaluate((el: HTMLElement) => el.click());

			await this.waitSpinnerGone(15000);

			const screenshotPath = opts?.screenshotPath ?? `screenshots/Logout${Date.now()}.png`;
			await this.page.screenshot({ path: screenshotPath, fullPage: true });
			return screenshotPath;
		} catch (err: any) {
			const screenshotPath = opts?.screenshotPath ?? `screenshots/LogoutError${Date.now()}.png`;
			try {
				await this.page.screenshot({ path: screenshotPath, fullPage: true });
			} catch {
				// ignore screenshot failures
			}
			throw new Error(`Exception in User Logged Out: ${err?.message ?? String(err)}`);
		}
	}
}
