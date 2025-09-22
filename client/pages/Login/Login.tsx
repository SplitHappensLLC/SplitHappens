// import { useState, useEffect, useRef } from "react"
import React, { useState } from "react";
import {Link} from "react-router-dom"
import "./Login.scss"
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient"; // adjust path
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// import StockList from "../../components/StockList"

const Login = ({setIsLoggedIn}) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

   const navigate = useNavigate()

    const handleLogin = async () => {
        const res = await fetch ("/api/users/login", {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({ email, password })
        })

        const data = await res.json()
        console.log(data)
        
    if (res.ok && data.user) {
      await supabase.auth.setSession(data.session)
      setIsLoggedIn(true);
      console.log("Logged in!", data.user);
    } else {
      setIsLoggedIn(false);
      alert(data.error || "Login failed");
    }

        navigate("/");
    
    }
    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="login-top-container">
                    <div className="user-container">
                    <label htmlFor="username">Email:</label>
                    <input id="username" type="text"  value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="pass-container">
                    <label htmlFor="password">Password:</label>
                    <input id="password" type="text"  value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className="submit-login" onClick={handleLogin}>Sign In</button>
                </div>
                
                <div>
                    <div className="create-acc">Don't have an account? < Link to="/create-account">Create one here.</Link></div>
                </div>
            </div>
        </div>
        
    )
}

export default Login;