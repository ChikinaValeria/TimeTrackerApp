// EditTag.jsx
// Function component for the modal form used to edit an existing tag.

import React, { useState, useEffect } from 'react';

// The EditTag component acts as a modal, displaying the form fields pre-filled.
const EditTag = ({ isOpen, tagData, onSave, onCancel }) => {
    const MAX_LENGTH = 20;

    // State Hooks for form fields, initialized to empty strings or data from props
    const [tagName, setTagName] = useState('');
    const [additionalData, setAdditionalData] = useState('');

    // Effect Hook to reset form state when a new tag is passed for editing or when modal opens/closes
    useEffect(() => {
        if (tagData) {
            // Fill fields with current tag data when modal opens
            setTagName(tagData.name || '');
            setAdditionalData(tagData.additional_data || '');
        }
    }, [tagData]); // Dependency on tagData ensures state is synced when it changes

    if (!isOpen || !tagData) return null;

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

    // Handler for Save button (triggers PUT request in parent TagsView)
    const handleSave = (e) => {
        e.preventDefault(); // Prevent default form submission

        // Simple validation
        if (!tagName.trim()) {
            alert("Tag Name cannot be empty.");
            return;
        }

        // Tag object for PUT request, including the ID
        const updatedTag = {
            id: tagData.id, // Ensure ID is passed for the endpoint
            name: tagName,
            additional_data: additionalData,
        };

        onSave(updatedTag);
        // Parent component (TagsView) will handle closing the modal and fetching new data.
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content edit-modal-content">
                <h3 className="modal-title">Edit Tag: {tagData.id}</h3>
                <form className="edit-form" onSubmit={handleSave}>

                    {/* Tag Name Field */}
                    <div className="form-group">
                        <label htmlFor="editTagName">Tag Name:</label>
                        <input
                            id="editTagName"
                            type="text"
                            value={tagName}
                            onChange={handleNameChange}
                            className="form-input"
                            maxLength={MAX_LENGTH} // HTML-based max length
                            required
                        />
                        <p className="char-limit-message">Max length: {MAX_LENGTH} characters.</p>
                    </div>

                    {/* Additional Data Field */}
                    <div className="form-group">
                        <label htmlFor="editAdditionalData">Additional Data:</label>
                        <input
                            id="editAdditionalData"
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

export default EditTag;