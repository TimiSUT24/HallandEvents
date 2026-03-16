import './App.css'
import {Routes, Route} from "react-router-dom";
import HomePage from "./features/events/pages/home.page";

function App() {

  return (
    <>
    <Routes>
      <Route path="/" element={<HomePage/>}/>
    </Routes>
    </>
  )
}

export default App
