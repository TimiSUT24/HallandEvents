const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {normalizeCategories} = require('./helpers/normalize.categories');
const varbergUrl = 'https://visitvarberg.se/evenemang';


(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    async function gotoWithRetry(page,url,retries = 3){
        for(let i = 0; i < retries; i++){
            try{
                await page.goto(url, { waitUntil: 'domcontentloaded',timeout: 60000 });
                return;
            }catch(err){
                console.log("Failed to load page", err.message);
                if(i === retries - 1) throw err;
                await page.waitForTimeout(3000);
            }
        }
    }
    await gotoWithRetry(page,varbergUrl);

    
    // ✅ Accept Cookiebot popup
    try {
        await page.getByRole('button', { name: 'Godkänn alla kakor' }).click();
        console.log('✅ Cookie banner accepted using locator.');
    } catch (e) {
        console.log('⚠️ Cookie banner not found or already accepted.');
    }

        async function getCategories(page) {
            const buttons = page.locator(
                'ul.vve-event-filters__categories-list li button.vve-event-filters__category'
            );

            const count = await buttons.count();
            const categories = [];

            for (let i = 0; i < count; i++) {
                const text = await buttons.nth(i).innerText();
                const category = text.trim();

                if (category) {
                    categories.push(category);
                }
            }

            return categories;
        }


    async function extractEvents(page){   
    
    // Extract events
    const events = await page.$$eval('ul[class^="vve-event-list"] > li', cards => {
    return cards.map(card => {
        const title = card.querySelector('a')?.innerText?.trim() || 'Okänd titel';
    
        const link = card.querySelector('a')?.href || '';
        const dateTime = card.querySelector('time[datetime]')?.getAttribute('datetime') || '';
        

        const locationElement = card.querySelector('p[class^="vve-event-list__venue"]');
        const location = locationElement?.innerText?.trim() || 'Okänd plats';

        const img = card.querySelector('img')?.src || '';
        const ort = 'Varberg';

        return { title, dates: [{startDate: dateTime}], link, location, img, ort};
    });
});

    return events;
    }

    //Scroll till finds button 
    async function scrollToLoadMoreButton(page) {
    const loadMoreButton = page.getByRole('button', { name: 'Läs in fler evenemang' });

    for (let i = 0; i < 5; i++) {
        const isVisible = await loadMoreButton.isVisible().catch(() => false);
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(1500);
        if(isVisible){
            console.log('Found button');
            return true;
        }
        
        }
        console.log('⚠️ "Läs in fler evenemang" button not found after scrolling.');
        return false;
    }

    const categories = await getCategories(page);
    const eventMap = new Map();

    for (const category of categories){
        
        const mappedCategories = normalizeCategories(category, 'vbg');
        if (!mappedCategories) {
            console.log(`⚠️ Skipping unknown category "${category}"`);
            continue;
        }
    console.log(`🔍 Selecting Varberg category "${category}" → Frontend category "${mappedCategories}"`);
        
    //remove previous selected category to prevent duplicates
    const removeButtons = page.locator('button[class^="vve-event-filters__category selected-category"]');
    const removeCount = await removeButtons.count();

    for (let i = 0; i < removeCount; i++) {
        const button = removeButtons.nth(0); // Always get the first one since they shift after removal
        const label = await button.getAttribute('aria-label');
        await button.click();
        console.log(`❌ Removed: ${label}`);
        await page.waitForTimeout(1000); // Wait briefly to allow UI to update
    }

    //Select new category
    const clickCategory = page.getByRole('button', { name: category });

// Try clicking; if not visible, scroll to top and retry
if (!(await clickCategory.isVisible().catch(() => false))) {
    console.log(`🔼 Scrolling to top to look for category "${category}"...`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500); // Wait for UI to update

    if (!(await clickCategory.isVisible().catch(() => false))) {
        console.log(`⚠️ Category "${category}" still not visible after scrolling. Skipping.`);
        continue; // Skip this category
    }
}

await clickCategory.click();
    
    //Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    //Loop Through all pages to get all event data 
    let currentPage = 1; 

    while(true){
        console.log(`Scraping page ${currentPage}`);
        const events = await extractEvents(page);     

        //Add category to each event
        const categorizedEvents = events.map(e => ({ ...e }));
        const eventKey = (event) => `${event.title}-${event.dates[0].startDate}-${event.location}`;

        // Use a Set to track unique keys      
        for (const event of categorizedEvents) {
        const key = eventKey(event);

        if (eventMap.has(key)) {
            // Already exists: push this category if not already present
            const existing = eventMap.get(key);
            
            for(const mappedCategory of mappedCategories){
                if (!existing.categories.includes(mappedCategory)) {
                    existing.categories.push(mappedCategory);
                }
            }
            
        } else {
            // New event: add with category as array
            eventMap.set(key, {
                ...event,
                categories: [...mappedCategories]
            });
        }
    }

        const found = await scrollToLoadMoreButton(page);
        if (!found){break;} 

        await page.getByRole('button', { name: 'Läs in fler evenemang' }).click(); 
        await page.waitForTimeout(1000);
        await page.waitForLoadState('domcontentloaded');
        currentPage++;
        }
    }

    const allEvents = Array.from(eventMap.values());
    console.log(allEvents);
    const filePath = path.join(__dirname, 'eventsVBG.json');
    fs.writeFileSync(filePath, JSON.stringify(allEvents, null, 2), 'utf-8');
    console.log('📝 Events saved to eventsVBG.json');

    await browser.close();
})();