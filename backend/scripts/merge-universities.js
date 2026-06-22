const fs = require('fs');
const path = require('path');

const MAIN_DB_PATH = path.join(__dirname, '../universities.json');
const NEW_DATA_PATH = path.join(__dirname, 'pdf-programs.json');

try {
  const mainData = JSON.parse(fs.readFileSync(MAIN_DB_PATH, 'utf-8'));
  const newData = JSON.parse(fs.readFileSync(NEW_DATA_PATH, 'utf-8'));

  let addedCount = 0;
  let updatedCount = 0;

  // Create a fast lookup map based on a normalized key (university + program name)
  const mainMap = new Map();
  mainData.forEach((prog, index) => {
    const key = `${prog.university.trim().toLowerCase()}|${prog.name.trim().toLowerCase()}`;
    mainMap.set(key, { index, prog });
  });

  newData.forEach(newProg => {
    const key = `${newProg.university.trim().toLowerCase()}|${newProg.name.trim().toLowerCase()}`;
    
    if (mainMap.has(key)) {
      // Exist: Update fees or duration if they are different
      const existing = mainMap.get(key);
      let changed = false;
      
      if (newProg.fees !== 'N/A' && existing.prog.fees !== newProg.fees) {
        existing.prog.fees = newProg.fees;
        changed = true;
      }
      if (newProg.duration !== 'N/A' && existing.prog.duration !== newProg.duration) {
        existing.prog.duration = newProg.duration;
        changed = true;
      }
      
      if (changed) {
        mainData[existing.index] = existing.prog;
        updatedCount++;
      }
    } else {
      // New program: Add to mainData
      mainData.push({
        id: newProg.id,
        university: newProg.university,
        level: newProg.level,
        name: newProg.name,
        duration: newProg.duration,
        fees: newProg.fees
      });
      addedCount++;
    }
  });

  // Save back to main DB
  fs.writeFileSync(MAIN_DB_PATH, JSON.stringify(mainData, null, 2));

  console.log(`Merge completed successfully!`);
  console.log(`Original total: ${mainData.length - addedCount}`);
  console.log(`Newly added programs: ${addedCount}`);
  console.log(`Updated programs: ${updatedCount}`);
  console.log(`New total: ${mainData.length}`);

} catch (err) {
  console.error("Error merging data:", err);
}
