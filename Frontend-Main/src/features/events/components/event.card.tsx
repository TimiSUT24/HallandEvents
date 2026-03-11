import type { Event } from "../types/event";

type Props ={
    event: Event;
}

export default function EventCard({event}: Props){
    const startDate = event.dates?.[0];
    const endDate = event.dates?.[1];

    return(
        <div className="event-card">
            <div className="event-card-image">
                <img src={event.img} alt={event.title}/>

                <div className="event-card-body">
                    <h1>{event.title}</h1>
                    <p>{event.description}</p>
                    <p>{event.attendance}</p>
                    <div className="event-card-location">
                        <p>{event.location}</p>
                        <p>{event.ort}</p>
                    </div>
                    <div className="event-card-dates">
                        <p>{startDate?.startDate}</p>
                        <p>{endDate?.endDate}</p>
                        <p>{startDate.time}</p>
                    </div>
                    <a href={event.link} className="event-link">Read more</a>
                </div>

            </div>

        </div>
    )
}