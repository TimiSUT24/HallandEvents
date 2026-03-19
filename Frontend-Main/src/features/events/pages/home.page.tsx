import {useState, useEffect, useMemo} from "react";
import type { Event } from "../types/event";
import {eventService} from "../../../services/event.service";
import EventCard from "../components/event.card";
import ErrorMessages from "../components/errors.messages";
import {filterEvents} from "../../../shared/utils/filter.events";
import EventFilter from "../../filters/components/event.filter";
import type {EventFilters} from "../types/event.filter";
import PaginationControlled from "../components/pagination.controlled";
import { CiCalendar } from "react-icons/ci";
import "../css/home.page.css";

export default function HomePage(){
    const [events, setEvents] = useState<Event[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const pageSize = 12;

    const [filter, setFilter] = useState<EventFilters>({
        search: "",
        category: "",
        location: ""
    })

    useEffect(() => {
        setPage(1);

    }, [filter])
    
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

    //pagination
    const totalPages = Math.ceil(filteredEvents.length / pageSize);

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [totalPages]);

    const paginatedEvents = useMemo(() => {
        const start = (page -1) * pageSize;
        return filteredEvents.slice(start,start + pageSize);
    }, [filteredEvents, page]);


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

            <div className="home-page-event-count">
                <h2><CiCalendar/> {filteredEvents.length} evenemang hittade</h2>
            </div>
            <div className="events-grid">
                {paginatedEvents.map((e)=>{
                    return(
                        <EventCard key={e.id} event={e}/>
                    )
                })}
            </div>
            {totalPages > 1 && (<PaginationControlled page={page} totalPages={totalPages} onChange={setPage}/>)}
            {errors.length > 0 && <ErrorMessages messages={errors}/>}
            <footer>Halland Events</footer>
        </div>
    )
}