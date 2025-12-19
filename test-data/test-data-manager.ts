/**
 * Test Data Manager
 * Migrated from C# TestData.cs
 * Handles loading and parsing test data from Excel files
 */

import XLSX from 'xlsx';
import type { TestDataRow, TestDataSummary, ParsedTestData } from './test-data.interface.js';

export class TestDataManager {
  private static testDataPath: string;
  private static testSheetName: string;
  private static currentTestData: ParsedTestData | null = null;

  /**
   * Initialize test data manager with Excel file path and test case ID
   * Equivalent to C# TestData constructor
   */
  static initialize(testDataPath: string, testCaseID: string): string {
    this.testDataPath = testDataPath;
    
    // Try to load TestDataSummary sheet to find the sheet name for this test case
    // If it doesn't exist, use testCaseID directly as sheet name
    try {
      const summarySheet = this.loadSheet<TestDataSummary>('TestDataSummary');
      const testCase = summarySheet.find(row => row.TestCaseID === testCaseID);
      
      if (testCase) {
        this.testSheetName = testCase.SheetName;
      } else {
        // If test case not found in summary, use testCaseID as sheet name
        this.testSheetName = testCaseID;
      }
    } catch (error) {
      // If TestDataSummary sheet doesn't exist, use testCaseID as sheet name
      console.log('TestDataSummary sheet not found, using testCaseID as sheet name');
      this.testSheetName = testCaseID;
    }
    return this.testSheetName;
  }

  /**
   * Get row count for the current test sheet
   * Equivalent to C# TestDataSheetRowCount
   */
  static getSheetRowCount(): number {
    if (!this.testSheetName) {
      throw new Error('TestDataManager not initialized. Call initialize() first.');
    }
    const data = this.loadSheet<any>(this.testSheetName);
    return data.length;
  }

  /**
   * Load CSV data row details by row number
   * Equivalent to C# LoadcsvDataRowDetails
   */
  static loadDataRow(rowNumber: number): ParsedTestData {
    const data = this.loadSheet<TestDataRow>(this.testSheetName);
    const row = data.find(r => Number(r.CSVFileRowNumber) === rowNumber);
    
    if (!row) {
      throw new Error(`Row number ${rowNumber} not found in sheet ${this.testSheetName}`);
    }

    // Parse the row data
    const parsedData: ParsedTestData = {
      testFileRowNumber: String(row.CSVFileRowNumber),
      testScenario: row['Test Scenario'],
      corporationName: row.CorporationName,
      transactionID: row['Transaction ID#'],
      vin: row['VIN#'],
      accountNumber: row['Account Number'],
      registrationDate: row['Registration Date'],
      provinceJurisdiction: row['Province/Jurisdiction'],
      term: row.Term,
      expiryDate: row['Expiry Date'],
      maturityDate: row['Maturity Date'],
      loanAmount: row['Loan Amount'],
      contractType: row['Contract Type'],
      securedPartyName: row['Secured Party Name'],
      securedPartyAddress: row['Secured Party Address'],
      securedPartyCity: row['Secured Party City'],
      securedPartyProvince: row['Secured Party Province'],
      securedPartyPostalCode: row['Secured Party Postal Code'],
      securedPartyTransitCode: row['Secured Party Transit Code'],
      debtorID: row['Debtor ID'],
      debtorFN: row['Debtor FN'],
      debtorMN: row['Debtor MN'],
      debtorLN_BusinessName: row['Debtor LN/Business Name'],
      dob: row.DOB,
      debtorAddress: row['Debtor Address'],
      debtorCity: row['Debtor City'],
      debtorProvince: row['Debtor Province'],
      debtorPostalCode: row['Debtor Postal Code'],
      collateralType: row.CollateralType,
      make: row.Make,
      model: row.Model,
      year: row.Year,
      dischargeDate: row['Discharge Date'],
      expiryDate2: row.ExpiryDate,
      state: row.State,
      source: row.Source,
      serviceType: row.ServiceType,
      dischargeStatus: row.DischargeStatus,
      status: row.Status,
      cycle2: row.Cycle2,
      cycle2_TranNumber: row.Cycle2TranNumber,
      registrationNumber: row.State,
      twoDebtor: row.TwoDebtor,
    };

    // Load second debtor if applicable (equivalent to C# TwoDebtor check)
    if (row.TwoDebtor === 'Yes' || row.TwoDebtor === '' || row.TwoDebtor === 'BUS') {
      parsedData.debtorID2 = row['Debtor ID2'];
      parsedData.debtorFN2 = row['Debtor FN2'];
      parsedData.debtorMN2 = row['Debtor MN2'];
      parsedData.debtorLN_BusinessName2 = row['Debtor LN/Business Name2'];
      parsedData.dob2 = row.DOB2;
      parsedData.debtorAddress2 = row['Debtor Address2'];
      parsedData.debtorCity2 = row['Debtor City2'];
      parsedData.debtorProvince2 = row['Debtor Province2'];
      parsedData.debtorPostalCode2 = row['Debtor Postal Code2'];
      parsedData.cgeAction = row.CGeAction;
      parsedData.lookUpAction = row.LookUpAction;
    }

    this.currentTestData = parsedData;
    return parsedData;
  }

  /**
   * Get current test data
   */
  static getCurrentTestData(): ParsedTestData | null {
    return this.currentTestData;
  }

  /**
   * Get test sheet name
   * Equivalent to C# GetTestDataSheetName
   */
  static getTestSheetName(): string {
    return this.testSheetName;
  }

  /**
   * Load a specific sheet from the Excel file
   * Helper method equivalent to C# DataHelper.LoadExcel
   */
  private static loadSheet<T>(sheetName: string): T[] {
    try {
      const workbook = XLSX.readFile(this.testDataPath);
      
      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet '${sheetName}' not found in workbook`);
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<T>(worksheet);
      
      return data;
    } catch (error) {
      throw new Error(`Error loading sheet '${sheetName}': ${error}`);
    }
  }

  /**
   * Load multiple rows by row numbers
   */
  static loadMultipleRows(rowNumbers: number[]): ParsedTestData[] {
    return rowNumbers.map(rowNum => this.loadDataRow(rowNum));
  }

  /**
   * Get all rows from current test sheet
   */
  static getAllRows(): TestDataRow[] {
    return this.loadSheet<TestDataRow>(this.testSheetName);
  }
}
