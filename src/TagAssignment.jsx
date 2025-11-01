import React, { useState, useEffect } from 'react';

const MAX_LENGTH = 20;

// TagAssignment component manages the assignment and removal of tags for a task form.
// Props:
// - initialTagIds: string of comma-separated tag IDs currently assigned to the task (e.g., "1,4")
// - availableTags: array of all tags from the server [{id, name, additional_data}]
// - onTagsChange: callback function (tagIdsString) to update the parent task state
// - onNewTagCreate: callback function (newTagName, newTagAdditionalData) to POST a new tag
const TagAssignment = ({ initialTagIds, availableTags, onTagsChange, onNewTagCreate }) => {
    // State Hook for assigned tag IDs (array of strings: ["1", "4"])
    const [assignedTagIds, setAssignedTagIds] = useState([]);

    // State Hooks for new tag creation fields
    const [newTagName, setNewTagName] = useState('');
    const [newTagAdditionalData, setNewTagAdditionalData] = useState('');

    // State Hook for the selected existing tag from the dropdown
    const [selectedExistingTagId, setSelectedExistingTagId] = useState('');


    // Effect Hook to initialize assigned tags when initialTagIds changes
    useEffect(() => {
        if (initialTagIds) {
            const ids = initialTagIds.split(',').filter(id => id.trim() !== '').map(id => id.trim());
            setAssignedTagIds(ids);
        } else {
            setAssignedTagIds([]);
        }
    }, [initialTagIds]);

    // Effect Hook to notify parent component whenever assignedTagIds changes
    useEffect(() => {
        // Convert the array of IDs back to a comma-separated string for the task's 'tags' field
        const tagIdsString = assignedTagIds.join(',');
        onTagsChange(tagIdsString);
    }, [assignedTagIds, onTagsChange]);


    // --- Handlers for New Tag Creation Input ---

    const handleNewTagNameChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_LENGTH) {
            setNewTagName(value);
        }
    };

    const handleNewTagAdditionalDataChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_LENGTH) {
            setNewTagAdditionalData(value);
        }
    };

    const handleExistingTagSelect = (e) => {
        setSelectedExistingTagId(e.target.value);
    };

    // --- Core Logic: Add Tag ---
    const handleAddTag = async () => {
        let tagIdToAdd = null;
        let tagName = null;

        // 1. Existing Tag Logic (Dropdown selection)
        if (selectedExistingTagId) {
            tagIdToAdd = selectedExistingTagId;
            // Clear selection after use
            setSelectedExistingTagId('');

        // 2. New Tag Creation Logic (Input fields)
        } else if (newTagName.trim()) {
            tagName = newTagName.trim();
            const tagAdditionalData = newTagAdditionalData.trim();

            // Check if a tag with this name already exists (case-insensitive for a simple check)
            const existingTag = availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());

            if (existingTag) {
                // If tag exists, use its ID
                tagIdToAdd = String(existingTag.id);

            } else {
                // If tag does not exist, call parent function to create it via POST request
                // IMPORTANT: onNewTagCreate only updates availableTags and returns the new tag object
                const createdTag = await onNewTagCreate(tagName, tagAdditionalData);

                if (createdTag) {
                    tagIdToAdd = String(createdTag.id);
                } else {
                    // Creation failed, abort
                    return;
                }
            }

            // Clear new tag fields after processing
            setNewTagName('');
            setNewTagAdditionalData('');

        } else {
            // Neither selected nor new name entered
            alert("Please select an existing tag or enter a name for a new tag.");
            return;
        }

        // 3. Assign the Tag (if we have an ID)
        if (tagIdToAdd && !assignedTagIds.includes(tagIdToAdd)) {
            // Add the new ID string to the state
            setAssignedTagIds(currentIds => [...currentIds, tagIdToAdd]);
        } else if (assignedTagIds.includes(tagIdToAdd)) {
            alert(`Tag is already assigned to this task.`);
        }
    };

    // --- Core Logic: Remove Tag ---
    const handleRemoveTag = (tagIdToRemove) => {
        // Filter out the ID to be removed
        setAssignedTagIds(currentIds => currentIds.filter(id => id !== String(tagIdToRemove)));
        // Note: The actual tag element is NOT deleted from the server (as per requirement)
    };

    // Helper function to get the name of an assigned tag
    const getTagNameById = (id) => {
        const tag = availableTags.find(tag => String(tag.id) === String(id));
        return tag ? tag.name : `[Unknown Tag ID: ${id}]`;
    };

    // Filter available tags to only show those not yet assigned
    const unassignedTags = availableTags.filter(tag => !assignedTagIds.includes(String(tag.id)));


    return (
        <div className="tag-assignment-container">
            {/* 1. Current Assigned Tags */}
            <div className="form-group assigned-tags-group">
                <label>Assigned Tags:</label>
                <div className="assigned-tags-list">
                    {assignedTagIds.length === 0 ? (
                        <p className="no-tags-message">No tags assigned.</p>
                    ) : (
                        assignedTagIds.map(id => (
                            <div key={id} className="assigned-tag-pill">
                                <span>{getTagNameById(id)} (ID: {id})</span>
                                {/* Button to remove tag from task */}
                                <button
                                    type="button"
                                    className="remove-tag-button"
                                    onClick={() => handleRemoveTag(id)}
                                >
                                    &times;
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 2. Add Tag Section */}
            <div className="add-tag-section">
                <label className="add-tag-label">Add Tag:</label>

                <div className="add-tag-inputs-group">

                    {/* A. Select Existing Tag */}
                    <div className="form-group tag-select-group">
                        <select
                            className="form-input tag-select"
                            value={selectedExistingTagId}
                            onChange={handleExistingTagSelect}
                            disabled={newTagName.trim().length > 0} // Disable if creating new tag
                        >
                            <option value="">-- Select Existing Tag --</option>
                            {unassignedTags.map(tag => (
                                <option key={tag.id} value={tag.id}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <p className="or-separator">OR</p>

                    {/* B. Create New Tag Fields */}
                    <div className="new-tag-fields">
                        <div className="form-group new-tag-name-group">
                            <input
                                type="text"
                                placeholder="New Tag Name"
                                value={newTagName}
                                onChange={handleNewTagNameChange}
                                className="form-input"
                                maxLength={MAX_LENGTH}
                                disabled={selectedExistingTagId.length > 0} // Disable if selecting existing
                            />
                            <p className="char-limit-message">Max length: {MAX_LENGTH} characters.</p>
                        </div>

                        <div className="form-group new-tag-data-group">
                            <input
                                type="text"
                                placeholder="Additional Data (Optional)"
                                value={newTagAdditionalData}
                                onChange={handleNewTagAdditionalDataChange}
                                className="form-input"
                                maxLength={MAX_LENGTH}
                                disabled={selectedExistingTagId.length > 0} // Disable if selecting existing
                            />
                            <p className="char-limit-message">Max length: {MAX_LENGTH} characters.</p>
                        </div>
                    </div>
                </div>

                {/* Button to finalize the addition */}
                <button
                    type="button"
                    className="modal-button add-tag-button"
                    onClick={handleAddTag}
                >
                    Add Tag
                </button>
            </div>
        </div>
    );
};

export default TagAssignment;