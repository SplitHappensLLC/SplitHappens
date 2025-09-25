import { useState } from "react";
import { Routes, Route, Navigate, BrowserRouter, Link } from "react-router-dom";
import "./App.scss";
import Home from "./pages/Homepage/Home";
import Login from "./pages/Login/Login";
import CreateUser from "./pages/CreateUser/CreateUser";
import Profile from "./pages/Profile/Profile";
import Room from "./pages/Room/Room";
import Friends from "./pages/Friends/Friends";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <section className="navbar-wrapper">
          <nav className="navbar-container">
            {isLoggedIn ? <div id="nav-blank"></div> : ""}
            {isLoggedIn ? (
              <h1 className="nav-hello-user">
                {" "}
                Hi, {userData.user.user_metadata.username}
              </h1>
            ) : (
              <h1>Split Happens</h1>
            )}
            {isLoggedIn ? (
              <div
                className="nav-profile-icon"
                style={{ backgroundImage: `url(${profileImage || ""})` }}
                onClick={() => setOpen(!open)}
              ></div>
            ) : (
              ""
            )}
          </nav>
        </section>
        <section className="body-wrapper">
          <div className={`sidebar-wrapper ${open ? "is-open" : ""}`}>
            <div className="sidebar-container">
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <hr></hr>
              <li>
                <Link>History</Link>
              </li>
              <hr></hr>
              <li>
                <Link to="/friends">Friends</Link>
              </li>
              <hr></hr>
            </div>
          </div>
          <Routes>
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Home userData={userData} />
                ) : (
                  <Navigate to="login" />
                )
              }
            />
            <Route
              path="/login"
              element={
                <Login
                  setUserData={setUserData}
                  setIsLoggedIn={setIsLoggedIn}
                />
              }
            />
            <Route path="/create-account" element={<CreateUser />} />
            <Route
              path="/profile"
              element={<Profile setProfileImage={setProfileImage} />}
            />
            <Route
              path="room/:roomId"
              element={
                isLoggedIn ? (
                  <Room userData={userData} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/friends" element={<Friends />} />
          </Routes>
        </section>
      </div>
    </BrowserRouter>
  );
}

export default App;
