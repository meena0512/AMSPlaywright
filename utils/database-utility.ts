/**
 * Database Utility
 * Handles database operations for LMS staging tables
 * Migrated from C# DataBaseUtility.cs
 */

import sql from 'mssql';
import type { ParsedTestData } from '../test-data/test-data.interface.js';
import fs from 'fs';
import path from 'path';

export class DatabaseUtility {
  private static config: sql.config;
  private static logDirectory = './test-logs';
  
  // Repositories to store generated values (like C# VinRepo, AccRepo, etc.)
  static vinRepo: string[] = [];
  static accountRepo: string[] = [];
  static transactionRepo: string[] = [];
  static registrationNumberRepo: string[] = [];

  /**
   * Initialize database connection configuration
   */
  static initialize(connectionString?: string): void {
    // Parse connection string or use environment variables
    const server = process.env.DB_LMS_SERVER || 'MRKREGDBVWQA12.DHLTD.CORP';
    const database = process.env.DB_LMS_DATABASE || 'LMS_QA4';
    const user = process.env.DB_LMS_USER?.trim();
    const password = process.env.DB_LMS_PASSWORD?.trim().replace(/^["']|["']$/g, ''); // Remove quotes
    const useWindowsAuth = process.env.DB_USE_WINDOWS_AUTH?.trim() === 'true';

    console.log('Database initialization:', {
      server,
      database,
      useWindowsAuth,
      hasUser: !!user,
      hasPassword: !!password
    });

    // For mssql with tedious driver, Windows Auth still needs credentials
    // Use SQL Server Authentication (more reliable with tedious driver)
    if (!useWindowsAuth && user && password) {
      console.log('Using SQL Server Authentication');
      this.config = {
        server,
        database,
        user,
        password,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
      };
    } else {
      // If Windows Auth is requested but no credentials, throw error
      console.error('Windows Authentication with current user credentials is not supported by tedious driver.');
      console.log('Please set DB_USE_WINDOWS_AUTH=false and provide DB_LMS_USER and DB_LMS_PASSWORD');
      throw new Error('Database configuration error: Windows Authentication requires explicit credentials with tedious driver. Use SQL Server Authentication instead.');
    }
  }

  /**
   * Insert test data into LMS staging tables
   * Equivalent to C# addrowdetailstoLMSDBStagingTable()
   */
  static async insertStagingData(testData: ParsedTestData): Promise<void> {
    if (!this.config) {
      this.initialize();
    }

    try {
      console.log('Connecting to database...');
      console.log('Config:', { 
        server: this.config.server, 
        database: this.config.database,
        authType: this.config.authentication?.type || 'sql',
        domain: this.config.domain || 'N/A'
      });
      
      const pool = await sql.connect(this.config);

      // Generate dynamic values if needed
      const vin = this.generateVIN(testData.vin);
      const accountNumber = this.generateAccountNumber(testData.accountNumber);
      const transactionID = this.generateTransactionID(testData.transactionID);
      const registrationDate = this.processDate(testData.registrationDate);
      const expiryDate = this.processExpiryDate(testData.expiryDate, testData.term, registrationDate);
      const registrationNumber = this.generateRegistrationNumber(testData.provinceJurisdiction);

      // Store generated values in repositories for later use in test
      this.vinRepo.push(vin);
      this.accountRepo.push(accountNumber);
      this.transactionRepo.push(transactionID);
      this.registrationNumberRepo.push(registrationNumber);

      console.log('Generated values:');
      console.log(`  Original VIN: ${testData.vin} -> Generated: ${vin}`);
      console.log(`  Original Account: ${testData.accountNumber} -> Generated: ${accountNumber}`);
      console.log(`  Original TransactionID: ${testData.transactionID} -> Generated: ${transactionID}`);
      console.log(`  Original RegDate: ${testData.registrationDate} -> Generated: ${registrationDate}`);
      console.log(`  Original Expiry: ${testData.expiryDate} -> Generated: ${expiryDate}`);

      // Build SQL query based on whether it's a two-debtor scenario
      const isTwoDebtor = testData.twoDebtor === 'Yes';
      const sourceInfoId = 2; // CGE source

      const query = this.buildInsertQuery(
        transactionID,
        vin,
        testData.corporationName,
        registrationDate,
        testData.provinceJurisdiction,
        accountNumber,
        testData.term,
        expiryDate,
        testData.collateralType,
        testData.make,
        testData.model,
        testData.year,
        registrationNumber,
        testData.loanAmount,
        sourceInfoId,
        testData.debtorID,
        testData.debtorFN,
        testData.debtorMN,
        testData.debtorLN_BusinessName,
        testData.dob,
        testData.debtorAddress,
        testData.debtorCity,
        testData.debtorProvince,
        testData.debtorPostalCode,
        isTwoDebtor,
        testData.debtorID2,
        testData.debtorFN2,
        testData.debtorMN2,
        testData.debtorLN_BusinessName2,
        testData.dob2,
        testData.debtorAddress2,
        testData.debtorCity2,
        testData.debtorProvince2,
        testData.debtorPostalCode2
      );

      await pool.request().query(query);

      console.log(`✓ Inserted VIN ${vin} into LMS DB Staging table`);
      console.log(`  Account Number: ${accountNumber}`);
      console.log(`  Transaction ID: ${transactionID}`);
      console.log(`  Registration Number: ${registrationNumber}`);

      // Log test data to CSV file for tracking
      await this.addRowDetailsToLogFile(testData, vin, accountNumber, transactionID, registrationNumber, registrationDate, expiryDate);

      await pool.close();
    } catch (error) {
      console.error('Error inserting data into LMS staging table:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error?.constructor?.name
      });
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate VIN if placeholder value is provided
   * Format: AMS + 14-digit timestamp (17 characters total)
   * Example: AMS17345678901234
   */
  private static generateVIN(vinTemplate: string): string {
    if (vinTemplate === '$GetVin') {
      const now = new Date();
      const timestamp = now.getTime().toString().padStart(14, '0');
      return `AMS${timestamp}`;
    }
    return vinTemplate;
  }

  /**
   * Generate Account Number if placeholder value is provided
   */
  private static generateAccountNumber(accountTemplate: string): string {
    if (accountTemplate === '$GetAccountNumber') {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-10);
      return `ACC${timestamp}`;
    }
    return accountTemplate;
  }

  /**
   * Generate Transaction ID if placeholder value is provided
   */
  private static generateTransactionID(transactionTemplate: string): string {
    if (transactionTemplate === '$GetTransactionID') {
      const now = new Date();
      // Use only last 9 digits to fit in SQL Server int (max 2,147,483,647)
      const timestamp = now.getTime().toString().slice(-9);
      return timestamp;
    }
    return transactionTemplate;
  }

  /**
   * Generate Registration Number based on province
   */
  private static generateRegistrationNumber(province: string): string {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    return `${province}${timestamp}`;
  }

  /**
   * Process date placeholders
   */
  private static processDate(dateTemplate: string): string {
    if (dateTemplate === '$GetCurrentDateMinus35') {
      const date = new Date();
      date.setDate(date.getDate() - 35);
      return date.toISOString().split('T')[0];
    }
    if (dateTemplate === '$GetCurrentDateMinus11Months') {
      const date = new Date();
      date.setMonth(date.getMonth() - 11);
      return date.toISOString().split('T')[0];
    }
    return dateTemplate;
  }

  /**
   * Calculate expiry date based on term
   */
  private static processExpiryDate(expiryTemplate: string, term: string, registrationDate: string): string {
    if (expiryTemplate === '$GetExpiryDt') {
      const termYears = parseInt(term) || 0;
      const regDate = new Date(registrationDate);
      regDate.setFullYear(regDate.getFullYear() + termYears);
      return regDate.toISOString().split('T')[0];
    }
    return expiryTemplate;
  }

  /**
   * Build the SQL INSERT query for staging tables
   */
  private static buildInsertQuery(
    transactionId: string,
    vinNumber: string,
    corporationCode: string,
    registrationDate: string,
    province: string,
    accountNumber: string,
    term: string,
    expiryDate: string,
    collateralType: string,
    make: string,
    model: string,
    year: string,
    registrationNumber: string,
    loanAmount: string,
    sourceInfoId: number,
    debtorId: string,
    debtorFN: string,
    debtorMN: string,
    debtorLN: string,
    dob: string,
    debtorAddress: string,
    debtorCity: string,
    debtorProvince: string,
    debtorPostalCode: string,
    isTwoDebtor: boolean,
    debtorId2?: string,
    debtorFN2?: string,
    debtorMN2?: string,
    debtorLN2?: string,
    dob2?: string,
    debtorAddress2?: string,
    debtorCity2?: string,
    debtorProvince2?: string,
    debtorPostalCode2?: string
  ): string {
    // Safely handle potentially undefined values
    const safeValue = (val: any): string => val ?? '';
    
    const vinContractInsert = `
      INSERT INTO [dbo].[StagingVINContractDetails] 
      ([TransactionId], [VinNumber], [VinStatus], [CorporationName], [ClientInfoId], 
       [RegistrationDate], [TimePerformed], [Province], [AccountNumber], [Term], 
       [ExpiryDate], [DischargeDate], [CollateralType], [Make], [Model], [Year], 
       [ServiceType], [RegistrationNumber], [LoanAmount], [SourceInfoId], 
       [ProcessStatusId], [IsDeleted], [CreatedDateTime], [UpdatedDateTime])
      VALUES 
      (${transactionId}, '${safeValue(vinNumber)}', 'Active',
       (SELECT TOP 1 ISNULL(S.[SourceClientName], '') AS 'CorporationName' 
        FROM [dbo].[ClientInfo] C 
        INNER JOIN [dbo].[ClientInfo_SourceInfo] S ON C.[Id] = S.[ClientInfoId] 
        WHERE C.[CorporationCode] = '${safeValue(corporationCode)}' 
        AND C.[IsDeleted] = 0 AND S.[IsDeleted] = 0 AND S.[SourceInfoId] = ${sourceInfoId}),
       (SELECT TOP 1 [Id] FROM [dbo].[ClientInfo] 
        WHERE [CorporationCode] = '${safeValue(corporationCode)}' AND [IsDeleted] = 0),
       '${safeValue(registrationDate)}', GETDATE(), '${safeValue(province)}', '${safeValue(accountNumber)}', '${safeValue(term)}',
       '${safeValue(expiryDate)}', NULL, '${safeValue(collateralType)}', '${safeValue(make)}', '${safeValue(model)}', '${safeValue(year)}',
       'Security Agreement', '${safeValue(registrationNumber)}', ${safeValue(loanAmount)}, ${sourceInfoId},
       1, 0, GETDATE(), GETDATE())
    `;

    let debtorInsert = `
      INSERT INTO [dbo].[StagingDebtorDetails]
      ([TransactionId], [VinNumber], [DebtorID], [DebtorOrder], [FirstName], 
       [MiddleName], [LastName], [DateOfBirth], [BusinessName], [Address], 
       [City], [Province], [PostalCode], [IsDeleted], [CreatedDateTime], [UpdatedDateTime])
      VALUES 
      (${transactionId}, '${safeValue(vinNumber)}', '', ${safeValue(debtorId)}, '${safeValue(debtorFN)}', '${safeValue(debtorMN)}', 
       '${safeValue(debtorLN)}', '${safeValue(dob)}', '', '${safeValue(debtorAddress)}', '${safeValue(debtorCity)}', 
       '${safeValue(debtorProvince)}', '${safeValue(debtorPostalCode)}', 0, GETDATE(), GETDATE())
    `;

    if (isTwoDebtor) {
      debtorInsert += `,
      (${transactionId}, '${safeValue(vinNumber)}', '', ${safeValue(debtorId2)}, '${safeValue(debtorFN2)}', '${safeValue(debtorMN2)}', 
       '${safeValue(debtorLN2)}', '${safeValue(dob2)}', '', '${safeValue(debtorAddress2)}', '${safeValue(debtorCity2)}', 
       '${safeValue(debtorProvince2)}', '${safeValue(debtorPostalCode2)}', 0, GETDATE(), GETDATE())
      `;
    }

    const securedPartyInsert = `
      INSERT INTO [dbo].[StagingSecuredPartyDetails]
      ([TransactionId], [VinNumber], [LenderDescriptor], [TransitCode], 
       [Address], [City], [Province], [PostalCode], [IsDeleted], 
       [CreatedDateTime], [UpdatedDateTime])
      VALUES 
      (${transactionId}, '${safeValue(vinNumber)}', 'Auto Dealer Leander', 'ABC123',
       '123 Fake Business Street', 'Toronto', 'ON', 'L1L 1V1', 0, GETDATE(), GETDATE())
    `;

    return `
      DECLARE @TransactionId int = ${transactionId}
      DECLARE @VinNumber nvarchar(50) = '${safeValue(vinNumber)}'
      DECLARE @VinStatus nvarchar(50) = 'Active'
      DECLARE @CorporationCode nvarchar(50) = '${safeValue(corporationCode)}'
      DECLARE @SourceInfoId int = ${sourceInfoId}
      
      IF @TransactionId != 0 AND @VinNumber != ''
      BEGIN
        ${vinContractInsert}
        ${debtorInsert}
        ${securedPartyInsert}
      END
    `;
  }

  /**
   * Update client configuration (Auto Assign, PPSA flags)
   */
  static async updateClientConfiguration(
    isAutoAssign: boolean,
    isAutoPPSA: boolean,
    corporationCode: string = 'SDA'
  ): Promise<void> {
    if (!this.config) {
      this.initialize();
    }

    try {
      const pool = await sql.connect(this.config);
      const database = process.env.LMSDB || '[LMS_QA4]';

      const query = `
        UPDATE ${database}.[dbo].[ClientInfo] 
        SET IsAutoPPSA = ${isAutoPPSA ? 1 : 0}, 
            IsAutoAssign = ${isAutoAssign ? 1 : 0} 
        WHERE CorporationCode = '${corporationCode}' 
        AND IsDeleted = 0
      `;

      await pool.request().query(query);
      console.log(`✓ Updated ${corporationCode}: AutoAssign=${isAutoAssign}, AutoPPSA=${isAutoPPSA}`);

      await pool.close();
    } catch (error) {
      console.error('Error updating client configuration:', error);
      throw error;
    }
  }

  /**
   * Update source schedule for Hangfire job processing
   * Equivalent to C# UpdateSourceSchedule()
   */
  static async updateSourceSchedule(
    scheduleType: string,
    dayOffset: number,
    sourceInfoId: number,
    scheduleId: number
  ): Promise<void> {
    if (!this.config) {
      this.initialize();
    }

    try {
      const pool = await sql.connect(this.config);
      const database = process.env.LMSDB || '[LMS_QA4]';

      let query = '';

      if (scheduleType === 'initialize' || scheduleType === '' || scheduleType === 'initialize_WQReports') {
               query = `UPDATE ${database}.[dbo].[SourceSchedule]   SET processStatusId = 1, ScheduleDate =  DATEADD(HOUR, ${dayOffset}, GETDATE()) where IsDeleted = 0 `;
      } else if (scheduleType === 'sourceScheduler') {
        query = `UPDATE ${database}.[dbo].[SourceSchedule]  SET processStatusId = 1, ScheduleDate = DATEADD(HOUR, ${dayOffset}, GETDATE()) WHERE SourceInfoId = ${sourceInfoId}  AND sourcefileinfoid = ${scheduleId} and IsDeleted = 0 `;
      }
else if (scheduleType === 'initialize_Reports') {
        query = `UPDATE ${database}.[dbo].[ReportSchedule]  SET processStatusId = 1, ReportGenerationDate = DATEADD(HOUR, ${dayOffset}, GETDATE()) WHERE  IsDeleted = 0 `;
      }
      else if (scheduleType === 'ReportScheduler') {
        query = `UPDATE ${database}.[dbo].[ReportSchedule]  SET processStatusId = 1, ReportGenerationDate = DATEADD(MINUTE, ${dayOffset}, GETDATE()) WHERE  ReportTypeId = ${sourceInfoId}  AND IsDeleted = 0 `;
      }
      else if (scheduleType === 'initialize_WQReports') {
        // Source scheduler - set to past date (days offset)
        query = `UPDATE ${database}.[dbo].[WorkQueueSchedule]  SET processStatusId = 1, WorkQueueGenerationDate = DATEADD(HOUR, ${dayOffset}, GETDATE()) WHERE  IsDeleted = 0 `;
      }
       else if (scheduleType === 'WQScheduler') {
        query = `UPDATE ${database}.[dbo].[WorkQueueSchedule]  SET processStatusId = 1, workQueueGenerationDate = DATEADD(MINUTE, ${dayOffset}, GETDATE()) WHERE  ClientInfoId = ${sourceInfoId}  AND WorkQueueScheduleTypeId = ${scheduleId}  AND IsDeleted = 0 `;
      }
      else if (scheduleType === 'WQDNSScheduler') {
        query = `UPDATE ${database}.[dbo].[WorkQueueSchedule]  SET processStatusId = 1, workQueueGenerationDate = DATEADD(MINUTE, ${dayOffset}, GETDATE()) WHERE  ClientInfoId = ${sourceInfoId}  AND WorkQueueScheduleTypeId = ${scheduleId}  AND IsDeleted = 0 `;
      }
      await pool.request().query(query);
      console.log(`✓ Updated source schedule: ${scheduleType} (SourceInfoId=${sourceInfoId}, ScheduleId=${scheduleId})`);

      await pool.close();
    } catch (error) {
      console.error('Error updating source schedule:', error);
      throw error;
    }
  }

  /**
   * Log test data to CSV file for tracking and auditing
   * Equivalent to C# addrowdetailstoCGEInboundTestLogfile()
   */
  private static async addRowDetailsToLogFile(
    testData: ParsedTestData,
    generatedVIN: string,
    generatedAccountNumber: string,
    generatedTransactionID: string,
    generatedRegistrationNumber: string,
    processedRegistrationDate: string,
    processedExpiryDate: string
  ): Promise<void> {
    try {
      // Create log directory if it doesn't exist
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }

      // Generate log file name with timestamp
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const logFileName = `TestDataLog_${dateStr}.csv`;
      const logFilePath = path.join(this.logDirectory, logFileName);

      // Create header if file doesn't exist
      if (!fs.existsSync(logFilePath)) {
        const header = 'RowNumber,TestScenario,CorporationName,TransactionID,VIN,AccountNumber,' +
          'RegistrationDate,Province,Term,ExpiryDate,MaturityDate,LoanAmount,ContractType,' +
          'SecuredPartyName,SecuredPartyAddress,SecuredPartyCity,SecuredPartyProvince,' +
          'SecuredPartyPostalCode,SecuredPartyTransitCode,DebtorID,DebtorFN,DebtorMN,' +
          'DebtorLN_BusinessName,DOB,DebtorAddress,DebtorCity,DebtorProvince,DebtorPostalCode,' +
          'CollateralType,Make,Model,Year,DischargeDate,ExpiryDate2,RegistrationNumber,' +
          'Source,ServiceType,DischargeStatus,LienStatus,Cycle2,Cycle2_TranNumber,TwoDebtor,' +
          'DebtorID2,DebtorFN2,DebtorMN2,DebtorLN_BusinessName2,DOB2,DebtorAddress2,' +
          'DebtorCity2,DebtorProvince2,DebtorPostalCode2,CGeAction,LookUpAction,Timestamp\n';
        fs.writeFileSync(logFilePath, header);
      }

      // Helper function to safely get string value
      const safeString = (value: any): string => {
        if (value === null || value === undefined) return '';
        return String(value);
      };

      // Build CSV row with all test data
      const csvRow = [
        safeString(testData.testFileRowNumber),
        safeString(testData.testScenario),
        safeString(testData.corporationName),
        safeString(generatedTransactionID),
        safeString(generatedVIN),
        safeString(generatedAccountNumber),
        safeString(processedRegistrationDate),
        safeString(testData.provinceJurisdiction),
        safeString(testData.term),
        safeString(processedExpiryDate),
        safeString(testData.maturityDate),
        safeString(testData.loanAmount),
        safeString(testData.contractType),
        safeString(testData.securedPartyName),
        safeString(testData.securedPartyAddress),
        safeString(testData.securedPartyCity),
        safeString(testData.securedPartyProvince),
        safeString(testData.securedPartyPostalCode),
        safeString(testData.securedPartyTransitCode),
        safeString(testData.debtorID),
        safeString(testData.debtorFN),
        safeString(testData.debtorMN),
        safeString(testData.debtorLN_BusinessName),
        safeString(testData.dob),
        safeString(testData.debtorAddress),
        safeString(testData.debtorCity),
        safeString(testData.debtorProvince),
        safeString(testData.debtorPostalCode),
        safeString(testData.collateralType),
        safeString(testData.make),
        safeString(testData.model),
        safeString(testData.year),
        safeString(testData.dischargeDate),
        safeString(testData.expiryDate2),
        safeString(generatedRegistrationNumber),
        safeString(testData.source),
        safeString(testData.serviceType),
        safeString(testData.dischargeStatus),
        safeString(testData.status),
        safeString(testData.cycle2),
        safeString(testData.cycle2_TranNumber),
        safeString(testData.twoDebtor),
        safeString(testData.debtorID2),
        safeString(testData.debtorFN2),
        safeString(testData.debtorMN2),
        safeString(testData.debtorLN_BusinessName2),
        safeString(testData.dob2),
        safeString(testData.debtorAddress2),
        safeString(testData.debtorCity2),
        safeString(testData.debtorProvince2),
        safeString(testData.debtorPostalCode2),
        safeString(testData.cgeAction),
        safeString(testData.lookUpAction),
        now.toISOString()
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(',') + '\n';

      // Append to log file
      fs.appendFileSync(logFilePath, csvRow);

      console.log(`✓ Test data logged to: ${logFilePath}`);
    } catch (error) {
      console.error('Error writing to test log file:', error);
      // Don't throw - logging failure shouldn't stop the test
    }
  }
}