import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import './Room.scss'


const Room = () => {
  const { roomId } = useParams();
  console.log("Room ID from URL:", roomId); // should log the UUID
  const [roomName, setRoomName] = useState("")

  useEffect(() => {
    const fetchRoom = async () => {
      const res = await fetch(`/api/name/${roomId}`);
      const room = await res.json();
      console.log(room)
      setRoomName(room.name);

      // console.log("Fetched room:", room);
    };
    fetchRoom();
  }, [roomId]);

  return (
    <div className="room-wrapper">
      <Link className="back-home-btn" to='/' >Back to Home</Link>
      <div>Welcome to room <strong>{roomName}</strong></div>
    </div>
)
}

export default Room