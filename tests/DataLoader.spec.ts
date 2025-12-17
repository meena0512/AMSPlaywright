import { test } from '@playwright/test';
import { TestData } from '../LMS Domain/DataManagement/TestData';

test('example test', async () => {
  const sheetName = TestData.getTestDataSheetName();
  console.log(sheetName);
});
