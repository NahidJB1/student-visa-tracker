const puppeteer = require('puppeteer');
const cron = require('node-cron');
const { queryAll, runQuery } = require('../config/db');

async function syncEMGSStatuses() {
  console.log('[EMGS Sync] Starting automated sync job...');
  
  try {
    const students = await queryAll(`
      SELECT id, passport_number, processing_status
      FROM students
      WHERE processing_status NOT IN ('Visa Rejected', 'Flight done', 'Offer letter issued', 'Visa Approved')
        AND passport_number IS NOT NULL
        AND passport_number != ''
    `);

    if (students.length === 0) {
      console.log('[EMGS Sync] No active students require syncing.');
      return;
    }

    console.log(`[EMGS Sync] Found ${students.length} students to sync. Launching browser...`);
    
    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    for (const student of students) {
      console.log(`[EMGS Sync] Checking passport: ${student.passport_number}`);
      try {
        await page.goto('https://visa.educationmalaysia.gov.my/emgs/application/searchForm/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for the input field
        await page.waitForSelector('#travelDocumentNumber', { timeout: 10000 });
        
        // Type the passport number
        await page.type('#travelDocumentNumber', student.passport_number);
        
        // NOTE: If Nationality is required by the form, we would need to add 'nationality' to our DB
        // and select it here like: await page.select('select[name="nationality"]', student.nationality_code);
        
        // Check the acknowledgment checkbox if it exists
        const checkboxExists = await page.$('#acknowledgement');
        if (checkboxExists) {
          await page.click('#acknowledgement');
        }

        // Submit the form
        await Promise.all([
          page.click('.btn-search, button[type="submit"]'),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
        ]);

        // Extract the progress percentage or status text
        // This is a placeholder selector for where EMGS usually displays the green percentage circle
        const percentageElement = await page.$('.progress-bar-success, .percentage-text, h3.progress-circle');
        
        if (percentageElement) {
          let text = await page.evaluate(el => el.textContent, percentageElement);
          text = text.trim();
          
          let newStatus = null;
          if (text.includes('15%')) newStatus = 'EMGS 15%';
          if (text.includes('32%')) newStatus = 'EMGS 32%';
          if (text.includes('35%')) newStatus = 'EMGS 35%';
          if (text.includes('70%')) newStatus = 'EMGS 70%';
          
          if (newStatus && newStatus !== student.processing_status) {
            console.log(`[EMGS Sync] Updating status for ${student.passport_number} to ${newStatus}`);
            await runQuery(
              'UPDATE students SET processing_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [newStatus, student.id]
            );
          } else {
            console.log(`[EMGS Sync] Status unchanged for ${student.passport_number}`);
          }
        } else {
          console.log(`[EMGS Sync] Could not find status elements for ${student.passport_number}`);
        }
      } catch (err) {
        console.error(`[EMGS Sync] Failed to sync ${student.passport_number}: ${err.message}`);
      }
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 3000));
    }

    await browser.close();
    console.log('[EMGS Sync] Sync job completed successfully.');
  } catch (error) {
    console.error('[EMGS Sync] Fatal error during sync:', error.message);
  }
}

// Schedule the job to run every night at 2:00 AM
function initEMGSCron() {
  console.log('[Cron] Initializing EMGS Sync Cron Job (runs at 02:00 AM daily)');
  cron.schedule('0 2 * * *', () => {
    syncEMGSStatuses();
  });
}

module.exports = { syncEMGSStatuses, initEMGSCron };
