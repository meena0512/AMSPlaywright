import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import SftpClient from 'ssh2-sftp-client';

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

  // Strongly type these and initialize them
  static carfaxInboundDate: string = '';
  static VinRepo: string[] = []; // must not be undefined

  /** Optional helper to set VinRepo explicitly from tests */
  static setVinRepo(vins: string[]) {
    this.VinRepo = Array.isArray(vins) ? vins : [];
  }

  /** Optional helper to set inbound date explicitly */
  static setCarfaxInboundDate(mmddyyyy: string) {
    this.carfaxInboundDate = mmddyyyy;
  }

  static async createAndUploadCarfaxInboundFile(page: Page, scenario: string): Promise<void> {
    this.generateCarfaxInboundcsvFileName();
    this.generateCarfaxcsvInboundFile();

    // Ensure inbound date is set (avoid undefined)
    if (!this.carfaxInboundDate) {
      const d = new Date();
      this.carfaxInboundDate =
        `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    }

    this.addAllrowdetailstoCarfaxInboundfile(scenario);
    await this.uploadCarfaxInboundfile();
  }

  private static generateCarfaxInboundcsvFileName(): void {
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      '_' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    this.carfaxInboundFileName = 'Carfax_I_' + timestamp + '.csv';
    this.carfaxInboundcsvpath = path.join('./csvfiles/CarfaxInbound', this.carfaxInboundFileName);
  }

  private static generateCarfaxcsvInboundFile(): void {
    const dir = path.dirname(this.carfaxInboundcsvpath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(this.carfaxInboundcsvpath)) fs.unlinkSync(this.carfaxInboundcsvpath);

    const headerRow =
      '"VIN","RefNum","STATUS","VehicleYear","VehicleMake","VehicleModel","VehicleTrim","VehicleDrivetrain","VehicleEngine","VehicleTransmission","VehicleBodyStyle","CurrentRegistrationJurisdiction","LatestRegistrationDate","CurrentOwnershipType","LatestOwnerRegistrationDate","LatestOwnerRegistrationCity","LatestOwnerRegistrationJurisdiction","LatestOwnerRegistrationCountry","LatestOdometerKm","HasPotentialOdometerProblem","PotentialVinClone","LatestOdometerReadingDate","LatestOdometerReadingCity","LatestOdometerReadingProvince","LatestOdometerReadingCountry","IsExportedVehicle","LatestExportDate","IsCanadianRegistered","LatestCanadianRegisteredDate","LatestCanadianRegisteredProvince","IsUsRegistered","LatestUsRegistrationDate","LatestUsRegistrationCity","LatestUsRegistrationState","HasInterprovincialHistory","HasUsaHistory","LatestDamageDate","HasPoliceReportedAccident","IsSalvage","FirstSalvageDate","HasFireOrFloodDamage","LatestFireDamageDate","LatestFloodDamageDate","HasFrameDamage","FirstFrameDamageDate","LatestFrameDamageDate","DamageOverThresholdSingle","DamageOverThresholdSingleDate","IsStolen","FirstStolenVehicleDate","LatestStolenDate"\n';

    fs.writeFileSync(this.carfaxInboundcsvpath, headerRow);
  }

  private static addAllrowdetailstoCarfaxInboundfile(scenario: string): void {
    if (!fs.existsSync(this.carfaxOutboundcsvpath)) {
      throw new Error(`Carfax outbound folder not found: ${this.carfaxOutboundcsvpath}`);
    }

    const outboundFiles = fs
      .readdirSync(this.carfaxOutboundcsvpath)
      .filter((f) => f.toLowerCase().endsWith('.csv'))
      .map((f) => ({ name: f, time: fs.statSync(path.join(this.carfaxOutboundcsvpath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (outboundFiles.length === 0) throw new Error('No Carfax Outbound file found');

    const latestOutboundFile = path.join(this.carfaxOutboundcsvpath, outboundFiles[0].name);
    const outboundContent = fs.readFileSync(latestOutboundFile, 'utf-8');

    // handle both \r\n and \n
    const lines = outboundContent.split('\r\n').filter(l => l.trim() !== '');
    const carfaxDt = this.carfaxInboundDate;

    // Normalize VinRepo to a safe array, and optionally speed up with a Set
    const vinRepoList = Array.isArray(this.VinRepo) ? this.VinRepo : [];
    const vinRepoSet = new Set(vinRepoList);

    for (let i = 0; i < lines.length; i++) {
      const fields = this.parseCSVLine(lines[i]);
      if (!fields || fields.length < 2) continue;

      const vin = fields[0].replace(/"/g, '');
      const ref = fields[1].replace(/"/g, '');

      // If VinRepo is empty, decide desired behavior:
      // - current behavior: skip all rows
      // If you want "no filter when empty", replace condition with:
      // if (vinRepoList.length > 0 && !vinRepoSet.has(vin)) continue;
      if (!vinRepoSet.has(vin)) continue;

      let appendText = '';
      switch (scenario) {
        case 'MVR':
          appendText = `"${vin}","${ref}","","2000","Oldsmobile","Alero","","","","","","MB","${carfaxDt}","","","","","","5123","","","${carfaxDt}","Yorkton","MB","CAN","","${carfaxDt}","","${carfaxDt}","MB","False","","","","False","FALSE","","FALSE","False","","False","","","False","${carfaxDt}","","False","","False","",""\r\n`;
          break;
        default:
          continue;
      }

      fs.appendFileSync(this.carfaxInboundcsvpath, appendText);
    }
  }

  private static async uploadInboundFileToSFTP(
    localFilePath: string,
    fileName: string,
    remotePath: string,
    fileType: string
  ): Promise<void> {
    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: process.env.SFTP_HOST || 'uatcmsnonpci.trader.ca',
        port: 22,
        username: process.env.SFTP_USERNAME || 'cmslms_locator_uat',
        password: process.env.SFTP_PASSWORD || 'G8v!zKp3@Xq7#Tm9'
      });

      // Ensure remotePath ends with '/'
      if (!remotePath.endsWith('/')) remotePath += '/';

      const exists = await sftp.exists(remotePath);
      if (!exists) {
        await sftp.mkdir(remotePath, true);
      } else {
        const files = await sftp.list(remotePath);
        for (const file of files) {
          if (file.type !== 'd') {
            await sftp.delete(`${remotePath}${file.name}`);
          }
        }
      }

      const remoteFilePath = `${remotePath}${fileName}`;
      await sftp.put(localFilePath, remoteFilePath);

      if (!(await sftp.exists(remoteFilePath))) {
        throw new Error(`${fileType} Inbound file upload verification failed`);
      }
    } finally {
      await sftp.end();
    }
  }

  private static async uploadCarfaxInboundfile(): Promise<void> {
    const remotePath = process.env.SFTP_CARFAX_IN_PATH || '/Carfax/in/';
    await this.uploadInboundFileToSFTP(this.carfaxInboundcsvpath, this.carfaxInboundFileName, remotePath, 'Carfax');
  }

  // (rest of your CleanList / Locator code unchanged)

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

    result.push(current);
    return result;
  }
}
