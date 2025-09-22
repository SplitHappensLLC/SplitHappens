import { useState } from 'react'
import { Routes, Route, Navigate,  BrowserRouter, Link } from 'react-router-dom';
import './App.scss'
import Home from './pages/Homepage/Home'
import Login from './pages/Login/Login';
import CreateUser from  './pages/CreateUser/CreateUser'
import Profile from './pages/Profile/Profile';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [open, setOpen] = useState(false)
  const [profileImage, setProfileImage] = useState(null)


  return (
<BrowserRouter>
<div className='app-wrapper'>
 <section className='navbar-wrapper'>
    <nav className='navbar-container'>
      {isLoggedIn ? <div id='nav-blank'></div> : ""}
      <h1>Split Happens</h1>
      {isLoggedIn ? <div className="nav-profile-icon" style={{backgroundImage: `url(${profileImage || ""})`}} onClick={() => setOpen(!open)}></div>: "" }
    </nav>
  </section>
  <section className='body-wrapper'>
    <div className={`sidebar-wrapper ${open ? "is-open" : ""}`}>
      <div className='sidebar-container'>
        <li><Link to='/profile'>Profile</Link></li>
        <hr></hr>
        <li><Link>History</Link></li>
        <hr></hr>
        <li><Link>Friends</Link></li>
        <hr></hr>
      </div>
    </div> 
    <Routes>
      <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="login"/>}/>
      <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />}/>
      <Route path="/create-account" element={<CreateUser />}/>
      <Route path="/profile" element={<Profile setProfileImage={setProfileImage} />} />
    </Routes>
  </section>
</div>
</BrowserRouter>
  )
}

export default App
