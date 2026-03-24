import type {Event} from "../../features/events/types/event";
import type {EventFilters} from "../../features/events/types/event.filter";
import {getToday, getEventDate} from "./date.helper";

export function filterEvents(events: Event[], filter: EventFilters): Event[]{
    const today = getToday();

    return events.filter(e => {
    
        const hasValidDate = e.dates.some(d => {
            const date = getEventDate(d);
            if(!date) return false;

            date.setHours(0,0,0,0);
            return date >= today;
        });

        if(!hasValidDate) return false;

        const matchesSearch =
        filter.search === "" ||
        e.title.toLowerCase().includes(filter.search.toLowerCase());

        const matchesCategory =
        filter.category === "" || 
        e.categories.includes(filter.category);

        const matchesLocation = 
        filter.location === "" ||
        e.ort.toLowerCase().includes(filter.location.toLowerCase());

        return matchesSearch && matchesCategory && matchesLocation;
    })
    .sort((a, b) => {
        const getClosestDate = (event: Event) => {
            const futureDates = event.dates
            .map(d => getEventDate(d))
            .filter((d): d is Date => !!d)
            .filter(d => {
                d.setHours(0, 0, 0, 0);
                return d >= today;
            });

            if (futureDates.length === 0) return new Date(9999, 0, 1);

            return new Date(Math.min(...futureDates.map(d => d.getTime())));
        };

        return getClosestDate(a).getTime() - getClosestDate(b).getTime();
    });
}