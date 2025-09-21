// import { useState, useEffect, useRef } from "react"
import "./Home.scss"
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// import StockList from "../../components/StockList"

const Home = () => {
// 
    return (
        <div className="homepage-wrapper">
            <div className="create-group-container">
                <button className="create-room-btn">Create Room</button>
            </div>
            <section className="groups-list-container">
                <h2 className="open-groups-heading">Open Groups With Friends</h2>
            </section>
        </div>
    )
}

export default Home;