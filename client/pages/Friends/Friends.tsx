// Enhanced Friends.tsx with group invitation functionality
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Friends.scss";
import { supabase } from "../../supabase/supabaseClient";

interface Friend {
  id: string;
  username: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
}

const Friends = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    console.log("useEffect 1 runing");
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setSession(data.session);

      supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession) setSession(newSession);
      });
    };
    init();
  }, []);

  useEffect(() => {
    console.log("useEffect 2 runing");
    if (!session?.user) return;

    const fetchUsers = async () => {
      if (!debouncedSearch.trim()) {
        setUsers([]);
        console.log("no debouncedSearch");
        return;
      }

      setLoadingUsers(true);
      try {
        const token = session.access_token;
        const res = await fetch(
          `/api/getusers?search=${encodeURIComponent(debouncedSearch)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // console.log(res, "RES\n\n\n\n\n\n");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        console.log("User search results:", data);
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [debouncedSearch, session]);

  useEffect(() => {
    console.log("useEffect 3 runing");
    if (!session?.user) {
      console.log("no session");
      return;
    }

    const fetchFriendsAndGroups = async () => {
      setLoadingFriends(true);
      try {
        const token = session.access_token;
        const userId = session.user.id;
        console.log("feyiuseeffect\n\n\n\n\n\n\n useEffect 3");
        // Fetch friends
        const friendsRes = await fetch(`/api/friends/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
       
        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          console.log(
            "friendsData\n\n\n\n\n\n\n/api/friends/${userId} running in 3 Use",
            friendsData
          );
          console.log("friendsData\n\n\n\n\n\n\n", friendsData);
          setFriends(friendsData);
        }

        // Fetch user's groups
        const groupsRes = await fetch(`/api/groups/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          console.log("groupsData\n\n\n\n\n\n\n", groupsData);
          setUserGroups(groupsData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriendsAndGroups();
  }, [session]);

  const addFriend = async (friendId: string) => {
    if (!session?.user) return alert("Not logged in");

    const token = session.access_token;
    const userId = session.user.id;
    if (friendId === userId)
      return alert("You cannot add yourself as a friend");

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friend_id: friendId })
      });

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || "Failed to add friend");
      }

      alert("Friend added!");

      // Refresh friends
      const updatedRes = await fetch(`/api/friends/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedFriends = await updatedRes.json();

      setFriends(updatedFriends);
    } catch (err) {
      console.error(err);
      alert("Error adding friend");
    }
  };

  const inviteToGroup = async (groupId: string) => {
    if (!selectedFriend || !session?.user) return;

    try {
      const token = session.access_token;
      const res = await fetch("/api/group_members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          group_id: groupId,
          user_id: selectedFriend.id
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to invite to group");
      }
      console.log("Friend added to group:", res);

      alert(`${selectedFriend.username} has been invited to the group!`);
      setShowInviteModal(false);
      setSelectedFriend(null);
    } catch (err) {
      console.error(err);
      alert("Error inviting friend: " + (err as Error).message);
    }
  };

  return (
    <div className="friends-wrapper">
      <Link className="back-home-btn" to="/">
        Back to Home
      </Link>

      <div className="add-friend-container">
        <input
          type="text"
          placeholder="Add a friend by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loadingUsers ? (
          <p>Searching...</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li className="add-friend" key={user.id}>
                <span className="user-info">
                  <span className="username">{user.username}</span>
                  <span className="email">{user.email}</span>
                </span>
                <button
                  className="add-friend-btn"
                  onClick={() => addFriend(user.id)}
                >
                  Add Friend
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="friends-list-container">
        <div className="friends-list-title">
          Friends List ({friends.length}):
        </div>
        {loadingFriends ? (
          <p>Loading friends...</p>
        ) : friends.length === 0 ? (
          <p>You have no friends yet.</p>
        ) : (
          <ul className="friends-list">
            {friends.map((friend) => (
              <li className="friend" key={friend.id}>
                <div className="friend-info">
                  <span className="friend-name">{friend.username}</span>
                  <span className="friend-email">{friend.email}</span>
                </div>
                <button
                  className="invite-btn"
                  onClick={() => {
                    setSelectedFriend(friend);
                    setShowInviteModal(true);
                  }}
                >
                  Invite to Group
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showInviteModal && selectedFriend && (
        <div
          className="modal-overlay"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="modal invite-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Invite {selectedFriend.username} to Group</h3>
              <button
                className="close-btn"
                onClick={() => setShowInviteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {userGroups.length === 0 ? (
                <p>
                  You don't have any groups to invite friends to. Create a group
                  first!
                </p>
              ) : (
                <>
                  <p>Select a group to invite {selectedFriend.username} to:</p>
                  <div className="groups-list">
                    {userGroups.map((group) => (
                      <button
                        key={group.id}
                        className="group-option"
                        onClick={() => inviteToGroup(group.id)}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
