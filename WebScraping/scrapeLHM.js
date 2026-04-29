const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {normalizeCategories} = require('./helpers/normalize.categories');
const {mapEvents} = require('./helpers/event.mapper');
const {gotoWithRetry} = require('./helpers/goto.page');
const laholmUrl = 'https://visitlaholm.se/evenemang/evenemangskalender';
const apiMoreBase = 'https://visitlaholm.se/appresource/4.58e0ed1f18bfae8ae2b2cfa1/12.6e8488f818ecba3c53325ad2/more';

(async () => {
        const browser = await chromium.launch({ headless: true});
        const page = await browser.newPage();
    
        await gotoWithRetry(page,laholmUrl);

        // ✅ Accept Cookiebot popup
        try {
            await page.getByRole('button', { name: 'Godkänn alla kakor' }).click();
            console.log('✅ Cookie banner accepted using locator.');
        } catch (e) {
            console.log('⚠️ Cookie banner not found or already accepted.');
        }

        function buildTime(startTime, endTime) {
            if (startTime && endTime) return `${startTime} - ${endTime}`;
            return startTime || '';
        }       

         async function getCategories(page) {
            const filterContainer = page.locator('div.lOqrZKkiqa848fRo0KzY');

            const accordion = filterContainer.locator(
                'a.env-d--flex'
            );

            // Always expand first
            await accordion.click();
            await page.waitForTimeout(500);

            const labels = filterContainer.locator(
                'div.PWWhCPSFf2aGJ1OV5ClG label'
            );

            const count = await labels.count();
            const categories = [];

            for (let i = 0; i < count; i++) {
                const text = await labels.nth(i).innerText();
                const category = text.trim();

                if (category) {
                    categories.push(category);
                }
            }

            return [...new Set(categories)];
        }
        
        function getImageSrc(htmlString) {
            if (!htmlString) return '';
            const match = htmlString.match(/src=["']([^"']+)["']/);
            return match ? `https://visitlaholm.se${match[1]}` : '';
        }

        const categories = await getCategories(page);

        const eventMap = new Map();
        for (const category of categories) {
            console.log(`🔍 Scraping category "${category}"`);

            // Correctly pass 'checked[]' as query param
            const response = await page.request.get(apiMoreBase, {
            params: {
                length: 100,
                fromDate: '',
                toDate: '',
                freeTextSearch: '',
                'checked[]': category,
                forResident: false,
                svAjaxReqParam: 'ajax',

            }
            });

            if (!response.ok()) {
            console.log(`❌ Failed to fetch category ${category}: ${response.status()}`);
            continue;
            }

            const data = await response.json();
            const articles = data.articles || [];
            const mappedCategories = normalizeCategories(category, 'lhm');

                const event = articles.map(article => ({
                    title: article?.title || '',
                    description: article?.content || '',
                    img: getImageSrc(article?.image),
                    link: article?.url ? `https://visitlaholm.se${article.url}` : '',
                    ort: 'Laholm',
                    location: article?.place || '',
                    dates: [
                        {
                            startDate: article?.startDate ? article?.startDate?.split('T')[0] : "",
                            endDate: article?.endDate ? article?.endDate?.split('T')[0] : "",
                            time: buildTime(article?.startTime, article?.endTime) || ""
                        }
                    ]
                }));

                const eventKey = (event) => `${event.title}-${event.dates[0].startDate}-${event.location}`;
                mapEvents(eventMap, event, mappedCategories, eventKey);          
        }

        const allEvents = Array.from(eventMap.values());
        const filePath = path.join(__dirname, 'eventsLHM.json');
        fs.writeFileSync(filePath, JSON.stringify(allEvents, null, 2), 'utf-8');
        console.log(`📝 Saved ${allEvents.length} events to eventsLHM.json`);
        await browser.close();
})();