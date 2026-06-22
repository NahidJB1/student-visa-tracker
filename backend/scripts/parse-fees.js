const fs = require('fs');
const path = require('path');

const checkfilesDir = path.join(__dirname, '../../Checkfiles');
const outputFile = path.join(__dirname, '../data/universities-data.json');

// Ensure data dir exists
if (!fs.existsSync(path.dirname(outputFile))) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
}

const htmlFiles = fs.readdirSync(checkfilesDir).filter(f => f.endsWith('-fees.html'));

const allPrograms = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(checkfilesDir, file), 'utf-8');
  
  // Extract University Name
  // e.g. <title>ALFA University College – International Fee Structure 2026</title>
  const titleMatch = content.match(/<title>(.*?)[\–\-]/);
  const uniName = titleMatch ? titleMatch[1].trim() : file.replace('-fees.html', '').toUpperCase();

  // Extract panels/accordions
  // Usually follows <button class="accordion">LEVEL</button><div class="panel"><table>...</table></div>
  const levelBlocks = content.split(/<button class="accordion">/i);
  levelBlocks.shift(); // remove everything before first accordion

  for (const block of levelBlocks) {
    const levelMatch = block.match(/^(.*?)<\/button>/);
    let level = levelMatch ? levelMatch[1].trim() : 'Unknown Level';

    const tableMatch = block.match(/<table[\s\S]*?>([\s\S]*?)<\/table>/i);
    if (!tableMatch) continue;

    const rows = tableMatch[1].match(/<tr[\s\S]*?>[\s\S]*?<\/tr>/gi);
    if (!rows || rows.length < 2) continue; // Skip if no rows or only header

    // First row is header
    const headerRow = rows[0].match(/<th[\s\S]*?>([\s\S]*?)<\/th>/gi) || rows[0].match(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi);
    if (!headerRow) continue;
    
    const headers = headerRow.map(h => h.replace(/<\/?(th|td)[^>]*>/gi, '').trim().toLowerCase());

    // Find indices for key columns
    const progIdx = headers.findIndex(h => h.includes('program'));
    const durIdx = headers.findIndex(h => h.includes('duration'));
    
    // Find index for 'Total' or 'Total Fee' or last column if none found
    let feeIdx = headers.findIndex(h => h === 'total' || h.includes('total fee') || h.includes('total (myr)'));
    if (feeIdx === -1) {
      // If no explicit total column, try to find "Year 1" or just pick the last column as an estimate
      feeIdx = headers.length - 1;
    }

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].match(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi);
      if (!cols) continue;

      const getColText = (idx) => {
        if (idx === -1 || !cols[idx]) return 'N/A';
        return cols[idx].replace(/<\/?td[^>]*>/gi, '').replace(/<[^>]*>/g, '').trim();
      };

      const name = getColText(progIdx);
      const duration = getColText(durIdx);
      let fees = getColText(feeIdx);

      if (name && name !== 'N/A' && !name.toLowerCase().includes('total')) {
        allPrograms.push({
          id: `${uniName}-${name}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-' + i,
          university: uniName,
          level: level,
          name: name,
          duration: duration,
          fees: fees
        });
      }
    }
  }
}

fs.writeFileSync(outputFile, JSON.stringify(allPrograms, null, 2));
console.log(`Successfully parsed ${allPrograms.length} programs into ${outputFile}`);
