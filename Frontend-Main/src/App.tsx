import './App.css'
import {Routes, Route} from "react-router-dom";
import HomePage from "./features/events/pages/home.page";
import AboutWebPage from "./features/events/pages/about.web.page";
import NotFoundPage from "./features/events/pages/not.found.page";

function App() {

  return (
    <>
    <Routes>  
      <Route path="*" element={<NotFoundPage/>}/>
      <Route path="/" element={<HomePage/>}/>     
      <Route path="/about-web-page" element={<AboutWebPage/>}/>  
    </Routes>
    </>
  )
}

export default App
