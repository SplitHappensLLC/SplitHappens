import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import './Home.scss';
import { useNavigate } from 'react-router-dom';
import { group } from 'console';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// import StockList from "../../components/StockList"

type UserData = { user?: { id?: string } };
type Props = { userData?: UserData };

const Home = ({ userData }: Props) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = userData?.user?.id;

  console.log(userId);
  const handleCreateRoom = async () => {
    const roomName = prompt('Enter room name');
    if (!roomName) return;

    const userId = userData?.user?.id;
    if (!userId) console.log('NO USER ID!');
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return console.log('NO TOKEN!');

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to creater room');
      navigate(`/room/${data.id}`);
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  // async function joinGroup(groupId: string) {
  //   try {
  //     const session = await supabase.auth.getSession();
  //     const token = session?.data?.session?.access_token;

  // if (!token) {
  //   console.error("No access token found");
  //   return;
  // }
  //     const res = await fetch(`/api/group_members`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ group_id: groupId }),
  //     });

  //     if (!res.ok) throw new Error("Failed to join group");
  //         navigate(`/room/${groupId}`)

  //     // Optional: navigate to group room page
  //     // e.g., using react-router: navigate(`/room/${groupId}`);
  //   } catch (err: any) {
  //     console.error(err);
  //   }
  // }

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch(`/api/groups/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch groups');

        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, [userId]);

  if (loading) return <p>Loading groups...</p>;
  return (
    <div className='homepage-wrapper'>
      <div className='create-group-container'>
        <button className='create-room-btn' onClick={handleCreateRoom}>
          Create Room
        </button>
      </div>
      <section className='groups-list-container'>
        <h2 className='open-groups-heading'>Open Groups With Friends</h2>
        {groups.length === 0 ? (
          <p>You are not part of any groups yet.</p>
        ) : (
          <ul className='open-groups-container'>
            {groups.map((group) => (
              <li className='open-group' key={group.id}>
                <div className='group-el-container'>
                  <div>
                    <div className='group-title'>Group Name:</div>
                    <div className='group-name'>{group.name}</div>
                  </div>
                  <button
                    className='rejoin-group-button'
                    onClick={() => navigate(`/room/${group.id}`)}
                  >
                    Join Room
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Home;
