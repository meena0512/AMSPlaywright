// test-data.ts
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';


type Row = Record<string, any>;

class DataHelper {
  static loadExcel(filePath: string, sheetName: string): Row[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test data file not found: ${filePath}`);
    }
    const wb = XLSX.readFile(filePath, { cellDates: false });
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      throw new Error(`Sheet "${sheetName}" not found in: ${filePath}`);
    }

    // defval ensures missing cells become "" (closer to C# string casts)
    return XLSX.utils.sheet_to_json<Row>(ws, { defval: '' });
  }

  static findRow(rows: Row[], keyColumn: string, keyValue: string | number): Row {
    const row = rows.find(r => String(r[keyColumn]).trim() === String(keyValue).trim());
    if (!row) throw new Error(`Row not found where ${keyColumn}="${keyValue}"`);
    return row;
  }
}

export class TestData {
  // mirrors your C# static fields
  static dataRowTestData: Row | null = null;
  static TestSheetName = '';
  static testDataPathval = '';
  static TestFileRowNumber = '';
  static TestScenario = '';
  static CorporationName = '';
  static TransactionID = '';
  static VIN = '';
  static AccountNumber = '';
  static RegistrationDate = '';
  static Province_Jurisdiction = '';
  static Term = '';
  static ExpiryDate = '';
  static MaturityDate = '';
  static LoanAmount = '';
  static ContractType = '';
  static SecuredPartyName = '';
  static SecuredPartyAddress = '';
  static SecuredPartyCity = '';
  static SecuredPartyProvince = '';
  static SecuredPartyPostalCode = '';
  static SecuredPartyTransitCode = '';
  static DebtorID = '';
  static DebtorFN = '';
  static DebtorMN = '';
  static DebtorLN_BusinessName = '';
  static DOB = '';
  static DebtorAddress = '';
  static DebtorCity = '';
  static DebtorProvince = '';
  static DebtorPostalCode = '';
  static CollateralType = '';
  static Make = '';
  static Model = '';
  static Year = '';
  static DischargeDate = '';
  static ExpiryDate2 = '';
  static State = '';
  static Source = '';
  static ServiceType = '';
  static DischargeStatus = '';
  static Status = '';
  static Cycle2 = '';
  static Cycle2_TranNumber = '';
  static RegistrationNumber = '';
  static DebtorID2 = '';
  static DebtorFN2 = '';
  static DebtorMN2 = '';
  static DebtorLN_BusinessName2 = '';
  static DOB2 = '';
  static DebtorAddress2 = '';
  static DebtorCity2 = '';
  static DebtorProvince2 = '';
  static DebtorPostalCode2 = '';
  static TwoDebtor = '';
  static CGeAction = '';
  static LookUpAction = '';

  // constructor: loads TestDataSummary and resolves sheet by TestCaseID=testName
  constructor(testDataPath: string, testName: string) {
    TestData.testDataPathval = testDataPath;

    const summaryRows = DataHelper.loadExcel(testDataPath, 'TestDataSummary');
    const summaryRow = DataHelper.findRow(summaryRows, 'TestCaseID', testName);

    TestData.TestSheetName = String(summaryRow['SheetName'] ?? '').trim();
    if (!TestData.TestSheetName) {
      throw new Error(`SheetName missing for TestCaseID="${testName}" in TestDataSummary`);
    }
  }

  static testDataSheetRowCount(sheetname: string): number {
    const rows = DataHelper.loadExcel(TestData.testDataPathval, sheetname);
    return rows.length;
  }

  static loadcsvDataRowDetails(rownumber: number): void {
    const rows = DataHelper.loadExcel(TestData.testDataPathval, TestData.TestSheetName);
    const r = DataHelper.findRow(rows, 'CSVFileRowNumber', rownumber);

    TestData.dataRowTestData = r;

    // map columns exactly like your C# keys
    TestData.TestFileRowNumber = String(r['CSVFileRowNumber'] ?? '');
    TestData.TestScenario = String(r['Test Scenario'] ?? '');
    TestData.CorporationName = String(r['CorporationName'] ?? '');
    TestData.TransactionID = String(r['Transaction ID#'] ?? '');
    TestData.VIN = String(r['VIN#'] ?? '');
    TestData.AccountNumber = String(r['Account Number'] ?? '');
    TestData.RegistrationDate = String(r['Registration Date'] ?? '');
    TestData.Province_Jurisdiction = String(r['Province/Jurisdiction'] ?? '');
    TestData.Term = String(r['Term'] ?? '');
    TestData.ExpiryDate = String(r['Expiry Date'] ?? '');
    TestData.MaturityDate = String(r['Maturity Date'] ?? '');
    TestData.LoanAmount = String(r['Loan Amount'] ?? '');
    TestData.ContractType = String(r['Contract Type'] ?? '');
    TestData.SecuredPartyName = String(r['Secured Party Name'] ?? '');
    TestData.SecuredPartyAddress = String(r['Secured Party Address'] ?? '');
    TestData.SecuredPartyCity = String(r['Secured Party City'] ?? '');
    TestData.SecuredPartyProvince = String(r['Secured Party Province'] ?? '');
    TestData.SecuredPartyPostalCode = String(r['Secured Party Postal Code'] ?? '');
    TestData.SecuredPartyTransitCode = String(r['Secured Party Transit Code'] ?? '');
    TestData.DebtorID = String(r['Debtor ID'] ?? '');
    TestData.DebtorFN = String(r['Debtor FN'] ?? '');
    TestData.DebtorMN = String(r['Debtor MN'] ?? '');
    TestData.DebtorLN_BusinessName = String(r['Debtor LN/Business Name'] ?? '');
    TestData.DOB = String(r['DOB'] ?? '');
    TestData.DebtorAddress = String(r['Debtor Address'] ?? '');
    TestData.DebtorCity = String(r['Debtor City'] ?? '');
    TestData.DebtorProvince = String(r['Debtor Province'] ?? '');
    TestData.DebtorPostalCode = String(r['Debtor Postal Code'] ?? '');
    TestData.CollateralType = String(r['CollateralType'] ?? '');
    TestData.Make = String(r['Make'] ?? '');
    TestData.Model = String(r['Model'] ?? '');
    TestData.Year = String(r['Year'] ?? '');
    TestData.DischargeDate = String(r['Discharge Date'] ?? '');
    TestData.ExpiryDate2 = String(r['ExpiryDate'] ?? '');
    TestData.RegistrationNumber = String(r['State'] ?? '');
    TestData.Source = String(r['Source'] ?? '');
    TestData.ServiceType = String(r['ServiceType'] ?? '');
    TestData.DischargeStatus = String(r['DischargeStatus'] ?? '');
    TestData.Status = String(r['Status'] ?? '');
    TestData.Cycle2 = String(r['Cycle2'] ?? '');
    TestData.Cycle2_TranNumber = String(r['Cycle2TranNumber'] ?? '');
    TestData.TwoDebtor = String(r['TwoDebtor'] ?? '');

    if (TestData.TwoDebtor === 'Yes' || TestData.TwoDebtor === '' || TestData.TwoDebtor === 'BUS') {
      TestData.DebtorID2 = String(r['Debtor ID2'] ?? '');
      TestData.DebtorFN2 = String(r['Debtor FN2'] ?? '');
      TestData.DebtorMN2 = String(r['Debtor MN2'] ?? '');
      TestData.DebtorLN_BusinessName2 = String(r['Debtor LN/Business Name2'] ?? '');
      TestData.DOB2 = String(r['DOB2'] ?? '');
      TestData.DebtorAddress2 = String(r['Debtor Address2'] ?? '');
      TestData.DebtorCity2 = String(r['Debtor City2'] ?? '');
      TestData.DebtorProvince2 = String(r['Debtor Province2'] ?? '');
      TestData.DebtorPostalCode2 = String(r['Debtor Postal Code2'] ?? '');
      TestData.CGeAction = String(r['CGeAction'] ?? '');
      TestData.LookUpAction = String(r['LookUpAction'] ?? '');
    }
  }

  public static getTestDataSheetName(): string {
    return TestData.TestSheetName;
  }
}


