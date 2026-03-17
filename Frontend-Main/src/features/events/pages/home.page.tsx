import {useState, useEffect, useMemo} from "react";
import type { Event } from "../types/event";
import {eventService} from "../../../services/event.service";
import EventCard from "../components/event.card";
import ErrorMessages from "../components/errors.messages";
import {filterEvents} from "../../../shared/utils/filter.events";
import EventFilter from "../../filters/components/event.filter";
import type {EventFilters} from "../types/event.filter";
import "../css/home.page.css";

export default function HomePage(){
    const [events, setEvents] = useState<Event[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const [filter, setFilter] = useState<EventFilters>({
        search: "",
        category: "",
        location: ""
    })

    useEffect(() =>{
        async function fetchEvents(){
            try{
                const data = await eventService.getEvents();
                setEvents(data);
            }
            catch(error:any){
                setErrors(error.messages);
            }
        }
        fetchEvents();
    }, [])

    const categories = useMemo(() => [...new Set(events.flatMap(e => e.categories))],
    [events]);

    const cities = useMemo(
    () => [...new Set(events.map(e => e.ort))],
    [events]
    );

    const filteredEvents = useMemo(
    () => filterEvents(events, filter),
    [events, filter]
    );

    if(errors.length > 0) return <ErrorMessages messages={errors}/>
    return(
        <div className="home-page">
            <header> </header>
            <div className="home-page-filter">
                <EventFilter 
                filter={filter} 
                onChange={setFilter} 
                categories={categories} 
                cities={cities}/>
                
            </div>
            <div className="events-grid">
                {filteredEvents.map((e)=>{
                    return(
                        <EventCard key={e.id} event={e}/>
                    )
                })}
            </div>
            <footer>Halland Events</footer>

        </div>
    )
}