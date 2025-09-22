// import { useState, useEffect, useRef } from "react"
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "..//Login/Login.scss"
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// import StockList from "../../components/StockList"

const CreateUser = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")
    const navigate = useNavigate()


    const handleSignup = async () => {
        const res = await fetch ("/api/users", {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({ username, password, email })
        })

        const data = await res.json()
        console.log(data)
         if (res.ok) {
        navigate("/login");
    }
    }

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
                <div className="email-container">
                    <label htmlFor="email">Input Email:</label>
                    <input id="email" type="text"  value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button className="submit-login" onClick={handleSignup}>Create Account</button>
                </div>
                
                {/* <div>
                    <div className="create-acc">Don't have an account? <a>Create one here.</a></div>
                </div> */}
            </div>
        </div>
        
    )
}

export default CreateUser;