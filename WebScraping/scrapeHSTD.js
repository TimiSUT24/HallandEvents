const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {normalizeCategories} = require('./helpers/normalize.categories');
const {mapEvents} = require('./helpers/event.mapper');
const halmstadUrl = 'https://www.destinationhalmstad.se/evenemang';

(async () => {
    const browser = await chromium.launch({ headless: true, slowMo: 100 });
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
    await gotoWithRetry(page,halmstadUrl);

    // ✅ Accept Cookiebot popup
    try {
        await page.getByRole("button", { name: "Samtyck till alla kakor" }).click();
        console.log("✅ Cookie banner accepted using locator.");
    } catch (e) {
        console.log("⚠️ Cookie banner not found or already accepted.");
    }

  // Scroll to trigger lazy loading

  async function extractEvents(page) {
        // Extract events
        const events = await page.$$eval(
        'ul[class^="lp-cruncho-event-list"] > li',
        (cards) => {
            const swedishMonths = {
            januari: "01",
            jan: "01",
            februari: "02",
            feb: "02",
            mars: "03",
            april: "04",
            apr: "04",
            maj: "05",
            juni: "06",
            juli: "07",
            augusti: "08",
            aug: "08",
            september: "09",
            sep: "09",
            oktober: "10",
            okt: "10",
            november: "11",
            nov: "11",
            december: "12",
            dec: "12",
            };

            function convertToISODate(swedishDateStr) {
            const match = swedishDateStr.match(/(\d{1,2}) (\w+) (\d{4})/);
            if (!match) return null;

            const [_, day, monthName, year] = match;
            const month = swedishMonths[monthName.toLowerCase()];
            if (!month) return null;

            const paddedDay = day.padStart(2, "0");
            return `${year}-${month}-${paddedDay}`;
            }

            function parseDateString(dateStr) {
            // Separate time if exists
            let [datePart, timePart] = dateStr.split(",").map((s) => s.trim());

            // Handle date range with "–"
            if (datePart.includes("–")) {
                // Split start and end
                let [start, end] = datePart.split("–").map((s) => s.trim());

                // To extract year, find the 4-digit year in end or start
                // Usually year is at the end, e.g. "16 augusti 2025"
                const yearMatch = end.match(/\d{4}/);
                const year = yearMatch ? yearMatch[0] : null;

                // For start date, if no year present, add year from end date
                const startYearPresent = /\d{4}/.test(start);

                // If start lacks year, add it
                if (!startYearPresent && year) start = `${start} ${year}`;

                return {
                startDate: convertToISODate(start),
                endDate: convertToISODate(end),
                time: timePart ? timePart.replace(/\./g, ":") : undefined,
                };
            } else {
                // Single date case
                return {
                startDate: convertToISODate(datePart),
                endDate: convertToISODate(datePart),
                time: timePart ? timePart.replace(/\./g, ":") : undefined,
                };
            }
            }

            return cards.map((card) => {
            const title =
                card.querySelector("h3")?.innerText?.trim() || "Okänd titel";
            let dates = [];

            // Get all li elements with lp-cruncho-event-date class (single or multiple dates)
            const liDateElements = card.querySelectorAll(
                'li[class^="lp-cruncho-event-date"]',
            );

            // Get all spans with class lp-cruncho-event-dates (for date ranges)
            const spanDateElements = card.querySelectorAll(
                "span.lp-cruncho-event-dates",
            );

            // Parse li elements
            for (const li of liDateElements) {
                const text = li.innerText.trim();
                if (!text) continue;

                const dateObj = parseDateString(text);
                dates.push(dateObj);
            }

            // Parse span elements with date ranges
            for (const span of spanDateElements) {
                const text = span.innerText.trim();
                if (!text) continue;

                const dateObj = parseDateString(text);
                dates.push(dateObj);
            }

            // If no dates found, fallback to single element with class containing date
            if (dates.length === 0) {
                const singleDateElement = card.querySelector(
                '[class*="lp-cruncho-event-date"], span.lp-cruncho-event-dates',
                );
                if (singleDateElement) {
                const dateObj = parseDateString(
                    singleDateElement.innerText.trim(),
                );
                dates.push(dateObj);
                }
            }

            const link = card.querySelector("a")?.href || "";

            const locationElement = card.querySelector(
                'span[class^="lp-cruncho-event-venue__name"]',
            );
            const location = locationElement?.innerText?.trim() || "Okänd plats";
            const description =
                card
                .querySelector('span[class^="lp-cruncho-event-excerpt__content"]')
                ?.innerText?.trim() || "";
            const img = card.querySelector("img")?.src || "";
            const ort = "Halmstad";

            return { title, dates, description, link, location, img, ort };
            });
        },
        );

        return events;
    }

    //Scroll till finds button
    async function scrollToLoadMoreButton(page) {
        const loadMoreButton = page.getByRole("button", {
        name: "Läs in fler evenemang",
        });
        const count = 8;
        for (let i = 0; i < count; i++) {
        const isVisible = await loadMoreButton.isVisible().catch(() => false);
        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(1500);
        if (isVisible) {
            console.log("Found button");
            if (i === 5) {
            return true;
            }
        }
        }
        console.log('"Läs in fler evenemang" button not found after scrolling.');
        return false;
    }

    const filterButton = page.locator('div.lp-cruncho-filter-toggle');
    const panelUL = 'div.lp-cruncho-filter-multiselect ul.lp-cruncho-filter-multiselect__list';

    // Open filter if not already "expanded"
    const isExpanded = await filterButton.getAttribute('aria-expanded');
    console.log('Filter button aria-expanded before click:', isExpanded);

    if (isExpanded !== 'true') {
    console.log('🔘 Clicking filter toggle to open panel...');
    await filterButton.click();
    await page.waitForTimeout(1000); // wait for JS to populate the list
    }

    // Wait for the <ul> to exist in the DOM, ignore visibility
    await page.waitForSelector(panelUL, { state: 'attached', timeout: 10000 });

    // Now safely read category inputs
    const categoryInputs = await page.$$eval(
    panelUL + ' > li.lp-cruncho-filter-multiselect-option input.lp-cruncho-filter-multiselect-option__input',
    (inputs) =>
        inputs.map(i => ({
        name: i.nextElementSibling?.innerText?.trim() || null,
        value: i.value || null,
        }))
    );

    console.log("Found categories:", categoryInputs);

    const eventMap = new Map();

    for (const cat of categoryInputs) {
        const category = cat.name;
        const mappedCategories = normalizeCategories(category, 'hstd');
        if (!mappedCategories) {
            console.log(`⚠️ Skipping unknown category "${category}"`);
            continue;
        }

        console.log(`🔍 Scraping category "${category}"`);

        const categoryUrl = `${halmstadUrl}?category=${cat.value}`;

        await page.goto(categoryUrl, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);

        let currentPage = 1;

        while (true) {
        console.log(`Scraping page ${currentPage}`);

        const events = await extractEvents(page);

        const eventKey = (event) => `${event.title}-${event.dates[0].startDate}-${event.location}`;
        mapEvents(eventMap, events, mappedCategories, eventKey);

        const found = await scrollToLoadMoreButton(page);
        if (!found) {
            break;
        }

        await page.getByRole("button", { name: "Läs in fler evenemang" }).click();
        await page.waitForTimeout(1000);
        await page.waitForLoadState("domcontentloaded");
        currentPage++;
        }
    }

    const allEvents = Array.from(eventMap.values());
    console.log(allEvents);
    const filePath = path.join(__dirname, 'eventsHSTD.json');
    fs.writeFileSync(
        filePath,
        JSON.stringify(allEvents, null, 2),
        "utf-8",
    );
    console.log(`📝 ${allEvents.length} Events saved to eventsHSTD.json`);

    await browser.close();
})();