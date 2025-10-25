// TaskCard.jsx (updated)

// TaskCard component, displays a single task item.
const TaskCard = ({ id, name, tagNames, onDeleteRequest }) => {
  // Handler for delete button click
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Stop click event from propagating to any parent click handlers
    // Calls the function from parent component to initiate delete confirmation
    onDeleteRequest(id, name);
  };

  return (
    // The task-card now contains both content and the delete button
    <div className="task-card">
      {/* Task Content: name and tags */}
      <div className="task-content">
        <h3 className="task-name">{name}</h3>
        <div className="task-tags">
          {tagNames.length > 0 ?
            tagNames.map((tag, index) => (
              <span key={index} className="task-tag">
                {tag}
              </span>
            )) :
            <span className="task-tag no-tag">No Tag</span>
          }
        </div>
      </div>

      {/* Delete button placed inside the task-card */}
      <button
        className="delete-button"
        onClick={handleDeleteClick}
        aria-label={`Delete task: ${name}`}
      >
        Delete task
      </button>
    </div>
  );
};

export default TaskCard;