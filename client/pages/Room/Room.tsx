import { useEffect } from "react";
import { useParams } from "react-router-dom";


const Room = () => {
  const { roomId } = useParams();
  console.log("Room ID from URL:", roomId); // should log the UUID

  useEffect(() => {
    const fetchRoom = async () => {
      const res = await fetch(`/api/groups/${roomId}`);
      const room = await res.json();
      console.log("Fetched room:", room);
    };
    fetchRoom();
  }, [roomId]);

  return <div>Welcome to room {roomId}</div>;
}

export default Room