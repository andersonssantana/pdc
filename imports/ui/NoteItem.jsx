import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { isCurrentUserAdmin } from "../api/users";

export const NoteItem = ({ note }) => {
  const [deleting, setDeleting] = useState(false);

  const { isOwner, isAdmin } = useTracker(() => {
    const currentUser = Meteor.user();
    return {
      isOwner: currentUser?._id === note.createdBy,
      isAdmin: isCurrentUserAdmin()
    };
  });

  const canDelete = isOwner || isAdmin;

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    setDeleting(true);
    Meteor.call("notes.remove", note._id, (err) => {
      setDeleting(false);
      if (err) {
        alert(err.reason || "Failed to delete note");
      }
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="note-item card">
      <div className="note-header">
        <span className="note-author">{note.createdByName}</span>
        <span className="note-date">{formatDate(note.createdAt)}</span>
      </div>

      <p className="note-content">{note.content}</p>

      {canDelete && (
        <button
          className="note-delete button-text"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      )}
    </div>
  );
};
