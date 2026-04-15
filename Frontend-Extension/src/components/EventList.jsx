import {useEffect, useState} from 'react';
import {getEvents} from '../services/api';
import '../CSS/eventlist.css';

const CATEGORIES = ['All','Barn', 'Bio', 'Dans', 'Föreläsning', 'Gratis', 'Guidad tur', 'Historia', 'Höstlov', 'Humor', 'Jul', 'Konst', 'Marknad', 'Mat', 'Musik', 'Natur', 'Nöje', 'Restaurang'
        , 'Sommarlov', 'Spel', 'Sport', 'Sportlov', 'Tävling', 'Teater', 'Ungdom', 'Utomhus', 'Utställning'
    ];
    
const EventList = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);
    const half = Math.ceil(CATEGORIES.length / 2);
    const displayedCategories = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, half);
    const [selectedCity, setSelectedCity] = useState('Falkenberg');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const itemsPerPage = 50; 

// Get the events
useEffect(() => {
    const fetchData = async () => {
        try{
            const response = await getEvents();
            setEvents(response);
        }catch(error){
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
}, []);


  const [open, setOpen] = useState(false);
  const cities = [
    "Falkenberg",
    "Varberg",
    "Halmstad",
    "Laholm",
    "Kungsbacka"
  ]


//filter events
const filteredEvents = events.filter((event) => {
const matchesCategory =
category === 'All' || !category || event.categories.includes(category);

const matchesSearch =
!search || event.title.toLowerCase().includes(search.toLowerCase());

const matchesCity = 
!selectedCity || event.ort?.toLowerCase() === selectedCity.toLocaleLowerCase();

return matchesCategory && matchesSearch && matchesCity;
});


const now = new Date();

const getStartTimeOrDefault = (time) => {
    if (!time) return '23:59';
    const normalized = time.replace(/[–—]/g, '-').replace(/\./g, ':');
    return normalized.split('-')[0].trim();
};

const upcomingEvents = filteredEvents.filter(event => {
    if (!event.dates || event.dates.length === 0) return false;

    return event.dates.some(date => {
    const startTime = getStartTimeOrDefault(date.time);
    const fullDateTime = new Date(`${date.startDate}T${startTime}`);
    return fullDateTime >= now;
});
});

const sortedEvents = [...upcomingEvents].sort((a, b) => {
const getFirstFutureDate = (dates) => {
    for (let date of dates) {
        const time = getStartTimeOrDefault(date.time);
        const fullDate = new Date(`${date.startDate}T${time}`);
        if (fullDate >= now) return fullDate;
    }
    return new Date(0); // fallback to oldest possible date
};

    const aDate = getFirstFutureDate(a.dates);
    const bDate = getFirstFutureDate(b.dates);

    return aDate - bDate;
});

//render events per page 
const pagedEvents = sortedEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
);
//set currentpage to 1 when switcing cities
useEffect(() => {
    setCurrentPage(1);
}, [search,category,selectedCity])

return(
    
    <div className="event-container">                        
            <header className="event-header">
                <div className ="event-header-background">
                <h1 className ="event-header-h1"><img src="IMG/calendar_icon.png" className="white-icon" width={20} height={20} /> Halland Events</h1>  
                <div className="city-dropdown-wrapper">
                    <div
                    className="city-dropdown-display"
                    onClick={() => setOpen(!open)}
                    >
                        <img src="IMG/map_pin_icon.png" alt="Location" className="location-image"
                        style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle' }}/>
                    <span>{selectedCity}, Sweden</span>
                    <span className={`arrow ${open ? "open" : ""}`}>▼</span>
                    </div>

                    {open && (
                        <ul className="city-dropdown-list">
                            
                        {cities.map((city) => (
                            <li
                            key={city}
                            className={`city-option ${
                                selectedCity === city ? "selected" : ""
                            }`}
                            onClick={() => {
                                setSelectedCity(city);
                                setOpen(false);
                            }}
                            >
                            {city} 
                            </li>
                            
                        ))}
                        </ul>
                    )}
                    </div>                            
                </div>
                </header>

                <div className ="event-search">        
                    <img src="IMG/search_icon.png" alt=""  className = "search-icon"/>        
                <input                 
                    type="text " 
                    placeholder="Search events..." 
                    value= {search}
                    onChange={(e) => setSearch(e.target.value)}                    
                />
                </div>
                <hr className ="event-hr" />
                <div className="category-filters">
                    {displayedCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={cat === category ? 'active' : ''}
                        >
                            {cat}
                        </button>                      
                    ))}
                    {!showAllCategories && (
                        <button className = "see-more-button" onClick={() => setShowAllCategories(true)}>Se Mer</button>
                    )}
                    {showAllCategories && (
                        <button className = "see-more-button" onClick={() => setShowAllCategories(false)}>Se Mindre</button>
                    )}
                </div>             

            <main className="event-list">                
                {loading ? (
                    <p className ="Placeholder-loading-events"> Loading events...</p>
                ) : errorMessage ? (
                    <p className ="Placeholder-loading-events">{errorMessage}</p>
                ) : pagedEvents.length === 0 ? (
                    <p className ="Placeholder-loading-events">No events available.</p>                
                ): (                                 
                    <>
                        <ul>
                            {pagedEvents.map((event, index) => (                               
                                <li key={index} className="event-card">
                                    {event.img && (
                                        <img src={event.img} alt={event.title} />
                                    )}                                   
                                    <div className="event-info">
                                        <h3>{event.title}</h3>                                                                                                                                                      
                                            {event.dates && event.dates.length > 0 && (
                                            <div className="event-dates">
                                                {event.dates
                                                .filter(date => date.startDate) //Only include dates with a valid startDate
                                                .map(date => (
                                                    <p key={date.id} className="event-description-p">
                                                    <img src="IMG/calendar_icon.png" alt="Calendar" />
                                                    {date.endDate && date.startDate !== date.endDate
                                                        ? `${date.startDate} - ${date.endDate}`
                                                        : date.startDate}
                                                    {date.time && (
                                                        <>
                                                        {' '}
                                                        <img src="IMG/clock_icon.png" alt="Clock" /> {date.time}
                                                        </>
                                                    )}
                                                    </p>
                                                ))}
                                            </div>
                                            )}                                       
                                        {event.location && (<p className ="event-description-p"><img src="IMG/map_pin_icon.png" alt="" /> {event.location}</p>)}
                                        {event.attendance && (<p className ="event-description-p"><img src="IMG/users_icon.png" alt="" />{event.attendance} Deltagare</p>)}
                                        {event.description && (<p className ="event-description">{event.description.length > 250 ?`${event.description.slice(0,250)}...` : event.description}</p>)} 
                                        {event.link && (
                                            <a href={event.link} target="_blank" rel="noopener noreferrer">Read more</a>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {/* Pagination Controls */}
                        <div className="pagination-controls">
                            <button
                            disabled={currentPage === 1}
                            onClick={() => {setCurrentPage(currentPage - 1)
                            document.querySelector('.event-container').scrollTop = 0;
                            }}
                            
                            >
                            Previous
                            </button>
                            <span>Page {currentPage}</span>
                            <button
                            disabled={currentPage * itemsPerPage >= sortedEvents.length}
                            onClick={() => {setCurrentPage(currentPage + 1)
                            document.querySelector('.event-container').scrollTop = 0;
                            }}
                            >
                            Next
                            </button>
                        </div>
                        <p className="footer">Showing {pagedEvents.length} events in Halland</p>
                    </>
                )}
            </main>
        </div>
    );
};

export default EventList;