import { useState } from "react";
import { Meteor } from "meteor/meteor";

export const NoteForm = ({ customerId }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");
    setLoading(true);

    Meteor.call("notes.insert", { customerId, content }, (err) => {
      setLoading(false);
      if (err) {
        setError(err.reason || "Failed to add note");
      } else {
        setContent("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="note-form card">
      {error && <div className="error-message">{error}</div>}

      <textarea
        className="form-input form-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note..."
        disabled={loading}
        rows={3}
      />

      <button
        type="submit"
        className="button"
        disabled={loading || !content.trim()}
      >
        {loading ? "Adding..." : "Add Note"}
      </button>
    </form>
  );
};
