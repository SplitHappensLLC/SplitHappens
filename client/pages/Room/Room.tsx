import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import './Room.scss'
import { supabase } from "../../supabase/supabaseClient";



const Room = ({ roomName }) => {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  // const [roomName, setRoomName] = useState("")

  const { roomId } = useParams();
  console.log(roomName)

  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;

      try {
        const res = await fetch(`/api/groups/${roomId}`);
        const data = await res.json();
        setRoomName(data.name || ""); // set the room name from backend
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoom();
  }, [roomId]);

  // Get Supabase session
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("Initial session:", data.session);
      setSession(data.session);

      supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log("Auth state changed:", newSession);
        setSession(newSession);
      });
    };
    init();
  }, []);

  // Fetch expenses
  const fetchExpenses = async () => {
    if (!session?.access_token) return;
    console.log("Fetching expenses for room:", roomId);
    try {
      const res = await fetch(`/api/expenses/${roomId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data = await res.json();
      console.log("Fetched expenses:", data);
      setExpenses(data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  useEffect(() => {
    if (session) fetchExpenses();
  }, [session, roomId]);

  // Add expense
  const addExpense = async () => {
    if (!session?.access_token) return alert("Not logged in");
    if (!description || !amount) return alert("Fill in description and amount");

    setLoading(true);
    try {
      console.log("Adding expense to room:", roomId);
      const res = await fetch("/api/expense_items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          group_id: roomId, // backend expects group_id
          description,
          amount: Number(amount),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || "Failed to add expense");
      }

      setDescription("");
      setAmount("");
      await fetchExpenses(); // refresh after adding
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Error adding expense");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="room-wrapper">
      <Link className="back-home-btn" to='/' >Back to Home</Link>
      <div className="welcome-room-title">Welcome to room <strong>{roomName}</strong></div>
      <div className="room-content-container">
        <div className="expense-container">
          <ul>
        {expenses.map((e) => (
          <li key={e.id}>
            ${e.amount} — {e.description} (by {e.user_id})
          </li>
        ))}
      </ul>

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={addExpense} disabled={loading}>
        {loading ? "Adding..." : "Add Expense"}
      </button>
        </div>
        <hr></hr>
        <div className="group-users-container">

        </div>

      </div>
    </div>
)
}

export default Room