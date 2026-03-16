import {useState, useEffect} from "react";
import type { Event } from "../types/event";
import {eventService} from "../../../services/event.service";
import EventCard from "../components/event.card";
import ErrorMessages from "../components/errors.messages";
import "../css/home.page.css";

export default function HomePage(){
    const [events, setEvents] = useState<Event[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

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

    if(errors.length > 0) return <ErrorMessages messages={errors}/>
    return(
        <div className="home-page">
            <header> s</header>
            <div className="home-page-filter">
                s
            </div>
            <div className="events-grid">
                {events.map((e)=>{
                    return(
                        <EventCard key={e.id} event={e}/>
                    )
                })}
            </div>

        </div>
    )
}