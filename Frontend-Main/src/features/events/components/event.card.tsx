import type { Event } from "../types/event";
import { CiLocationOn } from "react-icons/ci";
import { BsPeopleFill } from "react-icons/bs";
import { CiCalendar } from "react-icons/ci";
import { MdAccessTime } from "react-icons/md";
import "../css/event.card.css";

type Props ={
    event: Event;
}

export default function EventCard({event}: Props){

    return(
        <div className="event-card">
            <div className="event-card-image">
                <img src={event.img} alt={event.title}/>
            </div>

                <div className="event-card-body">
                    <div className="event-card-body-content">
                        <h1>{event.title}</h1>
                        <p>{event.description && (<p className ="event-description">{event.description.length > 250 ?`${event.description.slice(0,250)}...` : event.description}</p>)} </p>
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