// import { useState, useEffect, useRef } from "react"
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "..//Login/Login.scss"
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// import StockList from "../../components/StockList"

const CreateUser = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const navigate = useNavigate()
    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="login-top-container">
                    <div className="user-container">
                    <label htmlFor="username">Create Username:</label>
                    <input id="username" type="text"  value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="pass-container">
                    <label htmlFor="password">Create Password:</label>
                    <input id="password" type="text"  value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className="submit-login" onClick={() => navigate("/login")}>Create Account</button>
                </div>
                
                {/* <div>
                    <div className="create-acc">Don't have an account? <a>Create one here.</a></div>
                </div> */}
            </div>
        </div>
        
    )
}

export default CreateUser;