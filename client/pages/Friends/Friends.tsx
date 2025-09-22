import { Link } from "react-router-dom"
import { useState, useEffect } from "react";
import './Friends.scss'
import { supabase } from "../../supabase/supabaseClient";


const Friends = () => {
const [search, setSearch] = useState("");
const [users, setUsers] = useState<any[]>([]);
const [friends, setFriends] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [session, setSession] = useState<any>(null);

 useEffect(() => {
  const init = async () => {
    const { data } = await supabase.auth.getSession();
    console.log("Initial session:", data.session);
    if (data.session) setSession(data.session); // only set if exists

    supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log("Auth state changed:", newSession);
      if (newSession) setSession(newSession); // only update if logged in
    });
  };
  init();
}, []);


  useEffect(() => {
    if (!session?.user) return;

    const fetchUsers = async () => {
      if (!search) {
        setUsers([]);
        return;
      }

      setLoadingUsers(true);
      try {
        const token = session.access_token;

        const res = await fetch(
          `/api/getusers?search=${encodeURIComponent(search)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [search, session]);


  useEffect(() => {
    if (!session?.user) return;

    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const token = session.access_token;
        const userId = session.user.id;

        const res = await fetch(`/api/friends/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch friends");

        const data = await res.json();
        setFriends(data);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [session]);

const addFriend = async (friendId: string) => {
  if (!session?.user) return alert("Not logged in");

  const token = session.access_token;
  const userId = session.user.id;
  if (friendId === userId) return alert("You cannot add yourself as a friend");

  try {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_id: friendId }),
    });

    if (!res.ok) {
      const err = await res.json();
      return alert(err.error || "Failed to add friend");
    }

    alert("Friend added!");

    // Refresh friends using session state
    const updatedRes = await fetch(`/api/friends/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updatedFriends = await updatedRes.json();
    setFriends(updatedFriends);
  } catch (err) {
    console.error(err);
    alert("Error adding friend");
  }
};
    return (
    <div className="friends-wrapper">
        <Link className="back-home-btn" to='/' >Back to Home</Link>
        <div className="add-friend-container">
            <input type="text" placeholder="Add a friend by username..." value={search} onChange={(e) => setSearch(e.target.value)} />
               <ul>
        {users.map((user) => (
          <li className="add-friend" key={user.id}>
            {user.username}
            <button className="add-friend-btn" onClick={() => addFriend(user.id)}>Add Friend</button>
          </li>
        ))}
      </ul>
        </div>

        <div className="friends-list-container">
            <div className="friends-list-title">Friends List: </div>
                  {loadingFriends ? (
        <p>Loading friends...</p>
      ) : friends.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul className="friends-list" style={{ listStyle: "none", padding: 0 }}>
          {friends.map((f) => (
            <li className="friend" key={f.id}>
              {f.username}
            </li>
          ))}
        </ul>
      )}
        </div>
    </div>
    )
}

export default Friends