import { test, expect } from '@playwright/test';
import { TestDataManager } from '../test-data/test-data-manager';
import type { ParsedTestData } from '../test-data/test-data.interface';
import { DatabaseUtility } from '../utils/database-utility';
import { HangfireDashboard } from '../src/pages/hangfire-utility';
import { LoginPage } from '../src/pages/login-page';
import path from 'path';
import { FileDownloadUtility } from '../src/pages/file-download-utility';
import { AccountViewPage } from '../src/pages/account-view-page';
import { LookupPage } from '../src/pages/lookup-page';
import { WorkQueuePage } from '../src/pages/work-queue-page';
import { csvFileUtility } from '../utils/csv-file-utility';


// Test: TC_AMS_ConfirmedMoveTrigger_CQ_DNS_LVS
// Checks Confirmed Move trigger, business rules, and work queue for Carfax, Cleanlist, Locator, MVR, and Ebay.

test.describe('AMS Smoke Tests', () => {
  
  test.only('TC_AMS_ConfirmedMoveTrigger_CQ_DNS_LVS', async ({ page }) => {
    // Initialize test data from Excel file
    test.setTimeout(300000)
    const testCaseID = 'TC_AMS_ConfirmedMoveTrigger_CQ_DNS_LVS';
    const testDataPath = process.env.TEST_DATA_PATH || path.join(process.cwd(), 'test-data', 'TestData.xlsx');
    
    TestDataManager.initialize(testDataPath, testCaseID);
    const testData: ParsedTestData = TestDataManager.loadDataRow(1); // Load first row
    
    // Configuration from environment variables (migrated from app.config)
    const config = {
      baseURL: process.env.AMS_URL!,
      username: process.env.AMS_USERNAME!,
      password: process.env.AMS_PASSWORD!,
      database: process.env.LMSDB!,
      apiEndpoint: process.env.API_NFS_ENDPOINT!,
      apiVersion: process.env.API_VERSION!,
    };
    
    try {
      // Step 1: Database setup - Insert test data into LMS staging tables
      // This creates:
      // - StagingVINContractDetails (VIN, account, registration info)
      // - StagingDebtorDetails (debtor personal information)
      // - StagingSecuredPartyDetails (lender information)
      console.log('Step 1: Update DB LMS Staging table');
      await DatabaseUtility.insertStagingData(testData);
      console.log('✓ Database staging table updated successfully');
      
      // Step 2: Login to AMS Dashboard (equivalent to AMSDashBoardLogin)
      console.log('Step 2: Login to AMS Dashboard');
      await LoginPage.login(page, config.baseURL, config.username, config.password);
      
      // Step 3: Update Auto Assign False PPSA True (equivalent to update_Auto_Assign_False_PPSA_True)
      console.log('Step 3: Update Auto Assign False, PPSA True');
      await DatabaseUtility.updateClientConfiguration(false, true, testData.corporationName);
      console.log('✓ Client configuration updated successfully');
      
      // Step 3a: Initialize source schedules for Hangfire jobs
      console.log('Step 3a: Initialize source schedules');
      await DatabaseUtility.updateSourceSchedule('initialize', 1, 1, 1);
      await DatabaseUtility.updateSourceSchedule('initialize_Reports', 1, 1, 1);
      await DatabaseUtility.updateSourceSchedule('initialize_WQReports', 1, 1, 1);
      
      // Step 3b: Trigger Hangfire job to insert staging active liens
      console.log('Step 3b: Trigger InsertStagingActiveLiensToLMS job');
      await HangfireDashboard.triggerInsertStagingActiveLiensJob(page);
      
      // Step 3c: Update source schedulers for Carfax, Cleanlist, Locator
      console.log('Step 3c: Update source schedulers (Carfax, Cleanlist, Locator)');
      await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 4, 7); // Carfax
      await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 5, 8); // Cleanlist
      await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 6, 9); // Locator
      
      // Step 3d: Trigger Hangfire job to check schedules
      console.log('Step 3d: Trigger CheckSchedules job');
      await HangfireDashboard.triggerCheckSchedulesJob(page);
      console.log('✓ Source schedules initialized and jobs triggered');
      
      // Step 4: Process AMS Outbound Files 
      console.log('Step 4: Process AMS Outbound Files with Carfax, Cleanlist, Locator');
     // const { FileDownloadUtility } = await FileDownloadUtility.('../src/pages/file-download-utility.ts');
      await FileDownloadUtility.downloadLatestFile(page, 'Carfax', 'Outbound');
      await FileDownloadUtility.downloadLatestFile(page, 'CleanList', 'Outbound');
      await FileDownloadUtility.downloadLatestFile(page, 'Locator', 'Outbound');
      console.log(`✓ Downloaded Outbound files for Carfax, CleanList, Locator`);
      
      // Create and upload Carfax Inbound file
      //const { csvFileUtility } = await import('../utils/csv-file-utility.ts');
      csvFileUtility.VinRepo = [...DatabaseUtility.vinRepo];
      await csvFileUtility.createAndUploadCarfaxInboundFile(page, 'MVR');
      console.log(`✓ Created and uploaded Carfax Inbound file`);
      
      // Create and upload CleanList Inbound file
      await csvFileUtility.createAndUploadCleanlistInboundFile(page, 'NO_NCOA_PCOA');
      console.log(`✓ Created and uploaded CleanList Inbound file`);
      
      // Create and upload Locator Inbound file
      await csvFileUtility.createAndUploadLocatorInboundFile(page, 'Ebay');
      console.log(`✓ Created and uploaded Locator Inbound file`);
      
      // Step 4a: Update source schedulers to process inbound files
      console.log('Step 4a: Update source schedulers to process inbound files');
      await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 4, 1); // Carfax Inbound
      await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 5, 3); // CleanList Inbound
      await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 6, 4); // Locator Inbound
      
      // Step 4b: Trigger Hangfire job to check schedules
      console.log('Step 4b: Trigger CheckSchedules job to process inbound files');
      await HangfireDashboard.triggerCheckSchedulesJob(page);
      console.log('✓ Inbound files processing triggered');
      
      // Step 4c: Update report schedulers
      console.log('Step 4c: Update report schedulers');
      await DatabaseUtility.updateSourceSchedule('ReportScheduler', -2, 2, 1); 
      await DatabaseUtility.updateSourceSchedule('ReportScheduler', -2, 1, 1); 
      
      // Step 4d: Trigger Hangfire job to check schedules for reports
      console.log('Step 4d: Trigger CheckSchedules job for reports');
      await HangfireDashboard.triggerCheckSchedulesJob(page);
      
      // Step 4e: Update work queue schedulers
      console.log('Step 4e: Update work queue schedulers');
      await DatabaseUtility.updateSourceSchedule('WQScheduler', -2, 1, 1); // WQ Scheduler 1
      await DatabaseUtility.updateSourceSchedule('WQScheduler', -2, 2, 1); // WQ Scheduler 2
      
      // Step 4f: Trigger Hangfire job to check schedules for work queues
      console.log('Step 4f: Trigger CheckSchedules job for work queues');
      await HangfireDashboard.triggerCheckSchedulesJob(page);
      
      // Step 4g: Update DNS work queue schedulers
      console.log('Step 4g: Update DNS work queue schedulers');
      await DatabaseUtility.updateSourceSchedule('WQDNSScheduler', -5, 1, 3); // DNS WQ Scheduler 1
      await DatabaseUtility.updateSourceSchedule('WQDNSScheduler', -5, 2, 3); // DNS WQ Scheduler 2
      
      // Step 4h: Trigger Hangfire job to check schedules for DNS queues
      console.log('Step 4h: Trigger CheckSchedules job for DNS work queues');
      await HangfireDashboard.triggerCheckSchedulesJob(page);
      console.log('✓ All schedules triggered and processed');
      
      // Step 5: Validate Account View Business Rules - Confirmed Move
      console.log('Step 5: Validate AV Business Rules - Confirmed Move');
        await LookupPage.lookupByVIN(page, csvFileUtility.VinRepo[0]);
      // Step 2: Validate Account View for Confirmed Move (MVR)
      await AccountViewPage.accountViewValidation(page, 'confirmed', 'MVR');
       await AccountViewPage.accountViewValidation(page, 'dns', 'EBAY');
      
      
      // Step 7: Switch to Confirmed Moves Work Queue Tab
      console.log('Step 7: Switch to Confirmed Moves WQ Tab');
      await WorkQueuePage.validateAccountInWorkQueue(page,csvFileUtility.VinRepo[0], 'confirmed');
      await WorkQueuePage.validateWQTriggers(page,'MVR');
      await WorkQueuePage.validateWQTriggers(page,'Ebay');
      
      console.log('Test completed successfully');
      console.log(`Test Data Used: VIN=${testData.vin}, Account=${testData.accountNumber}`);
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });
   test('SMOKE_FileDownlaod', async ({ page }) => {
      const testCaseID = 'TC_AMS_ConfirmedMoveTrigger_CQ_DNS_LVS';
    const testDataPath = process.env.TEST_DATA_PATH || path.join(process.cwd(), 'test-data', 'TestData.xlsx');
    
    TestDataManager.initialize(testDataPath, testCaseID);
    const testData: ParsedTestData = TestDataManager.loadDataRow(1); // Load first row
    
    // Configuration from environment variables (migrated from app.config)
    const config = {
      baseURL: process.env.AMS_URL!,
      username: process.env.AMS_USERNAME!,
      password: process.env.AMS_PASSWORD!,
      database: process.env.LMSDB!,
      apiEndpoint: process.env.API_NFS_ENDPOINT!,
      apiVersion: process.env.API_VERSION!,
    };
    
    try {
    // Initialize test data from Excel file
    const testCaseID = 'TC_AMS_ConfirmedMoveTrigger_CQ_DNS_LVS';
    const testDataPath = process.env.TEST_DATA_PATH || path.join(process.cwd(), 'test-data', 'TestData.xlsx');
    
    TestDataManager.initialize(testDataPath, testCaseID);
    const testData: ParsedTestData = TestDataManager.loadDataRow(1); // Load first row
    await LoginPage.login(page, config.baseURL, config.username, config.password);
      
    // Import utilities
    const { FileDownloadUtility } = await import('../src/pages/file-download-utility.ts');
    const { csvFileUtility } = await import('../utils/csv-file-utility.ts');
    
    // Step 1: Download Carfax Outbound file
    await FileDownloadUtility.downloadLatestFile(page, 'Carfax', 'Outbound');
    await FileDownloadUtility.downloadLatestFile(page, 'CleanList', 'Outbound');
      await FileDownloadUtility.downloadLatestFile(page, 'Locator', 'Outbound');
      console.log(`✓ Downloaded Outbound files for Carfax, CleanList, Locator`);
      
    // Step 2: Create and upload Carfax Inbound file
    await csvFileUtility.createAndUploadCarfaxInboundFile(page, 'MVR');
    console.log(`✓ Created and uploaded Carfax Inbound file`);
    
    // Step 3: Create and upload CleanList Inbound file
    await csvFileUtility.createAndUploadCarfaxInboundFile(page, 'NO_NCOA_PCOA');
    console.log(`✓ Created and uploaded CleanList Inbound file`);
    
    // Step 4: Create and upload Locator Inbound file
    await csvFileUtility.createAndUploadCarfaxInboundFile(page, 'Ebay');
    console.log(`✓ Created and uploaded Locator Inbound file`);
    
    // Step 4a: Update source schedulers to process inbound files
    console.log('Step 4a: Update source schedulers to process inbound files');
    await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 4, 1); // Carfax Inbound
    await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 5, 3); // CleanList Inbound
    await DatabaseUtility.updateSourceSchedule('sourceScheduler', -2, 6, 4); // Locator Inbound
    
    // Step 4b: Trigger Hangfire job to check schedules
    console.log('Step 4b: Trigger CheckSchedules job to process inbound files');
    await HangfireDashboard.triggerCheckSchedulesJob(page);
    console.log('✓ Inbound files processing triggered');
    
    // Step 4c: Update report schedulers
    console.log('Step 4c: Update report schedulers');
    await DatabaseUtility.updateSourceSchedule('ReportScheduler', -2, 2, 1); // DNS Report
    await DatabaseUtility.updateSourceSchedule('ReportScheduler', -2, 1, 1); // Main Report
    
    // Step 4d: Trigger Hangfire job to check schedules for reports
    console.log('Step 4d: Trigger CheckSchedules job for reports');
    await HangfireDashboard.triggerCheckSchedulesJob(page);
    
    // Step 4e: Update work queue schedulers
    console.log('Step 4e: Update work queue schedulers');
    await DatabaseUtility.updateSourceSchedule('WQScheduler', -2, 1, 1); // WQ Scheduler 1
    await DatabaseUtility.updateSourceSchedule('WQScheduler', -2, 2, 1); // WQ Scheduler 2
    
    // Step 4f: Trigger Hangfire job to check schedules for work queues
    console.log('Step 4f: Trigger CheckSchedules job for work queues');
    await HangfireDashboard.triggerCheckSchedulesJob(page);
    
    // Step 4g: Update DNS work queue schedulers
    console.log('Step 4g: Update DNS work queue schedulers');
    await DatabaseUtility.updateSourceSchedule('WQDNSScheduler', -5, 1, 3); // DNS WQ Scheduler 1
    await DatabaseUtility.updateSourceSchedule('WQDNSScheduler', -5, 2, 3); // DNS WQ Scheduler 2
    
    // Step 4h: Trigger Hangfire job to check schedules for DNS queues
    console.log('Step 4h: Trigger CheckSchedules job for DNS work queues');
    await HangfireDashboard.triggerCheckSchedulesJob(page);
    console.log('✓ All schedules triggered and processed');
      
    console.log('Test completed successfully');
    console.log(`Test Data Used: VIN=${testData.vin}, Account=${testData.accountNumber}`);
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });
});
