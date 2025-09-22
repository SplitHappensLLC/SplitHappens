import { Link } from "react-router-dom"
import { useState, useEffect } from "react";
import './Friends.scss'
import { supabase } from "../../supabase/supabaseClient";


const Friends = () => {
const [search, setSearch] = useState("");
const [users, setUsers] = useState<any[]>([]);
const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!search) return;

    const fetchUsers = async () => {
      setLoading(true);
      const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    };

    fetchUsers();
  }, [search]);

const addFriend = async (friendId: string) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token
  const res = await fetch("/api/friends", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // your auth token
    },
    body: JSON.stringify({ friend_id: friendId }),
  });

  if (!res.ok) return alert("Failed to add friend");
  alert("Friend added!");
};

    return (
    <div className="friends-wrapper">
        <Link className="back-home-btn" to='/' >Back to Home</Link>
        <div className="add-friend-container">
            <input type="text" placeholder="Add a friend by username..." value={search} onChange={(e) => setSearch(e.target.value)} />
               <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email})
            <button onClick={() => addFriend(user.id)}>Add Friend</button>
          </li>
        ))}
      </ul>
        </div>

        <div className="friends-list-container">
            <div>Friends List: </div>

        </div>
    </div>
    )
}

export default Friends