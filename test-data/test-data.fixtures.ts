/**
 * Test Data Fixtures
 * Sample test data for TC_AMS_ConfirmedMoveTrigger_CQ_DNS_LVS
 * 
 * This can be used instead of Excel files for simplified test data management
 */

import type { ParsedTestData } from './test-data.interface.js';

export const sampleTestData: ParsedTestData = {
  testFileRowNumber: '1',
  testScenario: 'MVR',
  corporationName: 'TEST_CORP',
  transactionID: 'TXN001',
  vin: '1HGBH41JXMN109186',
  accountNumber: 'ACC001',
  registrationDate: '2024-01-01',
  provinceJurisdiction: 'ON',
  term: '60',
  expiryDate: '2029-01-01',
  maturityDate: '2029-01-01',
  loanAmount: '25000',
  contractType: 'LEASE',
  securedPartyName: 'Test Bank',
  securedPartyAddress: '123 Main St',
  securedPartyCity: 'Toronto',
  securedPartyProvince: 'ON',
  securedPartyPostalCode: 'M5H 2N2',
  securedPartyTransitCode: '12345',
  debtorID: 'DBT001',
  debtorFN: 'John',
  debtorMN: 'A',
  debtorLN_BusinessName: 'Doe',
  dob: '1980-01-01',
  debtorAddress: '456 Oak Ave',
  debtorCity: 'Toronto',
  debtorProvince: 'ON',
  debtorPostalCode: 'M4B 1B3',
  collateralType: 'VEHICLE',
  make: 'HONDA',
  model: 'ACCORD',
  year: '2021',
  dischargeDate: '',
  expiryDate2: '2029-01-01',
  state: 'ON',
  source: 'Carfax',
  serviceType: 'MVR',
  dischargeStatus: 'ACTIVE',
  status: 'NEW',
  cycle2: 'NO',
  cycle2_TranNumber: '',
  registrationNumber: 'REG001',
  twoDebtor: 'NO',
};

export const confirmedMoveTriggerTestData: ParsedTestData[] = [
  {
    ...sampleTestData,
    testScenario: 'NO_NCOA_PCOA',
    vin: '1HGBH41JXMN109186',
    accountNumber: 'MVR_ACC_001',
  },
  {
    ...sampleTestData,
    testScenario: 'Ebay',
    vin: '2HGBH41JXMN109187',
    accountNumber: 'EBAY_ACC_001',
    source: 'DNS',
    serviceType: 'Ebay',
  },
];

/**
 * Test Data Repository
 * Organize test data by test case
 */
export class TestDataRepository {
  private static data: Map<string, ParsedTestData[]> = new Map([
    ['TC_AMS_ConfirmedMoveTrigger_CQ_DNS_LVS', confirmedMoveTriggerTestData],
  ]);

  static getTestData(testCaseID: string): ParsedTestData[] {
    const data = this.data.get(testCaseID);
    if (!data) {
      throw new Error(`No test data found for test case: ${testCaseID}`);
    }
    return data;
  }

  static getTestDataRow(testCaseID: string, index: number): ParsedTestData {
    const data = this.getTestData(testCaseID);
    if (index >= data.length) {
      throw new Error(`Index ${index} out of bounds for test case: ${testCaseID}`);
    }
    return data[index];
  }

  static addTestData(testCaseID: string, data: ParsedTestData[]): void {
    this.data.set(testCaseID, data);
  }
}
