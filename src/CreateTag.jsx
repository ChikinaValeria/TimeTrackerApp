// CreateTag.jsx
// Function component for the modal form used to create a new tag.

import React, { useState, useEffect } from 'react';
import { useFocusTrap } from './useFocusTrap.js';

// The CreateTag component acts as a modal, displaying the form fields.
const CreateTag = ({ isOpen, onCreate, onCancel }) => {
    const MAX_LENGTH = 20; // Max length for name and additional_data fields

    // State Hooks for form fields, initialized to empty strings.
    const [tagName, setTagName] = useState('');
    const [additionalData, setAdditionalData] = useState('');

    // Effect Hook to clear form state when modal closes (when isOpen changes to false).
    useEffect(() => {
        if (!isOpen) {
            setTagName('');
            setAdditionalData('');
        }
    }, [isOpen]);


    const modalRef = useFocusTrap(isOpen);
    if (!isOpen) return null;

    // Handler for Tag Name input with length check (max 20 chars)
    const handleNameChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_LENGTH) {
            setTagName(value);
        }
    };

    // Handler for Additional Data input with length check (max 20 chars)
    const handleAdditionalDataChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_LENGTH) {
            setAdditionalData(value);
        }
    };

    // Handler for Save button (triggers POST request in parent TagsView)
    const handleCreate = (e) => {
        e.preventDefault(); // Prevent default form submission

        // Simple validation
        if (!tagName.trim()) {
            alert("Tag Name cannot be empty.");
            return;
        }

        // Tag object for POST request, using simple data structures.
        const newTag = {
            name: tagName,
            additional_data: additionalData,
        };

        onCreate(newTag);
        // Parent component (TagsView) will handle closing the modal and fetching new data.
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content edit-modal-content" ref={modalRef}>
                <h3 className="modal-title">Add New Tag</h3>
                <form className="edit-form" onSubmit={handleCreate}>
                    {/* Tag Name Field */}
                    <div className="form-group">
                        <label htmlFor="newTagName">Tag Name:</label>
                        <input
                            id="newTagName"
                            type="text"
                            value={tagName}
                            onChange={handleNameChange}
                            className="form-input"
                            maxLength={MAX_LENGTH}
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
                            maxLength={MAX_LENGTH}
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

export default CreateTag;