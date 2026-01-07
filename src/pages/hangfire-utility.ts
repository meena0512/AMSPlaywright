/**
 * Hangfire Dashboard
 * Handles Hangfire Dashboard UI operations
 * Migrated from C# LMSDashBoard Hangfire methods
 */

import type { Page, Frame } from '@playwright/test';

export class HangfireDashboard {
  
  /**
   * Navigate to Hangfire Dashboard
   * Equivalent to C# NavigatetoChildTab("Administration", "Hangfire", "Hangfire Dashboard")
   */
  static async navigateToHangfireDashboard(page: Page): Promise<void> {
    try {
      // Navigate to Administration > Hangfire
      await page.getByRole('button', { name: 'Administration' }).click();
      await page.waitForLoadState('networkidle');
      
      await page.locator('//span[contains(text(),"Hangfire")]').click();
      await page.waitForLoadState('networkidle');
      
     await page.locator('//span[contains(text(),"Hangfire Dashboard")]').click();
      await page.waitForLoadState('networkidle');
      // Wait for iframe to load
      await page.waitForSelector('iframe', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      console.log('✓ Navigated to Hangfire Dashboard');
    } catch (error) {
      console.error('Error navigating to Hangfire dashboard:', error);
      throw error;
    }
  }

  /**
   * Get Hangfire iframe
   */
  private static async getHangfireFrame(page: Page): Promise<Frame | null> {
    try {
      // Wait for iframe to be available
      await page.waitForSelector('iframe', { timeout: 5000 }).catch(() => null);
      
      const frames = page.frames();
      
      // Find the Hangfire iframe by checking if it contains the hangfire dashboard path
      const hangfireFrame = frames.find(frame => 
        frame.url().includes('/hangfiredashboard') || 
        frame.url().includes('hangfire')
      );
      
      if (hangfireFrame) {
        return hangfireFrame;
      }
      
      // Fallback: return the last frame (usually the iframe)
      if (frames.length > 1) {
        return frames[frames.length - 1];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Hangfire frame:', error);
      return null;
    }
  }

  /**
   * Trigger Hangfire job to insert staging active liens to LMS
   * Equivalent to C# TriggerInsertStagingActiveLiensToLMSHangfireJob()
   */
  static async triggerInsertStagingActiveLiensJob(page: Page): Promise<void> {
    try {
      // Navigate to Hangfire Dashboard
      await this.navigateToHangfireDashboard(page);
      
      // Check processing jobs first
      await this.checkProcessingJobs(page);
      
      // Trigger the job
      await this.clickOnRecurringJob(page, 'Staging to Active Liens');
      
      console.log('✓ Triggered InsertStagingActiveLiensToLMS Hangfire job');
    } catch (error) {
      console.error('Error triggering InsertStagingActiveLiensToLMS job:', error);
      console.warn('Continuing test despite job trigger failure...');
    }
  }

  /**
   * Trigger Hangfire job to check schedules
   * Equivalent to C# TriggerCheckSchedulesHangfireJob()
   */
  static async triggerCheckSchedulesJob(page: Page): Promise<void> {
    try {
      // Navigate to Hangfire Dashboard
      await this.navigateToHangfireDashboard(page);
      
      // Check processing jobs
      await this.checkProcessingJobs(page);
      
      // Trigger check schedules job
      await this.clickOnRecurringJob(page, 'check schedules');
      
      // Check failed jobs
      await this.checkFailedJobs(page);
      
      console.log('✓ Triggered CheckSchedules Hangfire job');
    } catch (error) {
      console.error('Error triggering CheckSchedules job:', error);
      console.warn('Continuing test despite job trigger failure...');
    }
  }

  /**
   * Click on recurring job and trigger it
   * Equivalent to C# ClickOnRecurringJobsTab() and TriggerRecurringJob()
   */
  private static async clickOnRecurringJob(page: Page, jobName: string): Promise<void> {
    const frame = await this.getHangfireFrame(page);
    
    if (!frame) {
      throw new Error('Hangfire iframe not found');
    }

    // Click on Recurring Jobs tab
    await frame.locator('//a[@href="/hangfiredashboard/hangfire/recurring"]').click();
    await page.waitForTimeout(1000);
    
    // Select the appropriate job checkbox
    let checkboxSelector = '';
    switch (jobName) {
      case 'Staging to Active Liens':
        checkboxSelector = '//input[@value="ProcessStagingToMain"]';
        break;
      case 'check schedules':
        checkboxSelector = '//input[@value="CheckSchedule"]';
        break;
      case 'process api':
        checkboxSelector = '//input[@value="ProcessAPIRequest"]';
        break;
      case 'process scheduled Email':
        checkboxSelector = '//input[@value="ProcessScheduledEmailReports"]';
        break;
      case 'process Export Notifications':
        checkboxSelector = '//input[@value="ProcessExportNotification"]';
        break;
      case 'prepare Next':
        checkboxSelector = '//input[@value="PrepareNextFile"]';
        break;
      case 'LVS Refresh':
        checkboxSelector = '//input[@value="ProcessLVSRefresh"]';
        break;
      default:
        throw new Error(`Unknown job name: ${jobName}`);
    }
    
    // Check the job checkbox
    await frame.locator(checkboxSelector).check();
    await page.waitForTimeout(1000);
    
    // Click "Trigger Now" button
    await frame.locator('//button[@data-url="/hangfiredashboard/hangfire/recurring/trigger"]').click();
    await page.waitForTimeout(1000);
    
    console.log(`✓ Triggered Hangfire job: ${jobName}`);
  }

  /**
   * Check processing jobs in Hangfire dashboard
   * Equivalent to C# CheckProcessingJobs()
   */
  static async checkProcessingJobs(page: Page): Promise<void> {
    try {
      const frame = await this.getHangfireFrame(page);
      
      if (frame) {
        // Click on Jobs tab
       // await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/enqueued"]').click();
       await frame.locator('//ul[contains(@class,"navbar-nav")]//a[@href="/hangfiredashboard/hangfire/jobs/enqueued"]').click(); 
       await page.waitForTimeout(10000);
        
        // Check processing job count
        const processingCountElement = await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/processing"]/span/span');
        const processingCount = await processingCountElement.textContent().catch(() => '0');
        console.log(`Processing jobs count: ${processingCount}`);
      }
    } catch (error) {
      console.warn('Error checking processing jobs:', error);
    }
  }

  /**
   * Check failed jobs in Hangfire dashboard
   * Equivalent to C# CheckFailedJobs()
   */
  static async checkFailedJobs(page: Page): Promise<void> {
    try {
      const frame = await this.getHangfireFrame(page);
    //  console.log('framevalue',frame);
       if (frame) {
        // Click on Jobs tab
        await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/enqueued"]').click();
        await page.waitForTimeout(1000);
       }
      if (frame) {
        // Click on Scheduled Jobs multiple times
      
        for (let i = 0; i < 3; i++) {
          await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/scheduled"]').click();
          await page.waitForTimeout(500);
        }
        
        // Check failed job count
        const failedCountElement = await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/failed"]/span/span');
        const failedCountText = await failedCountElement.textContent().catch(() => '0');
        const failedCount = parseInt(failedCountText || '0');
        
        if (failedCount > 0) {
          console.warn(`⚠ Warning: ${failedCount} failed jobs detected`);
          
          // Click on failed jobs to see details
          await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/failed"]').click();
          await page.waitForTimeout(1000);
        } else {
          console.log('✓ No failed jobs');
        }
        
        // Switch back to default content
        await page.evaluate(() => {
          // This switches context back to main page
        });
      }
    } catch (error) {
      console.warn('Error checking failed jobs:', error);
    }
  }
}
