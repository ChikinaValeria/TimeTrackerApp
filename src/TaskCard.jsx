// TaskCard.jsx (updated to display additional_data)

// TaskCard component, displays a single task item.
// Note: additional_data is added to props and used in rendering.
const TaskCard = ({ id, name, tagNames, description, tags, additional_data, is_active, onDeleteRequest, onEditRequest }) => {

  // Handler for delete button click
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Stop click event from propagating to any parent click handlers
    // Calls the function from parent component to initiate delete confirmation
    onDeleteRequest(id, name);
  };

  // Handler for edit button click
  const handleEditClick = (e) => {
    e.stopPropagation(); // Stop click event from propagating
    // Prepare the full task object to pass to the edit modal
    const taskData = { id, name, description, tags, additional_data, is_active };
    onEditRequest(taskData);
  };

  return (
    // The task-card now contains content and action buttons
    <div className="task-card">
      {/* Task Content: name, additional_data, and tags */}
      <div className="task-content">
        <h3 className="task-name">{name}</h3>

        {/* NEW: Additional Data display */}
        {additional_data && (
          <p className="additional-data">{additional_data}</p>
        )}

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

      {/* Action Buttons Container */}
      <div className="task-actions">
        {/* Edit button placed inside the task-card */}
        <button
          className="edit-button" // Orange button
          onClick={handleEditClick}
          aria-label={`Edit task: ${name}`}
        >
          Edit
        </button>

        {/* Delete button placed inside the task-card */}
        <button
          className="delete-button"
          onClick={handleDeleteClick}
          aria-label={`Delete task: ${name}`}
        >
          Delete task
        </button>
      </div>
    </div>
  );
};

export default TaskCard;