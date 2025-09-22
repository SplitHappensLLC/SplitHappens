// import { useState, useEffect, useRef } from "react"
import "./Home.scss"
import { useNavigate } from 'react-router-dom';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// import StockList from "../../components/StockList"

const Home = ({userData}) => {
const navigate = useNavigate();

console.log(userData.user)
    const handleCreateRoom = async () => {
        const roomName = prompt("Enter room name")
        if(!roomName) return;

        try {
            const res = await fetch ('/api/groups', {
                method: "POST",
                headers: { 'Content-Type' : 'application/json'},
                body: JSON.stringify({ name: roomName, created_by: userData.user.id })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to creater room');

            navigate(`/room/${data.id}`)

        } catch (err) {
            console.error("Error creating room:", err)
        }

    }
    
    return (
        <div className="homepage-wrapper">
            <div className="create-group-container">
                <button className="create-room-btn" onClick={handleCreateRoom}>Create Room</button>
            </div>
            <section className="groups-list-container">
                <h2 className="open-groups-heading">Open Groups With Friends</h2>
            </section>
        </div>
    )
}

export default Home;