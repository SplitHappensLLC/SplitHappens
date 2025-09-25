import { useState } from "react";
import "./ExpenseForm.scss";

interface Member {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
}

interface ExpenseFormProps {
  members: Member[];
  currentUserId: string;
  onSave: (expenseData: {
    description: string;
    amount: number;
    paidBy: string;
    splitWith: string[];
    date: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  members,
  currentUserId,
  onSave,
  onCancel,
  loading = false
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.id)
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [payer, setPayer] = useState(currentUserId);
  const [splitType, setSplitType] = useState("equally");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert("Please enter a description");
      return;
    }

    if (!amount || parseFloat(amount.toString()) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("Please select at least one person to split with");
      return;
    }

    onSave({
      description: description.trim(),
      amount: parseFloat(amount.toString()),
      paidBy: payer,
      splitWith: selectedMembers,
      date,
      notes: notes.trim() || undefined
    });
  };

  const getMemberName = (memberId: string) => {
    if (memberId === currentUserId) return "you";
    const member = members.find((m) => m.id === memberId);
    return member?.username || "Unknown";
  };

  const amountPerPerson =
    amount && selectedMembers.length > 0
      ? (parseFloat(amount.toString()) / selectedMembers.length).toFixed(2)
      : "0.00";

  return (
    <div className="expense-form">
      <form onSubmit={handleSubmit}>
        {/* With you and */}
        <div className="form-row">
          <span className="label-small">With you and:</span>
          <div className="pills">
            {selectedMembers
              .filter((id) => id !== currentUserId)
              .map((memberId) => {
                const member = members.find((m) => m.id === memberId);
                return member ? (
                  <span key={memberId} className="pill">
                    {member.username}
                    <button
                      type="button"
                      onClick={() => handleMemberToggle(memberId)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
          </div>
        </div>

        {/* Member selection */}
        <div className="member-selection">
          <h4>Split between:</h4>
          <div className="member-checkboxes">
            {members.map((member) => (
              <label key={member.id} className="member-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                />
                <span className="member-name">
                  {member.id === currentUserId ? "You" : member.username}
                </span>
                <span className="member-email">{member.email}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <input
          type="text"
          placeholder="Enter a description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="description-input"
          required
        />

        {/* Amount */}
        <div className="amount-row">
          <span className="dollar">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value === "" ? "" : parseFloat(e.target.value))
            }
            placeholder="0.00"
            className="amount-input"
            required
          />
        </div>

        {/* Paid by ... and split ... */}
        <div className="subtext">
          Paid by{" "}
          <select
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className="select"
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {getMemberName(member.id)}
              </option>
            ))}
          </select>{" "}
          and split{" "}
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value)}
            className="select"
          >
            <option value="equally">equally</option>
            <option value="unequally">unequally</option>
            <option value="shares">by shares</option>
          </select>
          .
        </div>

        <div className="amount-per-person">(${amountPerPerson}/person)</div>

        {/* Date + Add image/notes */}
        <div className="form-row">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="date-input"
          />
          <button type="button" className="secondary-btn">
            Add image/notes
          </button>
        </div>

        {/* Notes */}
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="notes-input"
          rows={3}
        />

        {/* Actions */}
        <div className="actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
