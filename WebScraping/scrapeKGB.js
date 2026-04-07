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

        async function getCategories(page){

            await page.locator(".lp-filterable-list-control-group--button", {hasText: "Kategori"}).click();


                const responsePromise = page.waitForResponse(response =>
                    response.url().includes("svAjaxReqParam=ajax")
                );

                await page.locator('.lp-filterable-list-control').filter({hasText: "Barn och familj"}).locator('label span').click();
                
                const response = await responsePromise;
                const data = await response.json();
                const categories = data.categories?.[0]?.options?.map(option => ({
                        value: option.value
                    })) || [];

            return categories;

        }
        const categories = await getCategories(page);
        console.log(categories);
        const eventMap = new Map();
        
        for(const category of categories){
            console.log(`🔍 Scraping category "${category.value}"`);

            const categoryResponsePromise = page.waitForResponse(res =>
                res.url().includes("svAjaxReqParam=ajax")
            );           
            await page.locator('.lp-filterable-list-control').filter({hasText: category.value}).locator('label span').click();

            let response = await categoryResponsePromise;
            let data = await response.json();
            const items = data.items || [];
            const mappedCategories = normalizeCategories(category, 'kgb');
            console.log(data);
        }

        await page.waitForTimeout(5000);
    await browser.close();
})();