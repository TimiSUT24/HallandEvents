import type {Event} from "../../features/events/types/event";
import type {EventFilters} from "../../features/events/types/event.filter";

export function filterEvents(events: Event[], filter: EventFilters): Event[]{
    return events.filter(e => {

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
}