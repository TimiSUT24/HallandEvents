const { chromium } = require('playwright');
const fs = require('fs');

const halmstadUrl = 'https://www.destinationhalmstad.se/evenemang';

const categoryMap = {
'Konst och utställning': ['Konst', 'Utställning'],
'Skapa och pyssla': ['Barn', 'Spel'],
'Kultur och historia': ['Historia'],
'Digitalt och teknik': ['Spel'],
'Festival och mässa': ['Nöje'],
'Mat och dryck': ['Mat', 'Restaurang'],
'Trädgård, mode och inredning': ['Utomhus'],
'Paket': ['Nöje'],
'Guidade turer och föreläsningar': ['Guidad tur', 'Föreläsning'],
'Barn och familj': ['Barn'],
'Litteratur och film': ['Föreläsning', 'Bio'],
'Marknad och loppis': ['Marknad'],
'Musik och konsert': ['Musik'],
'Natur, friluftsliv och cykel': ['Natur', 'Utomhus'],
'Spela spel och umgås': ['Spel'],
'Skollov': ['Sommarlov'],
'Jul och högtider': ['Jul'],
'Show och gala': ['Nöje'],
'Sport och hälsa': ['Sport'],
'Humor och standup': ['Humor'],
'Teater och dans': ['Teater', 'Dans'],
'Workshops och prova på': ['Föreläsning', 'Tävling']
};


(async () => {
    const browser = await chromium.launch({ headless: true, slowMo: 100 });
    const page = await browser.newPage();

    await page.goto(`${halmstadUrl}`, { waitUntil: "domcontentloaded" });

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

    // open filter once to read category values
    const filterButton = page.getByRole("button", { name: "Utökad filtrering" });
    const isExpanded = await filterButton.getAttribute("aria-expanded");

    if (isExpanded !== "true") {
        await filterButton.click();
        await page.waitForTimeout(500);
    }

    // read category values from inputs

    async function getCategoryInputs(page) {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
        await page.waitForSelector('li.lp-cruncho-filter-multiselect-option input.lp-cruncho-filter-multiselect-option__input', { timeout: 10000 });
        return await page.$$eval(
            "li.lp-cruncho-filter-multiselect-option input.lp-cruncho-filter-multiselect-option__input",
            (inputs) =>
            inputs.map((i) => ({
                name: i.nextElementSibling?.innerText.trim(),
                value: i.value,
            })),
        );
        } catch (err) {
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying...`);
        await page.waitForTimeout(1000);
        }
    }
    throw new Error('Failed to get category inputs after 3 attempts');
    }

    const categoryInputs = await getCategoryInputs(page);

    console.log("Found categories:", categoryInputs);

    const eventMap = new Map();

    for (const cat of categoryInputs) {
        const category = cat.name;
        const mappedCategory = categoryMap[category];

        if (!mappedCategory) {
        console.log(`Skipping unknown category "${category}"`);
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

        const eventKey = (event) => `${event.title}-${event.location}`;

        for (const event of events) {
            const key = eventKey(event);

            if (eventMap.has(key)) {
            const existing = eventMap.get(key);

            for (const c of mappedCategory) {
                if (!existing.categories.includes(c)) {
                existing.categories.push(c);
                }
            }
            } else {
            eventMap.set(key, {
                ...event,
                categories: [...mappedCategory],
            });
            }
        }

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

    fs.writeFileSync(
        "eventsHSTD.json",
        JSON.stringify(allEvents, null, 2),
        "utf-8",
    );
    console.log("📝 Events saved to eventsHSTD.json");

    await browser.close();
})();