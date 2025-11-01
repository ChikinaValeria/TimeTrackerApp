// Component for the modal form used to edit an existing task.
// FIX for "white screen" issue by moving it out of App.jsx and fixing logic.

import React, { useState, useEffect } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import TagAssignment from './TagAssignment.jsx'; // Import TagAssignment

const MAX_TASK_LENGTH = 40;

// EditTask component is now a function component exported separately.
const EditTask = ({ isOpen, taskData, onSave, onCancel, availableTags, postNewTag }) => {

    // State Hooks for form fields, initialized to empty or data from props
    const [taskName, setTaskName] = useState('');
    const [additionalData, setAdditionalData] = useState('');

    // State for tag IDs string (e.g., "1,4")
    const [currentTagIds, setCurrentTagIds] = useState('');

    // Effect Hook to sync state when taskData changes (i.e., when modal opens for a different task)
    useEffect(() => {
        if (taskData) {
            setTaskName(taskData.name || '');
            setAdditionalData(taskData.additional_data || '');
            // Sync tag IDs state
            setCurrentTagIds(taskData.tags || '');
        }
    }, [taskData]);


    const modalRef = useFocusTrap(isOpen && !!taskData);
    if (!isOpen || !taskData) return null;

    // Handler for Task Name input with length check
    const handleNameChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_TASK_LENGTH) {
            setTaskName(value);
        }
    };

    // Handler for Additional Data input with length check
    const handleAdditionalDataChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_TASK_LENGTH) {
            setAdditionalData(value);
        }
    };


    // Handler for Save button
    const handleSave = (e) => {
        e.preventDefault();

        if (!taskName.trim()) {
            alert("Task Name cannot be empty.");
            return;
        }

        const updatedTask = {
            id: taskData.id, // Ensure ID is preserved for the PUT request
            name: taskName,
            description: taskData.description, // Preserve original description
            additional_data: additionalData,
            tags: currentTagIds, // IMPORTANT: Use the updated tags string
            is_active: taskData.is_active, // Preserve original state
        };
        // Call parent onSave, which handles the PUT request in App.jsx
        onSave(updatedTask);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content edit-modal-content" ref={modalRef}>
                <h3 className="modal-title">Edit Task: {taskData.id}</h3>
                <form className="edit-form" onSubmit={handleSave}>
                    {/* Task Name Field */}
                    <div className="form-group">
                        <label htmlFor="taskName">Task Name:</label>
                        <input
                            id="taskName"
                            type="text"
                            value={taskName}
                            onChange={handleNameChange}
                            className="form-input"
                            maxLength={MAX_TASK_LENGTH}
                            required
                        />
                        <p className="char-limit-message">Max length: {MAX_TASK_LENGTH} characters.</p>
                    </div>
                    {/* Additional Data Field */}
                    <div className="form-group">
                        <label htmlFor="additionalData">Additional Data:</label>
                        <input
                            id="additionalData"
                            type="text"
                            value={additionalData}
                            onChange={handleAdditionalDataChange}
                            className="form-input"
                            maxLength={MAX_TASK_LENGTH}
                        />
                        <p className="char-limit-message">Max length: {MAX_TASK_LENGTH} characters.</p>
                    </div>
                    {/* Tag Assignment Component */}
                    <TagAssignment
                        initialTagIds={taskData.tags}
                        availableTags={availableTags}
                        onTagsChange={setCurrentTagIds}
                        onNewTagCreate={postNewTag}
                    />
                    <div className="modal-actions">
                        <button type="submit" className="modal-button save-button">Save</button>
                        <button type="button" className="modal-button cancel-button" onClick={onCancel}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTask;