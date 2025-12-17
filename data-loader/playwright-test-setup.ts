// playwright-test-setup.ts
import { test as base, expect, type TestInfo, type Page, type Browser } from '@playwright/test';
import path from 'path';

/**
 * Replace these with your actual implementations.
 * They mirror your C# BasePage / DB utility / TestData usage.
 */
class BasePage {
  static extent: any | null = null;
  static test: any | null = null;
  static validation: any | null = null;

  static getInstance() {
    // singleton init if needed
  }

  static reportSetup(testName: string) {
    // setup reporting (ExtentReports equivalent)
    BasePage.extent = {
      createTest: (name: string) => ({
        log: (level: string, msg: string) => console.log(`[REPORT:${level}] ${name}: ${msg}`),
      }),
    };
  }

  static initializePages(browserName: string) {
    // init page objects / config based on browser
    console.log(`InitializePages for browser: ${browserName}`);
  }

  static beforeTest(testName: string) {
    console.log(`BeforeTest: ${testName}`);
  }
}

class Logger {
  constructor(public message: string) {}
}
class Validation {
  constructor(public logger: Logger) {}
}
class DataBaseUtility {
  async resetVinRepo() {
    console.log('ResetVinRepo called');
  }
  async resetAccRepo() {
    console.log('ResetAccRepo called');
  }
}

class TestData {
  constructor(public xlsxPath: string, public testName: string) {}
}

type MyFixtures = {
  testData: TestData;
  db: DataBaseUtility;
};

export const test = base.extend<MyFixtures>({
  testData: async ({}, use, testInfo) => {
    // Equivalent of computing absolutePath + loading TestData.xlsx
    const relativePath = process.env.RELATIVE_PATH ?? ''; // like ConfigurationManager.AppSettings["relativePath"]

    // Repo root-ish approach: start from current file dir / process.cwd
    const baseDir = relativePath
      ? path.resolve(process.cwd(), relativePath)
      : path.resolve(process.cwd());

    const testDataPath = path.join(baseDir, 'LMS Automation', 'TestData', 'TestData.xlsx');
    const td = new TestData(testDataPath, testInfo.title);
    await use(td);
  },

  db: async ({}, use) => {
    const db = new DataBaseUtility();
    await use(db);
  },
});

// This runs before each test (C# [TestInitialize] equivalent)
test.beforeEach(async ({}, testInfo: TestInfo) => {
  console.log(`Initializing test: ${testInfo.title ?? 'Unknown'}`);

  if (BasePage.extent != null) {
    BasePage.getInstance();
  } else {
    console.log('Setting up reports...');
    BasePage.reportSetup(testInfo.title ?? 'UnknownTest');
  }

  // Create the test instance (ExtentTest equivalent)
  BasePage.test = BasePage.extent.createTest(testInfo.title ?? 'UnknownTest');
  console.log('Test report instance created successfully');

  // InitializePages(ConfigurationManager.AppSettings["Browser"])
  const browserName = process.env.BROWSER ?? 'chromium';
  BasePage.initializePages(browserName);

  // BasePage.validation = new Validation(new Logger("Execution Starts"));
  BasePage.validation = new Validation(new Logger('Execution Starts'));

  BasePage.beforeTest(testInfo.title);
  BasePage.test.log('INFO', 'Test execution Starts');

  // DB resets
  const data = new DataBaseUtility();
  await data.resetVinRepo();
  await data.resetAccRepo();
});

export { expect };
