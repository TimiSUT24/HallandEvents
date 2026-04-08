const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {normalizeCategories} = require('./helpers/normalize.categories');
const {mapEvents} = require('./helpers/event.mapper');
const kgbCategories = 'https://kungsbacka.se/uppleva-och-gora/evenemang';
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
    
            await gotoWithRetry(page,kgbCategories);

    // ✅ Accept Cookiebot popup
        try {
            await page.getByRole('button', { name: 'Samtyck till alla kakor' }).click();
            console.log('✅ Cookie banner accepted using locator.');
        } catch (e) {
            console.log('⚠️ Cookie banner not found or already accepted.');
        }

       function formatDate(startDateObj, endDateObj){
            const formatTime = (timestamp) =>  {
                if(!timestamp) return "";

                return new Intl.DateTimeFormat("sv-SE",{
                    timeZone: "Europe/Stockholm",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }).format(new Date(Number(timestamp)));
            };

            const start = formatTime(startDateObj?.timestamp);
            const end = formatTime(endDateObj?.timestamp);

            if (start && end) return `${start} - ${end}`;
            if (start) return start;
            if (end) return end;      
            return "";   
        }

        async function getCategories(page){

                await page.locator(".lp-filterable-list-control-group--button", {hasText: "Kategori"}).click();


                const responsePromise = page.waitForResponse(response =>
                    response.url().includes("svAjaxReqParam=ajax")
                );

                await page.locator('.lp-filterable-list-control').filter({hasText: "Barn och familj"}).locator('label span').click();
                
                const response = await responsePromise;
                const data = await response.json();
                const categories = data.categories?.[0]?.categories?.map(option => ({
                        value: option.value
                    })) || [];
                await page.locator('.lp-filterable-list-control').filter({hasText: "Barn och familj"}).locator('label span').click();

                return categories;

        }
        const categories = await getCategories(page);
        const eventMap = new Map();
        console.log(categories);
        
        for(const category of categories){
            console.log(`🔍 Scraping category "${category.value}"`);

            const categoryResponsePromise = page.waitForResponse(res =>
                res.url().includes("svAjaxReqParam=ajax") &&
                res.url().includes("category_419fc51e-bd32-4c73-9f34-fb26456ece43")
            );           
            await page.locator('.lp-filterable-list-control').filter({hasText: category.value}).locator('label span').click();

            let response = await categoryResponsePromise;
            let data = await response.json();

            let items = data.items || [];
            const mappedCategories = normalizeCategories(category.value, 'kgb');
            
            const event = items.map(item => ({
                name: item?.name ?? "",
                link: item?.link ? `https://kungsbacka.se${item.link}` : "",
                img:  item?.image?.url ? `https://kungsbacka.se${item.image.url}` : "",
                ort: 'Kungsbacka',
                dates: [
                    {
                        startDate: item.date.startDate.screenreader ?? "",
                        endDate: item.date.endDate.screenreader ?? "",
                        time: formatDate(item?.date?.startDate, item?.date?.endDate)
                    }
                ]

            }));
            console.log(event);


            const eventKey = (event) => `${event.name}-${event.dates[0].startDate}`;
            mapEvents(eventMap,event,mappedCategories, eventKey);

            while(true){
                const nextButton = page.locator('.env-pagination__link--next');
                
                if (!(await nextButton.isVisible())) break;
                if (!(await nextButton.isEnabled())) break;

                const nextResponsePromise = page.waitForResponse(res =>
                    res.url().includes("svAjaxReqParam=ajax") &&
                    res.url().includes("category_419fc51e-bd32-4c73-9f34-fb26456ece43")
                );

                await nextButton.click();

                response = await nextResponsePromise;
                data = await response.json();

                items = data.items || [];
                
                const event = items.map(item => ({
                    name: item?.name ?? "",
                    link: item?.link ? `https://kungsbacka.se${item.link}` : "",
                    img:  item?.image?.url ? `https://kungsbacka.se${item.image.url}` : "",
                    ort: 'Kungsbacka',
                    dates: [
                        {
                            startDate: item.date.startDate.screenreader ?? "",
                            endDate: item.date.endDate.screenreader ?? "",
                            time: formatDate(item?.date?.startDate, item?.date?.endDate) 
                        }
                    ]

                }));
                console.log(event);

                const eventKey = (event) => `${event.name}-${event.dates[0].startDate}`;
                mapEvents(eventMap,event,mappedCategories, eventKey);
                
            }  
            
            await page.waitForTimeout(2000);
            await page.locator('.lp-filterable-list-control').filter({hasText: category.value}).locator('label span').click();       
        }

            const allEvents = Array.from(eventMap.values());
            const filePath = path.join(__dirname, 'eventsKGB.json');
            fs.writeFileSync(filePath, JSON.stringify(allEvents, null, 2), 'utf-8');
            console.log(`📝 Saved ${allEvents.length} events to eventsKGB.json`);
            await browser.close();
})();