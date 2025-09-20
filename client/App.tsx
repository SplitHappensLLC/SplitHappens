// import { useState } from 'react'
import { Routes, Route, Navigate,  BrowserRouter } from 'react-router-dom';
import './App.scss'
import Home from './pages/Homepage/Home'
import Login from './pages/Login/Login';
import CreateUser from  './pages/CreateUser/CreateUser'

function App() {

  const isLoggedIn = false

  return (
<BrowserRouter>
<div className='app-wrapper'>
 <section className='navbar-wrapper'>
    <nav className='navbar-container'>
      {isLoggedIn ? <div id='nav-blank'></div> : ""}
      <h1>Split Happens</h1>
      {isLoggedIn ? <div id='nav-profile-icon'></div>: "" }
    </nav>
  </section>
  <section className='body-wrapper'>
    <Routes>
      <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="login"/>}/>
      <Route path="/login" element={<Login />}/>
      <Route path="/create-account" element={<CreateUser />}/>
    </Routes>
  </section>
</div>
</BrowserRouter>
  )
}

export default App
