type ErrorProps = {
    messages?: string[];
}

export default function ErrorMessages({messages}: ErrorProps){
    if(!messages || messages.length === 0 ) return null;

    return(
        <div className ="error-container">
            <ul>
                {messages.map((msg, i) => (<li key={i}>{msg}</li>))}
            </ul>
        </div>
    )
}