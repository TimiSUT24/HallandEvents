const fs = require('fs');
const path = require('path');

function getEventFiles(dir) {
  const files = [];

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      files.push(...getEventFiles(full));
    } else if (file.startsWith('events') && file.endsWith('.json') && file !== 'allEvents.json') {
      files.push(full);
    }
  }

  return files;
}

const files = getEventFiles(__dirname);// scan in webscraping folder only 
console.log(files);
let mergedEvents = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const events = JSON.parse(content);

  if (!Array.isArray(events)) {
    console.warn(`⚠️ ${file} is not an array`);
    continue;
  }

  mergedEvents.push(...events);
  console.log(`✅ Loaded ${events.length} from ${file}`);
}
const filePath = path.join(__dirname, 'allEvents.json');
fs.writeFileSync(filePath, JSON.stringify(mergedEvents, null, 2));
console.log(`📝 Merged total: ${mergedEvents.length} events saved to allEvents.json`);