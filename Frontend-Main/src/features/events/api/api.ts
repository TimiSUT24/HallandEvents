import axios from "axios";


const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

api.interceptors.response.use((response) => response,
    async (error) => {

        //global error handling
        const data = error.response?.data;
        let messages: string[] = [];
        if(data?.error){
            messages.push(data.error);
        }
        else if(data?.errors){
            messages = Array.isArray(data.errors)
                ? data.errors
                : Object.values(data.errors).flat();
        }
        else if(data?.message){
            messages.push(data.message);
        }
        else{
            messages.push("Something went wrong");
        }

        error.messages = messages;

        return Promise.reject(error);
    }   
)


export default api;