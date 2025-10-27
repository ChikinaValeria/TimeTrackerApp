// TaskCard.jsx
// Component that displays a single task element and includes Drag and Drop handlers.

import React, { useState } from 'react';

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
    onStartStopRequest,
    onDragStart,
    onDragEnter,
    onDrop,
    onDragOver,
}) => {
    // State to track if this specific card is the one being dragged
    const [isDragging, setIsDragging] = useState(false);

    // Determines the appropriate status plaque text and class
    const statusText = is_active ? 'Active' : 'Inactive';
    const statusClass = is_active ? 'status-active' : 'status-inactive';

    // Handler for the Start/Stop button click
    const handleStartStopClick = () => {
        // Determine the action type: 0 for Start (Activate), 1 for Stop (Deactivate)
        const type = is_active ? 1 : 0;
        // Call the parent handler with the task ID and the action type
        onStartStopRequest(id, type);
    };

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
            // Apply class for dragging source and for active status
            className={`task-card ${isDragging ? 'is-dragging-source' : ''} ${is_active ? 'is-active' : ''}`}
            // Drag and Drop Attributes and Handlers
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="task-content">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <h3 className="task-name">{name}</h3>
                    <span className={`task-status-plaque ${statusClass}`}>
                        {statusText}
                    </span>
                </div>
                <p className="additional-data">{additional_data}</p>
                <div className="task-tags">
                    {tagNames.map((tagName, index) => (
                        <span key={index} className="task-tag">{tagName}</span>
                    ))}
                </div>
            </div>
            <div className="task-actions">
                {is_active ? (
                    <button
                        className="stop-button"
                        onClick={handleStartStopClick}
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        className="start-button"
                        onClick={handleStartStopClick}
                    >
                        Start
                    </button>
                )}

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