const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {normalizeCategories} = require('./helpers/normalize.categories');
const {mapEvents} = require('./helpers/event.mapper');
const {gotoWithRetry} = require('./helpers/goto.page');
const falkenbergUrl ='https://falkenberg.se/evenemang';

(async () => {
    const browser = await chromium.launch({ headless: true});
    const page = await browser.newPage();
    await gotoWithRetry(page,falkenbergUrl);
    
    // ✅ Accept Cookiebot popup
    try {
        await page.getByRole('button', { name: 'Tillåt' }).click();
        console.log('✅ Cookie banner accepted using locator.');
    } catch (e) {
        console.log('⚠️ Cookie banner not found or already accepted.');
    }
    
    async function scrollToLoadAll(page) {
    let previousHeight = 0;
    while (true) {
        // Scroll to bottom
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1500); // wait for lazy-loaded events

        // Get current scroll height
        const currentHeight = await page.evaluate(() => document.body.scrollHeight);

        // Stop if height hasn’t changed
        if (currentHeight === previousHeight) break;
        previousHeight = currentHeight;
    }
}
    // Scroll to trigger lazy loading
    async function extractEvents(page){

        await scrollToLoadAll(page);       
    
    // Extract events
    const events = await page.$$eval('#events-container > a', cards => {

        const months = {
            jan: '01', januari: '01',
            feb: '02', februari: '02',
            mar: '03', mars: '03',
            apr: '04', april: '04',
            maj: '05',
            jun: '06', juni: '06',
            jul: '07', juli: '07',
            aug: '08', augusti: '08', 'aug.': '08',
            sep: '09', september: '09',
            okt: '10', oktober: '10',
            nov: '11', november: '11',
            dec: '12', december: '12'
        };

        return cards.map(card => {
            const title = card.querySelector('h2')?.innerText?.trim() || "";
            const dateContainer = card.querySelector('div[class^="event-date-section"]');
            const monthText = dateContainer?.querySelector('div[class*="date-month"]')?.innerText?.trim()?.toLowerCase() || "";
            const dayText = dateContainer?.querySelector('div[class*="date-day"]')?.innerText?.trim()?.padStart(2, '0') || "";
            const link = card.href; 
            const description = card.querySelector('div[class^="event-excerpt"]')?.innerText?.trim() || "";

            const normalizedMonth = monthText?.replace('.', '') || '';
            const month = months[normalizedMonth] || '01';
            const day = dayText?.padStart(2, '0') || '01';
            const year = new Date().getUTCFullYear();
            const startDate = `${year}-${month}-${day}`;


            const rawLocation = card.querySelector('div[class^="event-time-location"]')?.innerText?.trim() || "";
            const parts = rawLocation.split(" - ") || ""
            let time = "";
            let location = "";

            if(parts.length >= 3){
                time = `${parts[0]} - ${parts[1]}`;
                location = parts.slice(2).join(" - ");
            } else if (parts.length === 2) {
                    time = parts[0];
                    location = parts[1];
                } else {
                    location = rawLocation;
                }

                location = location.replace(/\bFalkenberg\b/g, '').trim();
                location = location.replace(/(^,)|(,$)/g, '').trim();

            const img = card.querySelector('img')?.src;
            const ort = 'Falkenberg'
            return { title,dates:[{startDate, time}], link, description, location, img, ort};
        });
    });

    return events;
    }

    const filterContainer = page.locator('div[class^="event-tags-filter"]'); 
    const buttons = filterContainer.locator("button.tag-filter-btn");
    const count = await buttons.count();

    const categoryNames = [];
    for (let i = 0; i < count; i++){
        const btnText = await buttons.nth(i).evaluate(btn => {
            const clone = btn.cloneNode(true);
            clone.querySelectorAll('span').forEach(s => s.remove());
            return clone.textContent.trim() || "";
        })

        if(btnText && btnText !== "Alla evenemang" && btnText !== null){
            console.log(btnText);
            categoryNames.push(btnText);
        }
    }


    const eventMap = new Map();

    for (const category of categoryNames){         
        
        const mappedCategories = normalizeCategories(category, 'fbg');
        if (!mappedCategories) {
            console.log(`⚠️ Skipping unknown category "${category}"`);
            continue;
        }
        console.log(`Selecting category ${category}`)
        
        const targetButton = filterContainer.locator("button.tag-filter-btn", {hasText: category}).first();
        await targetButton.click();
        console.log(`✅ Selected: ${category}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        let currentPage = 1; 
        //Loop Through all pages to get all event data 
        while(true){
            console.log(`Scraping page ${currentPage}`);
            const events = await extractEvents(page);     

            const eventKey = (event) => `${event.title}-${event.dates[0].startDate}-${event.location}`;
            mapEvents(eventMap, events, mappedCategories, eventKey);


            const nextPage = page.locator('button.ajax-page-btn', {has: page.locator('span', {hasText: 'Nästa sida'})});
            if(await nextPage.count() > 0){
                await nextPage.first().click();
                await page.waitForTimeout(1500);

                await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
                await page.waitForTimeout(1000);
                
            }else{
                console.log('No more pages found');
                break
            }                
            
            currentPage++;
        }

        await targetButton.click();
        console.log(`✅ Deselected: ${category}`);
    }

    const allEvents = Array.from(eventMap.values());
    console.log(allEvents);
    const filePath = path.join(__dirname, 'eventsFBG.json');
    fs.writeFileSync(filePath, JSON.stringify(allEvents, null, 2), 'utf-8');
    console.log(`📝 ${allEvents.length} Events saved to eventsFBG.json`);

    await browser.close();
})();
