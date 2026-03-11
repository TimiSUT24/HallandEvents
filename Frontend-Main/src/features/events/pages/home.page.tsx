import {useState, useEffect} from "react";
import type { Event } from "../types/event";
import {eventService} from "../../../services/event.service";
import EventCard from "../components/event.card";

export default function HomePage(){
    const [events, setEvents] = useState<Event[]>([]);
    const [error, setError] = useState("");

    useEffect(() =>{
        async function fetchEvents(){
            try{
                const data = await eventService.getEvents();
                setEvents(data);
            }
            catch{
                setError("Could not load events");
            }
        }
        fetchEvents();
    }, [])

    if(error) return <p>{error}</p>
    return(
        <div className="home-page">
            <div className="events-grid">
                {events.map((event)=>{
                    return(
                        <EventCard key={event.id} event={event}/>
                    )
                })}
            </div>

        </div>
    )
}