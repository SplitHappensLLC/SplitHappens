import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./Room.scss";
import { supabase } from "../../supabase/supabaseClient";
import ExpenseForm from "../../components/ExpenseForm/ExpenseForm";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  paid_by_user?: { id: string; username: string; email: string };
  date: string;
  notes?: string;
  expense_splits?: {
    user_id: string;
    amount: number;
    user: { id: string; username: string; email: string };
  }[];
  created_at: string;
}

interface GroupMember {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
}

interface RoomProps {
  userData?: {
    user: {
      id: string;
      email: string;
      user_metadata: {
        username: string;
      };
    };
    session: any;
  } | null;
}

const Room: React.FC<RoomProps> = ({ userData }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [groupName, setGroupName] = useState("");

  const { roomId } = useParams();

  // Get room name
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;

      try {
        const res = await fetch(`/api/name/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setGroupName(data.name || "");
        }
      } catch (err) {
        console.error("Error fetching room:", err);
      }
    };
    fetchRoom();
  }, [roomId]);

  // Get Supabase session
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
    };
    init();
  }, []);

  // Fetch group details (expenses + members)
  const fetchGroupDetails = async () => {
    if (!session?.access_token || !roomId) return;

    try {
      // Fetch expenses
      const expensesRes = await fetch(`/api/expenses/${roomId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData || []);
      }

      // Fetch group members
      const membersRes = await fetch(`/api/groups/${roomId}/members`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        console.log(membersData, "membersData\n\n\\n\n\n");
        setMembers(membersData || []);
      }
    } catch (err) {
      console.error("Error fetching group details:", err);
    }
  };

  useEffect(() => {
    if (session && roomId) {
      fetchGroupDetails();
    }
  }, [session, roomId]);

  // Add expense
  const addExpense = async (expenseData: {
    description: string;
    amount: number;
    paidBy: string;
    splitWith: string[];
    date: string;
    notes?: string;
  }) => {
    if (!session?.access_token) {
      alert("Not logged in");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          group_id: roomId,
          description: expenseData.description,
          amount: expenseData.amount,
          paid_by: expenseData.paidBy,
          split_with: expenseData.splitWith,
          date: expenseData.date,
          notes: expenseData.notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add expense");
      }

      setShowExpenseForm(false);
      await fetchGroupDetails();
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Error adding expense: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = () => {
    return session?.user?.id || userData?.user?.id || "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMemberName = (userId: string) => {
    if (userId === getCurrentUserId()) return "you";
    const member = members.find((m) => m.id === userId);
    return member?.username || "Unknown";
  };

  return (
    <div className="room-wrapper">
      <Link className="back-home-btn" to="/">
        Back to Home
      </Link>

      <header className="room-header">
        <div className="group-info">
          <div className="group-icon">✈️</div>
          <div className="group-details">
            <h1>{groupName || "Loading..."}</h1>
            <span className="member-count">{members.length} people</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowExpenseForm(true)}
            disabled={loading || members.length === 0}
          >
            Add an expense
          </button>
          <button className="btn btn-secondary">Settle up</button>
        </div>
      </header>

      <div className="room-content-container">
        <div className="expense-container">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration">
                <div className="sad-wallet">
                  <div className="wallet-body"></div>
                  <div className="wallet-tear"></div>
                </div>
              </div>
              <h2>You have not added any expenses yet</h2>
              <p>
                To add a new expense, click the "Add an expense" button.
              </p>
            </div>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => {
                const isCurrentUserPaid =
                  expense.paid_by === getCurrentUserId();
                const userSplit = expense.expense_splits?.find(
                  (split) => split.user_id === getCurrentUserId()
                );

                return (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-icon">🧾</div>
                    <div className="expense-details">
                      <div className="expense-description">
                        {expense.description || "Untitled expense"}
                      </div>
                      <div className="expense-meta">
                        {formatDate(expense.date)} • Paid by{" "}
                        {getMemberName(expense.paid_by)}
                        {expense.expense_splits && (
                          <span className="split-info">
                            {" • Split between "}
                            {expense.expense_splits.length === members.length
                              ? "everyone"
                              : `${expense.expense_splits.length} people`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="expense-amount">
                      <div className="total-amount">
                        ${expense.amount.toFixed(2)}
                      </div>
                      {userSplit && (
                        <div className="your-share">
                          {isCurrentUserPaid
                            ? `you lent $${(
                                expense.amount - userSplit.amount
                              ).toFixed(2)}`
                            : `you owe $${userSplit.amount.toFixed(2)}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <hr />

        <div className="group-users-container">
          <h3>Group Members ({members.length})</h3>
          {members.length === 0 ? (
            <p>Loading members...</p>
          ) : (
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <span className="member-name">
                      {member.id === getCurrentUserId()
                        ? "You"
                        : member.username}
                    </span>
                    <span className="member-email">{member.email}</span>
                  </div>
                  {member.is_admin && (
                    <span className="admin-badge">Admin</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showExpenseForm && members.length > 0 && (
        <div
          className="modal-overlay"
          onClick={() => setShowExpenseForm(false)}
        >
          <div
            className="modal expense-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add an expense</h2>
              <button
                className="close-btn"
                onClick={() => setShowExpenseForm(false)}
              >
                ×
              </button>
            </div>
            <ExpenseForm
              members={members}
              currentUserId={getCurrentUserId()}
              onSave={addExpense}
              onCancel={() => setShowExpenseForm(false)}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
