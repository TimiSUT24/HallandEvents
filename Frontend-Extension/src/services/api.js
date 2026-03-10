import axios from 'axios'; 

const API_BASE_URL = import.meta.env.VITE_API_EVENTS_URL;

export const getEvents = async () => {
    try{
            const reponse = await axios.get(`${API_BASE_URL}`)
            return reponse.data;
    }catch (error){
        if(error.response && error.response.status === 503 || 429){
            throw new Error("Too many requests. Please try again later.");
        }
        else{
            throw new Error("Failed to fetch events. Please try again" , error.message);
        }
        
    }
}