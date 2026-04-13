import type { Event } from "../types/event";
import { CiLocationOn } from "react-icons/ci";
import { CiCalendar } from "react-icons/ci";
import { MdAccessTime } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import "../css/event.card.css";

type Props ={
    event: Event;
}

export default function EventCard({event}: Props){
    const fallback = "/IMG/calendar.png";
    return(
        <div className="event-card">
            <div className="event-card-image">
                <img
                    src={event.img ? event.img : fallback}
                    alt={event.title}
                    onError={(e) => {
                        const img = e.currentTarget;

                        if (img.dataset.fallback) return;

                        img.dataset.fallback = "true";
                        img.src = fallback;
                    }}
                    />
            </div>

                <div className="event-card-body">
                    <div className="event-card-body-content">
                        <h1>{event.title}</h1>
                        <p className="event-description">{event.description && (<span>{event.description.length > 250 ?`${event.description.slice(0,250)}...` : event.description}</span>)} </p>
                    </div>
                                    
                    <div className="event-card-location">
                        <p className="event-card-location-p"><CiLocationOn/> {event.location && `${event.location}, `}{event.ort}</p>
                    </div>
                    <div className="event-card-dates">
                        {event.dates.map((d) => (
                            <div key={d.id} className="event-date">
                                    {d.startDate && (
                                        <p><CiCalendar/> {d.startDate}</p>
                                        
                                    )}
                                    {d.time && (
                                        <p><MdAccessTime/> {d.time}</p>
                                    )}
                            </div>
                        ))}
                    </div>
                    <div className="event-card-link">
                        <a href={event.link} className="event-link">Läs mer</a>
                    </div>
                </div>
        </div>
    )
}