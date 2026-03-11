import api from "../features/events/api/api";
import type { Event } from "../features/events/types/event";

export const eventService = {
    async getEvents(): Promise<Event[]>{
        const response = await api.get<Event[]>("/GetAllEvents");
        return response.data;
    }
}