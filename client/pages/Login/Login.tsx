// import { useState, useEffect, useRef } from "react"
import React, { useState } from "react";
import {Link} from "react-router-dom"
import "./Login.scss"
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// import StockList from "../../components/StockList"

const Login = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
    }
// 
    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="login-top-container">
                    <div className="user-container">
                    <label htmlFor="username">Username:</label>
                    <input id="username" type="text"  value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="pass-container">
                    <label htmlFor="password">Password:</label>
                    <input id="password" type="text"  value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className="submit-login" onClick={handleSubmit}>Sign In</button>
                </div>
                
                <div>
                    <div className="create-acc">Don't have an account? < Link to="/create-account">Create one here.</Link></div>
                </div>
            </div>
        </div>
        
    )
}

export default Login;