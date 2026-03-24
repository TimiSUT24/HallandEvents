import "../css/about.web.page.css";

export default function AboutWebPage(){
    return (
        <div className="about-web-page">
            <header>
                <h1>Om webbplatsen</h1>
            </header>
            <div className="about-web-page-content">
                <p>Halland Events samlar evenemang från flera kommuner i Halland, inklusive Falkenberg, Varberg, Halmstad, 
                    för att göra det enklare att hitta vad som händer i regionen på ett och samma ställe.
                </p>

                <p>
                    Informationen hämtas automatiskt från offentliga källor. Därför kan viss information ibland vara ofullständig,
                    föråldrad eller innehålla mindre fel. för helt korrekt och uppdaterad information rekommenderas att du 
                    besöker arrangörens eller kommunens offciella webbplats, kan enkelt göras genom att klicka på något av evenemangens kort
                    där det står läs mer.
                </p>

                <p>
                    Målet är att ge en så komplett och aktuell överblick som möjligt, och i de flesta fall stämmer
                    informationen väl och täcker majoriteten av tillgängliga evenemang. 
                </p>
            </div>

        </div>
    )
}