const fs = require('fs');
const path = require('path');
const {normalizeCategories} = require('./helpers/normalize.categories');
const {mapEvents} = require('./helpers/event.mapper');

const baseUrl = 'https://www.destinationhalmstad.se/evenemang';
const svTarget = '12.1ab5eabc17db94813782472d';

const swedishMonths = {
    januari: "01", jan: "01",
    februari: "02", feb: "02",
    mars: "03",
    april: "04", apr: "04",
    maj: "05",
    juni: "06",
    juli: "07",
    augusti: "08", aug: "08",
    september: "09", sep: "09",
    oktober: "10", okt: "10",
    november: "11", nov: "11",
    december: "12", dec: "12",
};

function convertToISODate(swedishDateStr) {
    if (!swedishDateStr) return null;
    const match = swedishDateStr.match(/(\d{1,2}) (\w+) (\d{4})/);
    if (!match) return null;
    const [_, day, monthName, year] = match;
    const month = swedishMonths[monthName.toLowerCase()];
    if (!month) return null;
    return `${year}-${month}-${day.padStart(2, "0")}`;
}

function parseDateString(dateStr) {
    if (!dateStr) return { startDate: null, endDate: null, time: undefined };

    let timePart;
    let datePart = dateStr;

    if (dateStr.includes(',')) {
        [datePart, timePart] = dateStr.split(',').map(s => s.trim());
    } else if (dateStr.includes('kl.')) {
        const klMatch = dateStr.match(/^(.*?)\s*kl\.\s*(.*)$/);
        if (klMatch) {
            datePart = klMatch[1].trim();
            timePart = klMatch[2].trim();
        }
    }

    if (datePart.includes('–')) {
        let [start, end] = datePart.split('–').map(s => s.trim());
        const yearMatch = end.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : null;
        const startIsOnlyDay = /^\d+$/.test(start.trim());
        if (startIsOnlyDay && year) {
            const monthMatch = end.match(/\d+\s+(\w+)/);
            if (monthMatch) start = `${start} ${monthMatch[1]} ${year}`;
        } else if (!/\d{4}/.test(start) && year) {
            start = `${start} ${year}`;
        }

        return {
            startDate: convertToISODate(start),
            endDate: convertToISODate(end),
            time: timePart ? timePart.replace(/\./g, ':') : undefined,
        };
    }

    return {
        startDate: convertToISODate(datePart),
        endDate: convertToISODate(datePart),
        time: timePart ? timePart.replace(/\./g, ':') : undefined,
    };
}

(async () => {
    const res = await fetch(baseUrl);
    const html = await res.text();

    const liRegex = /<li[^>]*class="[^"]*lp-cruncho-filter-multiselect-option[^"]*"[\s\S]*?<\/li>/gi;
    const categories = [];
    let liMatch;
    while ((liMatch = liRegex.exec(html)) !== null) {
        const li = liMatch[0];
        const valueMatch = li.match(/<input[^>]*value="([^"]*)"[^>]*\/?>/);
        const nameMatch = li.match(/<[a-z]+\b[^>]*>\s*([^<]+)\s*<\//);
        if (valueMatch && nameMatch) {
            categories.push({ slug: valueMatch[1], name: nameMatch[1].trim() });
        }
    }

    console.log(`Found ${categories.length} categories`);

    const eventMap = new Map();
    const headers = { 'X-Requested-With': 'XMLHttpRequest' };

    for (const cat of categories) {
        const mappedCategories = normalizeCategories(cat.name, 'hstd');
        if (!mappedCategories) {
            console.log(`⚠️ Skipping unknown category "${cat.name}"`);
            continue;
        }

        console.log(`🔍 Scraping category: ${cat.name}`);

        let page = 1;

        while (true) {
            const offset = (page - 1) * 15;
            const apiUrl = `${baseUrl}?sv.target=${svTarget}&sv.${svTarget}.route=/&dateFrom=&dateTo=&query=&venue=&area=&category=${encodeURIComponent(cat.slug)}&targetGroup=&view=grid&page=${page}&offset=${offset}&svAjaxReqParam=ajax`;

            const res = await fetch(apiUrl, { headers });
            const data = await res.json();
            const items = data?.events || [];

            if (!items.length) {
                console.log(`✅ Done with category ${cat.name}`);
                break;
            }

            const events = items.map(event => ({
                title: event.name || '',
                img: event.image?.link || '',
                ort: 'Halmstad',
                location: event.venue || 'Okänd plats',
                link: event.link ? `https://www.destinationhalmstad.se${event.link}` : '',
                description: event.description || '',
                dates: (event.dates?.entries || []).map(entry => parseDateString(entry))
            }));

            const eventKey = (event) =>
                `${event.title}-${event.dates[0].startDate}-${event.location}-${event.dates[0].time}`;

            mapEvents(eventMap, events, mappedCategories, eventKey);

            console.log(`📄 Page ${page} -> ${events.length} events`);

            if (data.nextPage === false) break;
            page++;
        }
    }

    const allEvents = Array.from(eventMap.values());
    const filePath = path.join(__dirname, 'eventsHSTD.json');
    fs.writeFileSync(filePath, JSON.stringify(allEvents, null, 2), 'utf-8');
    console.log(`📝 Saved ${allEvents.length} events to eventsHSTD.json`);
})();
