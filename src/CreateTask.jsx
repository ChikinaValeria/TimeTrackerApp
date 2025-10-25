// CreateTask.jsx
// Function component for the modal form used to create a new task.

import React, { useState, useEffect } from 'react';

// The CreateTask component acts as a modal, displaying the form fields.
const CreateTask = ({ isOpen, onCreate, onCancel }) => {
  const MAX_LENGTH = 40;

  // State Hooks for form fields, ensuring they are simple strings.
  const [taskName, setTaskName] = useState('');
  const [additionalData, setAdditionalData] = useState('');

  // Effect Hook to clear form state when modal closes (when isOpen changes to false).
  useEffect(() => {
    if (!isOpen) {
      setTaskName('');
      setAdditionalData('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handler for Task Name input with length check
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setTaskName(value);
    }
  };

  // Handler for Additional Data input with length check
  const handleAdditionalDataChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setAdditionalData(value);
    }
  };

  // Handler for Save button (triggers POST request in parent TasksView)
  const handleCreate = (e) => {
    e.preventDefault(); // Prevent default form submission

    // Simple validation
    if (!taskName.trim()) {
        alert("Task Name cannot be empty.");
        return;
    }

    // Task object for POST request, using simple data structures.
    // Default values are included as required by the backend API.
    const newTask = {
      name: taskName,
      tags: "", // Default to empty string
      description: "Default description", // Default description
      additional_data: additionalData,
      is_active: true, // Default to active
    };

    onCreate(newTask);
    // Parent component will handle closing the modal and resetting state.
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content edit-modal-content">
        <h3 className="modal-title">Create Task</h3>
        <form className="edit-form" onSubmit={handleCreate}>

          {/* Task Name Field */}
          <div className="form-group">
            <label htmlFor="newTaskName">Task Name:</label>
            <input
              id="newTaskName"
              type="text"
              value={taskName}
              onChange={handleNameChange}
              className="form-input"
              maxLength={MAX_LENGTH} // HTML-based max length
              required
            />
            <p className="char-limit-message">Max length: {MAX_LENGTH} characters.</p>
          </div>

          {/* Additional Data Field */}
          <div className="form-group">
            <label htmlFor="newAdditionalData">Additional Data:</label>
            <input
              id="newAdditionalData"
              type="text"
              value={additionalData}
              onChange={handleAdditionalDataChange}
              className="form-input"
              maxLength={MAX_LENGTH} // HTML-based max length
            />
            <p className="char-limit-message">Max length: {MAX_LENGTH} characters.</p>
          </div>

          <div className="modal-actions">
            <button type="submit" className="modal-button save-button">Save</button>
            <button type="button" className="modal-button cancel-button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;