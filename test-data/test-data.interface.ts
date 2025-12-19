/**
 * Test Data Interfaces
 * Migrated from C# TestData.cs
 */

export interface TestDataRow {
  CSVFileRowNumber: string;
  'Test Scenario': string;
  CorporationName: string;
  'Transaction ID#': string;
  'VIN#': string;
  'Account Number': string;
  'Registration Date': string;
  'Province/Jurisdiction': string;
  Term: string;
  'Expiry Date': string;
  'Maturity Date': string;
  'Loan Amount': string;
  'Contract Type': string;
  'Secured Party Name': string;
  'Secured Party Address': string;
  'Secured Party City': string;
  'Secured Party Province': string;
  'Secured Party Postal Code': string;
  'Secured Party Transit Code': string;
  'Debtor ID': string;
  'Debtor FN': string;
  'Debtor MN': string;
  'Debtor LN/Business Name': string;
  DOB: string;
  'Debtor Address': string;
  'Debtor City': string;
  'Debtor Province': string;
  'Debtor Postal Code': string;
  CollateralType: string;
  Make: string;
  Model: string;
  Year: string;
  'Discharge Date': string;
  ExpiryDate: string;
  State: string;
  Source: string;
  ServiceType: string;
  DischargeStatus: string;
  Status: string;
  Cycle2: string;
  Cycle2TranNumber: string;
  TwoDebtor: string;
  'Debtor ID2': string;
  'Debtor FN2': string;
  'Debtor MN2': string;
  'Debtor LN/Business Name2': string;
  DOB2: string;
  'Debtor Address2': string;
  'Debtor City2': string;
  'Debtor Province2': string;
  'Debtor Postal Code2': string;
  CGeAction: string;
  LookUpAction: string;
}

export interface TestDataSummary {
  TestCaseID: string;
  SheetName: string;
}

export interface ParsedTestData {
  testFileRowNumber: string;
  testScenario: string;
  corporationName: string;
  transactionID: string;
  vin: string;
  accountNumber: string;
  registrationDate: string;
  provinceJurisdiction: string;
  term: string;
  expiryDate: string;
  maturityDate: string;
  loanAmount: string;
  contractType: string;
  securedPartyName: string;
  securedPartyAddress: string;
  securedPartyCity: string;
  securedPartyProvince: string;
  securedPartyPostalCode: string;
  securedPartyTransitCode: string;
  debtorID: string;
  debtorFN: string;
  debtorMN: string;
  debtorLN_BusinessName: string;
  dob: string;
  debtorAddress: string;
  debtorCity: string;
  debtorProvince: string;
  debtorPostalCode: string;
  collateralType: string;
  make: string;
  model: string;
  year: string;
  dischargeDate: string;
  expiryDate2: string;
  state: string;
  source: string;
  serviceType: string;
  dischargeStatus: string;
  status: string;
  cycle2: string;
  cycle2_TranNumber: string;
  registrationNumber: string;
  twoDebtor: string;
  debtorID2?: string;
  debtorFN2?: string;
  debtorMN2?: string;
  debtorLN_BusinessName2?: string;
  dob2?: string;
  debtorAddress2?: string;
  debtorCity2?: string;
  debtorProvince2?: string;
  debtorPostalCode2?: string;
  cgeAction?: string;
  lookUpAction?: string;
}
