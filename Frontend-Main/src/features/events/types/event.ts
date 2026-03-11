export interface EventDate{
    startDate?: string;
    endDate?: string;
    time: string;
}

export interface Event{
    id: number;
    title: string;
    description: string;
    location: string;
    link: string;
    img: string;
    categories: string[];
    attendance: number;
    ort: string;
    dates: EventDate[];
}