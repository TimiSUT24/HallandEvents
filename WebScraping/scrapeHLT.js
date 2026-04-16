const fs = require("fs");
const path = require("path");
const { normalizeCategories } = require("./helpers/normalize.categories");
const { mapEvents } = require("./helpers/event.mapper");

const configUrl = "https://kalender.hylte.se/api/configuration";
const eventsApiUrl = "https://kalender.hylte.se/api/events";
const eventSiteUrl = "https://kalender.hylte.se/events";

(async () => {
    function formatTimeRange(start, end) {
        const format = (dateString) => {
            if (!dateString) return "";

            return new Date(dateString).toLocaleTimeString("sv-SE", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });
        };

        const from = format(start);
        const to = format(end);

        if (from && to) return `${from} - ${to}`;
        return from || to || "";
    }
    const eventMap = new Map();

    // 1. GET CATEGORIES
    const configRes = await fetch(configUrl);
    const configData = await configRes.json();

    const categories = configData?.categories || [];

    console.log(`Found ${categories.length} categories`);

    // 2. LOOP CATEGORIES
    for (const category of categories) {
        console.log(`🔍 Scraping category: ${category.name}`);

        let page = 1;

        while (true) {
            const url = `${eventsApiUrl}?page=${page}&filter[by_categories]=${category.id}`;

            const res = await fetch(url);
            const data = await res.json();

            const items = data?.events || data?.data || [];

            if (!items.length) {
                console.log(`✅ Done category ${category.name}`);
                break;
            }

            const mappedCategories = normalizeCategories(category.name, "hlt");

            const events = items.map(item => ({
                title: item?.title || "",
                link: item?.url || `${eventSiteUrl}/${item?.eventSlug}`,
                img: item?.posterUrls?.[2] || "",
                ort: "Hylte",
                dates: [
                    {
                        startDate: item?.startDate || "",
                        endDate: item?.endDate || "",
                        time: formatTimeRange(item?.eventTime, item?.eventEndTime) || ""
                    }
                ],
                location: item?.location || ""
            }));

            const eventKey = event =>
                `${event.link}-${event.dates[0].startDate}`;

            mapEvents(eventMap, events, mappedCategories, eventKey);

            console.log(`📄 Page ${page} -> ${events.length} events`);

            page++;
        }
    }

    const allEvents = Array.from(eventMap.values());
    const filePath = path.join(__dirname, "eventsHLT.json");
    fs.writeFileSync(filePath, JSON.stringify(allEvents, null, 2), "utf-8");

    console.log(`📝 Saved ${allEvents.length} events`);
})();