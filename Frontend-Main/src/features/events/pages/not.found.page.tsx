import "../css/not.found.page.css";
import { Link, useNavigate } from "react-router-dom";
export default function NotFoundPage(){

    const navigate = useNavigate();
    return(
        <div className="not-found-page">
                <section className="error-section">
                    <div className="error-container">
                        <div className="error-content">
                            <p className="error-code">404 error</p>
                            <h1 className="error-title">Vi kan inte hitta sidan</h1>
                            <p className="error-description">Förlåt, sidan du söker efter existerar inte.</p>

                            <div className="error-actions">                              
                                <button onClick={() => navigate(-1)}className="btn-secondary">
                                    <svg xmlns="http://www.w3.org/2000/svg">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                                    </svg>
                                    <span>Gå Tillbaka</span>
                                </button>
                            

                                <Link to="/">
                                <button className="btn-primary">
                                    Till hem
                                </button>
                                </Link>
                            </div>
                        </div>
                    </div>
            </section>
        </div>
    )
}