export function getToday(){
    const today = new Date();
    const swedish = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Stockholm",
        year: "numeric",
        month: "numeric",
        day: "numeric"
    }).formatToParts(today);

    const year = Number(swedish.find(p => p.type === "year")?.value);
    const month = Number(swedish.find(p => p.type === "month")?.value);
    const day = Number(swedish.find(p => p.type === "day")?.value);

    return new Date(year, month - 1, day);
}

export function getEventDate(d: { startDate?: string }): Date | null {
    if (!d.startDate) return null;

    const [year, month, day] = d.startDate.split("-").map(Number);


    return new Date(year, month - 1, day);
}