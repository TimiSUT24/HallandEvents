function mapEvents(eventMap, events, mappedCategories, keyFn) {
    for (const event of events) {
        const key = keyFn(event);

        if (eventMap.has(key)) {
            const existing = eventMap.get(key);
            for (const category of mappedCategories) {
                if (!existing.categories.includes(category)) {
                    existing.categories.push(category);
                }
            }
        } else {
            eventMap.set(key, {
                ...event,
                categories: [...mappedCategories],
            });
        }
    }
}

module.exports = { mapEvents };