import type { EventFilters } from "../../events/types/event.filter"
import Select from 'react-select'
import { CiSearch } from "react-icons/ci";
import "../css/event.filter.css"

type Props={
    filter: EventFilters;
    onChange: (filter: EventFilters) => void;
    categories: string[];
    cities: string[];
}
export default function EventFilter({filter, onChange, categories, cities}: Props){
    
    function update<K extends keyof EventFilters>(key: K, value: EventFilters[K]){
        onChange({...filter, [key]: value})
    }

    const cityOptions = cities.map(c => ({
        label: c,
        value: c
    }));

    return(
        <div className="filter-container">

            <div className="filter-section">
                <div className="filter-search-div">
                    <CiSearch/>
                    <input type="text" 
                    placeholder ="Search"
                    value={filter.search}
                    onChange={(e) => update("search", e.target.value)}/>
                </div>
                
                <Select
                options={cityOptions}
                value={cityOptions.find(o => o.value === filter.location) || null}
                onChange={(option) => update("location", option?.value ?? "")}
                placeholder ="All cities"
                isClearable
                className="filter-select"
                />

            </div>
            
            <div className ="category-buttons">
                <button
                className={!filter.category ? "active" : ""}
                onClick={() => update("category", "")}>
                    Alla
                </button>

                {categories.map(c => (
                    <button
                    key={c}
                    className={filter.category === c ? "active" : ""}
                    onClick={() => update("category", c)}>
                    {c}
                    </button>
                ))}
            </div>
        </div>
    )
}