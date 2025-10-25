// TaskCard.jsx
// Component that displays a single task element and includes Drag and Drop handlers.

import React, { useState } from 'react'; // NEW: Import useState

// TaskCard component displays a single task element.
const TaskCard = ({
    id,
    name,
    tagNames,
    description,
    tags,
    additional_data,
    is_active,
    onDeleteRequest,
    onEditRequest,
    onDragStart,
    onDragEnter,
    onDrop,
    onDragOver,
}) => {
    // NEW: State to track if this specific card is the one being dragged
    const [isDragging, setIsDragging] = useState(false);

    // Handler for starting drag. Sets the task ID in dataTransfer.
    const handleDragStart = (e) => {
        setIsDragging(true); // Set source element as dragging
        e.dataTransfer.setData("taskId", id.toString());
        onDragStart(id);
    };

    // Handler for dropping. Prevents default and calls parent handler.
    const handleDrop = (e) => {
        e.preventDefault();
        // Drop logic remains in parent, but we ensure dragging state is reset
        setIsDragging(false);
        const draggedTaskId = e.dataTransfer.getData("taskId");
        onDrop(Number(draggedTaskId), id);
    };

    // Handler for drag end (cleanup)
    const handleDragEnd = (e) => {
        // Reset the dragging state when drag operation finishes (success or cancel)
        setIsDragging(false);
    };


    // Handlers for Drag Enter/Over remain unchanged in logic
    const handleDragEnter = (e) => {
        e.stopPropagation();
        onDragEnter(id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        onDragOver(id);
    };


    return (
        <div
            // Apply the new class if currently dragging
            className={`task-card ${isDragging ? 'is-dragging-source' : ''}`}
            // Drag and Drop Attributes and Handlers
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd} // Use the new handler
        >
            {/* ... (Task Card content remains unchanged) ... */}
            <div className="task-content">
                <h3 className="task-name">{name} (ID: {id})</h3>
                <p className="additional-data">{additional_data}</p>
                <div className="task-tags">
                    {tagNames.map((tagName, index) => (
                        <span key={index} className="task-tag">{tagName}</span>
                    ))}
                </div>
            </div>
            <div className="task-actions">
                <button
                    className="edit-button"
                    onClick={() => onEditRequest({ id, name, description, tags, additional_data, is_active })}
                >
                    Edit
                </button>
                <button
                    className="delete-button"
                    onClick={() => onDeleteRequest(id, name)}
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default TaskCard;