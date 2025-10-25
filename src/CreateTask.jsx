// CreateTask.jsx (Modified: Integration of TagAssignment and fixed handleSubmit logic)

import React, { useState } from 'react';
import TagAssignment from './TagAssignment.jsx'; // Import the new component

// CreateTask component as a modal for adding a new task.
const CreateTask = ({ isOpen, onCreate, onCancel, availableTags, postNewTag }) => {

    const MAX_TASK_LENGTH = 40;

    // State Hooks for task fields
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskAdditionalData, setTaskAdditionalData] = useState('');

    // State Hook for the tag IDs string
    const [assignedTagIds, setAssignedTagIds] = useState('');


    if (!isOpen) return null;

    // Handler to reset the form fields
    const resetForm = () => {
        setTaskName('');
        setTaskDescription('');
        setTaskAdditionalData('');
        setAssignedTagIds(''); // Reset assigned tags
    };

    // Handler for task name change
    const handleNameChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_TASK_LENGTH) {
            setTaskName(value);
        }
    };

    // Handler for additional data change
    const handleAdditionalDataChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_TASK_LENGTH) {
            setTaskAdditionalData(value);
        }
    };

    // Handler for form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!taskName.trim()) {
            alert("Task Name cannot be empty.");
            return;
        }

        const newTask = {
            name: taskName,
            description: taskDescription,
            additional_data: taskAdditionalData,
            tags: assignedTagIds, // Use the updated tags string
            is_active: true, // Defaulting to active
        };

        // Call parent function (TasksView's handleConfirmCreate).
        // The parent handles the POST request and closing the modal/resetting.
        await onCreate(newTask);
        resetForm(); // Reset local state after successful creation
    };


    return (
        <div className="modal-backdrop">
            <div className="modal-content edit-modal-content">
                <h3 className="modal-title">Create New Task</h3>
                <form className="edit-form" onSubmit={handleSubmit}>

                    {/* Task Name Field */}
                    <div className="form-group">
                        <label htmlFor="newTaskName">Task Name:</label>
                        <input
                            id="newTaskName"
                            type="text"
                            value={taskName}
                            onChange={handleNameChange}
                            className="form-input"
                            maxLength={MAX_TASK_LENGTH}
                            required
                        />
                        <p className="char-limit-message">Max length: {MAX_TASK_LENGTH} characters.</p>
                    </div>

                    {/* Additional Data Field (using original logic for simplicity) */}
                    <div className="form-group">
                        <label htmlFor="newTaskAdditionalData">Additional Data (Max {MAX_TASK_LENGTH} Chars):</label>
                        <input
                            id="newTaskAdditionalData"
                            type="text"
                            value={taskAdditionalData}
                            onChange={handleAdditionalDataChange}
                            className="form-input"
                            maxLength={MAX_TASK_LENGTH}
                        />
                        <p className="char-limit-message">Max length: {MAX_TASK_LENGTH} characters.</p>
                    </div>

                    {/* Tag Assignment Component */}
                    <TagAssignment
                        initialTagIds={''} // New task starts with no tags
                        availableTags={availableTags}
                        onTagsChange={setAssignedTagIds} // Update the local state for tags
                        onNewTagCreate={postNewTag}
                    />

                    <div className="modal-actions">
                        <button type="submit" className="modal-button save-button">Create Task</button>
                        <button
                            type="button"
                            className="modal-button cancel-button"
                            // Call parent onCancel and reset local form state
                            onClick={() => { onCancel(); resetForm(); }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTask;