import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import Client from 'ssh2-sftp-client';

/**
 * Utility for creating and uploading CSV files (Carfax, CleanList, Locator).
 * Migrated from C# csvFileUtility
 */
export class csvFileUtility {
  private static carfaxInboundFileName: string;
  private static carfaxInboundcsvpath: string;
  private static carfaxOutboundcsvpath = './csvfiles/CarfaxOutbound/';
  private static carfaxOutboundFileName: string;
  
  private static cleanlistInboundFileName: string;
  private static cleanlistInboundcsvpath: string;
  private static cleanlistOutboundcsvpath = './csvfiles/CleanListOutbound/';
  private static cleanlistOutboundFileName: string;
  
  private static locatorInboundFileName: string;
  private static locatorInboundcsvpath: string;
  private static locatorOutboundcsvpath = './csvfiles/LocatorOutbound/';
  private static locatorOutboundFileName: string;

  /**
   * Create and upload Carfax Inbound file based on scenario
   * @param page Playwright Page object
   * @param scenario Test scenario name
   */
  static async createAndUploadCarfaxInboundFile(page: Page, scenario: string): Promise<void> {
    // Step 1: Generate Carfax Inbound filename
    this.generateCarfaxInboundcsvFileName();
    
    // Step 2: Create Carfax Inbound CSV file with headers
    this.generateCarfaxcsvInboundFile();
    
    // Step 3: Add all row details to Carfax Inbound file based on scenario
    this.addAllrowdetailstoCarfaxInboundfile(scenario);
    
    // Step 4: Upload Carfax Inbound file to SFTP
    await this.uploadCarfaxInboundfile();
  }
  
  /**
   * Generate Carfax Inbound CSV filename with timestamp
   */
  private static generateCarfaxInboundcsvFileName(): void {
    const now = new Date();
    const timestamp = now.getFullYear() + 
      (now.getMonth() + 1).toString().padStart(2, '0') + 
      now.getDate().toString().padStart(2, '0') + '_' +
      now.getHours().toString().padStart(2, '0') + 
      now.getMinutes().toString().padStart(2, '0') + 
      now.getSeconds().toString().padStart(2, '0');
    
    this.carfaxInboundFileName = "Carfax_I_" + timestamp + ".csv";
    this.carfaxInboundcsvpath = path.join('./csvfiles/CarfaxInbound', this.carfaxInboundFileName);
    
    console.log(`Generated Carfax Inbound filename: ${this.carfaxInboundFileName}`);
  }
  
  /**
   * Create Carfax Inbound CSV file with header row
   */
  private static generateCarfaxcsvInboundFile(): void {
    // Ensure directory exists
    const dir = path.dirname(this.carfaxInboundcsvpath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Delete existing file if present
    if (fs.existsSync(this.carfaxInboundcsvpath)) {
      fs.unlinkSync(this.carfaxInboundcsvpath);
    }
    
    // Create file with header row
    const headerRow = '"VIN","RefNum","STATUS","VehicleYear","VehicleMake","VehicleModel","VehicleTrim","VehicleDrivetrain","VehicleEngine","VehicleTransmission","VehicleBodyStyle","CurrentRegistrationJurisdiction","LatestRegistrationDate","CurrentOwnershipType","LatestOwnerRegistrationDate","LatestOwnerRegistrationCity","LatestOwnerRegistrationJurisdiction","LatestOwnerRegistrationCountry","LatestOdometerKm","HasPotentialOdometerProblem","PotentialVinClone","LatestOdometerReadingDate","LatestOdometerReadingCity","LatestOdometerReadingProvince","LatestOdometerReadingCountry","IsExportedVehicle","LatestExportDate","IsCanadianRegistered","LatestCanadianRegisteredDate","LatestCanadianRegisteredProvince","IsUsRegistered","LatestUsRegistrationDate","LatestUsRegistrationCity","LatestUsRegistrationState","HasInterprovincialHistory","HasUsaHistory","LatestDamageDate","HasPoliceReportedAccident","IsSalvage","FirstSalvageDate","HasFireOrFloodDamage","LatestFireDamageDate","LatestFloodDamageDate","HasFrameDamage","FirstFrameDamageDate","LatestFrameDamageDate","DamageOverThresholdSingle","DamageOverThresholdSingleDate","IsStolen","FirstStolenVehicleDate","LatestStolenDate"\n';
    
    fs.writeFileSync(this.carfaxInboundcsvpath, headerRow);
    console.log(`✓ Created Carfax Inbound file: ${this.carfaxInboundFileName}`);
  }
  
  /**
   * Add all row details to Carfax Inbound file based on scenario
   * @param scenario Test scenario name
   */
  private static addAllrowdetailstoCarfaxInboundfile(scenario: string): void {
  // Get latest outbound file
  const outboundFiles = fs.readdirSync(this.carfaxOutboundcsvpath)
    .filter(f => f.toLowerCase().endsWith('.csv'))
    .map(f => ({ name: f, time: fs.statSync(path.join(this.carfaxOutboundcsvpath, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  if (outboundFiles.length === 0) {
    throw new Error('No Carfax Outbound file found');
  }
  const latestOutboundFile = path.join(this.carfaxOutboundcsvpath, outboundFiles[0].name);
  const outboundContent = fs.readFileSync(latestOutboundFile, 'utf-8');
  const lines = outboundContent.split('\r\n').filter(l => l.trim() !== '');
  // Use the generated date (MM/DD/YYYY)
  const carfaxDt = this.carfaxInboundDate;
  // Process all rows
  for (let i = 0; i < lines.length; i++) {
    const fields = this.parseCSVLine(lines[i]);
    if (!fields || fields.length < 2) continue;
    const vin = fields[0].replace(/"/g, '');
    const ref = fields[1].replace(/"/g, '');
    // VinRepo check (same as C#)
    if (!this.VinRepo.includes(vin)) {
      continue;
    }
    let appendText = '';
    switch (scenario) {
      case 'MVR':
        appendText =  `"${vin}","${ref}","","2000","Oldsmobile","Alero","","","","","","MB","${carfaxDt}","","","","","","5123","","","${carfaxDt}","Yorkton","MB","CAN","","${carfaxDt}","","${carfaxDt}","MB","False","","","","False","FALSE","","FALSE","False","","False","","","False","${carfaxDt}","","False","","False","",""\r\n`;
        break;
      default:
        continue;
    }
    // Ensure CRLF for new lines
    fs.appendFileSync(this.carfaxInboundcsvpath, appendText.replace(/(?<!\r)\n/g, '\r\n'));
  }
}
  /**
   * Generic SFTP upload method
   */
  private static async uploadInboundFileToSFTP(
    localFilePath: string,
    fileName: string,
    remotePath: string,
    fileType: string
  ): Promise<void> {
    const sftp = new Client();
    
    try {
      await sftp.connect({
        host: process.env.SFTP_HOST || 'uatcmsnonpci.trader.ca',
        port: 22,
        username: process.env.SFTP_USERNAME || 'cmslms_locator_uat',
        password: process.env.SFTP_PASSWORD || 'G8v!zKp3@Xq7#Tm9'
      });
      
      console.log('✓ Successfully connected to SFTP location');
      
      // Ensure directory exists
      if (!await sftp.exists(remotePath)) {
        await sftp.mkdir(remotePath, true);
      } else {
        // Delete all existing files in the directory
        const files = await sftp.list(remotePath);
        for (const file of files) {
          if (file.type !== 'd') { // Skip directories
            await sftp.delete(remotePath + file.name);
          }
        }
      }
      
      // Upload file
      const remoteFilePath = remotePath + fileName;
      await sftp.put(localFilePath, remoteFilePath);
      
      // Verify upload
      if (await sftp.exists(remoteFilePath)) {
        console.log(`✓ ${fileType} Inbound file uploaded to SFTP: ${fileName}`);
      } else {
        throw new Error(`${fileType} Inbound file upload verification failed`);
      }
      
    } catch (error) {
      console.error(`✗ ${fileType} SFTP upload failed:`, error);
      throw error;
    } finally {
      await sftp.end();
    }
  }
  
  /**
   * Upload Carfax Inbound file to SFTP server
   */
  private static async uploadCarfaxInboundfile(): Promise<void> {
    const remotePath = process.env.SFTP_CARFAX_IN_PATH || '/Carfax/in/';
    await this.uploadInboundFileToSFTP(
      this.carfaxInboundcsvpath,
      this.carfaxInboundFileName,
      remotePath,
      'Carfax'
    );
  }
  
  /**
   * Upload CleanList Inbound file to SFTP server
   */
  private static async uploadCleanlistInboundfile(): Promise<void> {
    const remotePath = process.env.SFTP_CLEANLIST_IN_PATH || '/Cleanlist/in/';
    await this.uploadInboundFileToSFTP(
      this.cleanlistInboundcsvpath,
      this.cleanlistInboundFileName,
      remotePath,
      'CleanList'
    );
  }
  
  /**
   * Upload Locator Inbound file to SFTP server
   */
  private static async uploadLocatorInboundfile(): Promise<void> {
    const remotePath = process.env.SFTP_LOCATOR_IN_PATH || '/Locator/in/';
    await this.uploadInboundFileToSFTP(
      this.locatorInboundcsvpath,
      this.locatorInboundFileName,
      remotePath,
      'Locator'
    );
  }
  
  /**
   * Create and upload CleanList Inbound file based on scenario
   * @param page Playwright Page object
   * @param scenario Test scenario name
   */
  static async createAndUploadCleanlistInboundFile(page: Page, scenario: string): Promise<void> {
    // Step 1: Generate CleanList Inbound filename
    this.generateCleanlistInboundcsvFileName();
    
    // Step 2: Create CleanList Inbound CSV file with headers
    this.generateCleanlistcsvInboundFile();
    
    // Step 3: Add all row details to CleanList Inbound file based on scenario
    this.addAllrowdetailstoCleanlistInboundfile(scenario);
    
    // Step 4: Upload CleanList Inbound file to SFTP
    await this.uploadCleanlistInboundfile();
  }
  
  /**
   * Generate CleanList Inbound CSV filename with timestamp
   * Filename format: processed_HK534720_I_YYYYMMDD_HHMMSS.csv
   */
  private static generateCleanlistInboundcsvFileName(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    
    this.cleanlistInboundFileName = `processed_HK534720_I_${year}${month}${day}_${hour}${minute}00.csv`;
    this.cleanlistInboundcsvpath = path.join('./csvfiles/CleanListInbound/', this.cleanlistInboundFileName);
    
    console.log(`✓ Generated CleanList Inbound filename: ${this.cleanlistInboundFileName}`);
  }
  
  /**
   * Generate CleanList Inbound CSV file with header row
   */
  private static generateCleanlistcsvInboundFile(): void {
    // Delete existing file if present
    if (fs.existsSync(this.cleanlistInboundcsvpath)) {
      fs.unlinkSync(this.cleanlistInboundcsvpath);
    }
    
    // Create CSV header row (28 columns)
    const headerRow = '"vin","debtor_id","fname","middle","lname","company","birthdate","add1","add2","city","prov","country","postal","corporation_id","ikey","nadd1","nadd2","ncity","nprov","npostal","ncountry","corcode","srp_action","ncoa","pn_code","pn_date","decmcode","decidkey"\n';
    
    fs.writeFileSync(this.cleanlistInboundcsvpath, headerRow);
    console.log(`✓ Created CleanList Inbound file: ${this.cleanlistInboundFileName}`);
  }
  
  /**
   * Add all row details to CleanList Inbound file based on scenario
   * @param scenario Test scenario name (using NO_NCOA_PCOA format)
   */
  private static addAllrowdetailstoCleanlistInboundfile(scenario: string): void {
    // Get latest CleanList Outbound file
    const outboundFiles = fs.readdirSync(this.cleanlistOutboundcsvpath)
      .filter(f => f.toLowerCase().endsWith('.csv'))
      .map(f => ({ name: f, time: fs.statSync(path.join(this.cleanlistOutboundcsvpath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
    
    if (outboundFiles.length === 0) {
      throw new Error('No CleanList Outbound file found to process');
    }
    
    this.cleanlistOutboundFileName = outboundFiles[0].name;
    const latestOutboundFile = path.join(this.cleanlistOutboundcsvpath, this.cleanlistOutboundFileName);
    
    // Read outbound file
    const outboundContent = fs.readFileSync(latestOutboundFile, 'utf-8');
    const lines = outboundContent.split('\n').filter(line => line.trim() !== '');
    
    // Skip header and process first data row
    if (lines.length > 1) {
      const fields = this.parseCSVLine(lines[1]);
      
      // Extract fields from outbound file
      const vin = fields[0]?.replace(/"/g, '') || '';
      const debtorID = fields[1]?.replace(/"/g, '') || '';
      const fname = fields[2]?.replace(/"/g, '') || '';
      const lname = fields[4]?.replace(/"/g, '') || '';
      const dob = fields[6]?.replace(/"/g, '') || '';
      const prov = fields[10]?.replace(/"/g, '') || '';
      
      // Build append text based on scenario (using NO_NCOA_PCOA format)
      let appendText = '';
      
      switch (scenario) {
        case 'NO_NCOA_PCOA':
        case 'NO_NIXIE':
        default:
          // Standard format with no NCOA/PCOA indicators
          appendText = `"${vin}","${debtorID}","${fname}","","${lname}","Trend Inc","${dob}","1590 GRAVELEY STREET","","North Vancouver","${prov}","CANADA","V7P 2A9","1","0000000001","1590 Graveley St","","North Vancouver","${prov}","V7P 2A9","Canada","S","S~14","B","M","","N",""\n`;
          break;
      }
      
      // Append to CleanList Inbound file
      fs.appendFileSync(this.cleanlistInboundcsvpath, appendText);
      console.log(`✓ Added row details to CleanList Inbound file (VIN: ${vin})`);
    }
    
    // Verify file has content
    const rowCount = fs.readFileSync(this.cleanlistInboundcsvpath, 'utf-8').split('\n').filter(line => line.trim() !== '').length;
    if (rowCount < 2) {
      throw new Error('CleanList Inbound file has no data rows');
    }
    
    console.log(`✓ CleanList Inbound file created with ${rowCount - 1} row(s)`);
  }
  
  /**
   * Create and upload Locator Inbound file based on scenario
   * @param page Playwright Page object
   * @param scenario Test scenario name
   */
  static async createAndUploadLocatorInboundFile(page: Page, scenario: string): Promise<void> {
    // Step 1: Generate Locator Inbound filename
    this.generateLocatorInboundcsvFileName();
    
    // Step 2: Create Locator Inbound CSV file with headers
    this.generateLocatorcsvInboundFile();
    
    // Step 3: Add all row details to Locator Inbound file based on scenario
    this.addAllrowdetailstoLocatorInboundfile(scenario);
    
    // Step 4: Upload Locator Inbound file to SFTP
    await this.uploadLocatorInboundfile();
  }
  
  /**
   * Generate Locator Inbound CSV filename with timestamp
   * Filename format: Locator_I_YYYYMMDD_HHMMSS.csv
   */
  private static generateLocatorInboundcsvFileName(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    
    this.locatorInboundFileName = `Locator_I_${year}${month}${day}_${hour}${minute}00.csv`;
    this.locatorInboundcsvpath = path.join('./csvfiles/LocatorInbound/', this.locatorInboundFileName);
    
    console.log(`✓ Generated Locator Inbound filename: ${this.locatorInboundFileName}`);
  }
  
  /**
   * Generate Locator Inbound CSV file with header row
   */
  private static generateLocatorcsvInboundFile(): void {
    // Delete existing file if present
    if (fs.existsSync(this.locatorInboundcsvpath)) {
      fs.unlinkSync(this.locatorInboundcsvpath);
    }
    
    // Create CSV header row (35 columns)
    const headerRow = 'Record Type,VIN,Event Date,Vehicle Year,Vehicle Make,Vehicle Model,Vehicle Style,Vehicle Color,Location,Location Phone,License Plate Number,License Plate State,License Plate Year,Reference #1,Reference #2,Notes,Ebay Item Number,Seizure Agency,Seized From,Seizure Value,Salvage Provider Number,Salvage Title Number,Salvage Title State,Salvage Dismantler License,Salvage Plant,Mileage,Salvage Condition,Salvage Stock Number,Salvage Purchased From,Salvage Sold To,Stolen Action,Client Reference Number,Impound Reason,Impound Status,File Date\n';
    
    fs.writeFileSync(this.locatorInboundcsvpath, headerRow);
    console.log(`✓ Created Locator Inbound file: ${this.locatorInboundFileName}`);
  }
  
  /**
   * Add all row details to Locator Inbound file based on scenario
   * @param scenario Test scenario name (Ebay, Salvage, Impound, Stolen, Liensale, Seizure, CBP, Ebay_Stolen)
   */
  private static addAllrowdetailstoLocatorInboundfile(scenario: string): void {
    // Get latest Locator Outbound file
    const outboundFiles = fs.readdirSync(this.locatorOutboundcsvpath)
      .filter(f => f.toLowerCase().endsWith('.csv'))
      .map(f => ({ name: f, time: fs.statSync(path.join(this.locatorOutboundcsvpath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
    
    if (outboundFiles.length === 0) {
      throw new Error('No Locator Outbound file found to process');
    }
    
    this.locatorOutboundFileName = outboundFiles[0].name;
    const latestOutboundFile = path.join(this.locatorOutboundcsvpath, this.locatorOutboundFileName);
    
    // Read outbound file
    const outboundContent = fs.readFileSync(latestOutboundFile, 'utf-8');
    const lines = outboundContent.split('\n').filter(line => line.trim() !== '');
    
    // Skip header and process first data row to get VIN
    if (lines.length > 1) {
      const fields = this.parseCSVLine(lines[1]);
      const vin = fields[0]?.replace(/"/g, '') || '';
      
      // Calculate dates
      const locatorDt = new Date();
      locatorDt.setDate(locatorDt.getDate() - 10);
      const locatorDtStr = (locatorDt.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                          locatorDt.getDate().toString().padStart(2, '0') + '/' + 
                          locatorDt.getFullYear();
      
      const locatorReportDt = new Date();
      locatorReportDt.setDate(locatorReportDt.getDate() - 9);
      const locatorReportDtStr = (locatorReportDt.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                                 locatorReportDt.getDate().toString().padStart(2, '0') + '/' + 
                                 locatorReportDt.getFullYear();
      
      // Build scenario-specific data
      const EbayData = `"EBAY","${vin}","${locatorDtStr}","2014","Volvo","ENCORE","BASE 4DR CROSSOVER","BLACK","","","","","","","","","20008629","","","","","","","","","","","","","","","2","","","${locatorReportDtStr}"\n`;
      const SalvageData = `"SALVAGE","${vin}","${locatorDtStr}","2014","Volvo","ENCORE","BASE 4DR CROSSOVER","BLACK","","","","","","","","20008629","","","","","ZCNLKQ950","","","","LKQ ACTION RECYCLED AUTO PARTS","41234","","Y01463","IMPACT AUTOS MANITOBA","","","2","","","${locatorReportDtStr}"\n`;
      const ImpoundData = `"IMPOUND","${vin}","${locatorDtStr}","2014","Volvo","ENCORE","BASE 4DR CROSSOVER","BLACK","DES MOINES PD","206-878-3301","12345654","MB","","5999","","REPO/LIEN HOLDER CAR CRAFT AUTO SALES","","","","","ZCNLKQ950","","","","LKQ ACTION RECYCLED AUTO PARTS","41234","","Y01463","IMPACT AUTOS MANITOBA","","","2","REPO","UNKNOWN","${locatorReportDtStr}"\n`;
      const LienSaleData = `"LIENSALE","${vin}","${locatorDtStr}","2014","Volvo","ENCORE","BASE 4DR CROSSOVER","BLACK","","","","","","","","REPO/LIEN HOLDER CAR CRAFT AUTO SALES","","","","","","","","","","","","","","","","2","","","${locatorReportDtStr}"\n`;
      const SeizureData = `"SEIZURE","${vin}","${locatorDtStr}","2014","Volvo","ENCORE","BASE 4DR CROSSOVER","BLACK","AB1002100","","","","","9MR744","","REPO/LIEN HOLDER CAR CRAFT AUTO SALES","","DOWNTON ABBEY","TEST","12000","","","","","","","","","","","","2","","","${locatorReportDtStr}"\n`;
      const CBPData = `"CBP","${vin}","${locatorDtStr}","2014","Volvo","ENCORE","BASE 4DR CROSSOVER","BLACK","","","","","","","","REPO/LIEN HOLDER CAR CRAFT AUTO SALES","","","","","","","","","","","","","","","","2","","","${locatorReportDtStr}"\n`;
      const StolenData = `"STOLEN","${vin}","${locatorDtStr}","2014","Volvo","ENCORE","BASE 4DR CROSSOVER","BLACK","DES MOINES PD","206-878-3301","12345654","MB","2010","5999","","20008629","","","","","ZCNLKQ950","","","","LKQ ACTION RECYCLED AUTO PARTS","41234","","Y01463","IMPACT AUTOS MANITOBA","","STOLEN","2","","","${locatorReportDtStr}"\n`;
      
      // Append data based on scenario
      switch (scenario) {
        case 'Ebay':
          fs.appendFileSync(this.locatorInboundcsvpath, EbayData);
          break;
        case 'Salvage':
          fs.appendFileSync(this.locatorInboundcsvpath, SalvageData);
          break;
        case 'Impound':
          fs.appendFileSync(this.locatorInboundcsvpath, ImpoundData);
          break;
        case 'Stolen':
          fs.appendFileSync(this.locatorInboundcsvpath, StolenData);
          break;
        case 'Liensale':
          fs.appendFileSync(this.locatorInboundcsvpath, LienSaleData);
          break;
        case 'Seizure':
          fs.appendFileSync(this.locatorInboundcsvpath, SeizureData);
          break;
        case 'CBP':
          fs.appendFileSync(this.locatorInboundcsvpath, CBPData);
          break;
        case 'Ebay_Stolen':
          fs.appendFileSync(this.locatorInboundcsvpath, EbayData);
          fs.appendFileSync(this.locatorInboundcsvpath, StolenData);
          break;
        default:
          fs.appendFileSync(this.locatorInboundcsvpath, EbayData);
          break;
      }
      
      console.log(`✓ Added ${scenario} row details to Locator Inbound file (VIN: ${vin})`);
    }
    
    // Verify file has content
    const rowCount = fs.readFileSync(this.locatorInboundcsvpath, 'utf-8').split('\n').filter(line => line.trim() !== '').length;
    if (rowCount < 2) {
      throw new Error('Locator Inbound file has no data rows');
    }
    
    console.log(`✓ Locator Inbound file created with ${rowCount - 1} row(s)`);
  }
  
  /**
   * Parse CSV line handling quoted fields
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      result.push(current);
    }
    
    return result;
  }
}

