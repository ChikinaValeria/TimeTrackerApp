// TagsView.jsx

import React, { useState, useEffect, useCallback } from 'react';
import TagCard from './TagCard.jsx';
import CreateTag from './CreateTag.jsx';
// Assuming ConfirmationModal is a dependency or passed as prop,
// for simplicity in this student task, we redefine it here.

// --- Confirmation Modal Component (Redefined for TagsView Scope) ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button className="modal-button yes-button" onClick={onConfirm}>Yes</button>
                    <button className="modal-button no-button" onClick={onCancel}>No</button>
                </div>
            </div>
        </div>
    );
};
// --- End Confirmation Modal Component ---


const API_URL = 'http://127.0.0.1:3010';

// TagsView component fetches and displays all available tags.
const TagsView = ({ title }) => {
    // State Hooks to manage the list of tags, loading state, and errors.
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // State Hooks for delete confirmation modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState(null);


    // Effect Hook for data fetching using useCallback to stabilize the fetch function.
    const fetchTags = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/tags`);
            if (!response.ok) {
                throw new Error("Failed to fetch tags.");
            }
            const tagsData = await response.json();
            setTags(tagsData);
            setIsLoading(false);

        } catch (err) {
            console.error("Error fetching tags: ", err);
            setError("Failed to fetch tags from the server.");
            setIsLoading(false);
        }
    }, []);

    // Effect Hook to run fetchTags on component mount
    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    // --- CREATE Handlers (Unchanged) ---
    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
    };

    const handleConfirmCreate = async (newTag) => {
        try {
            const postResponse = await fetch(`${API_URL}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTag),
            });

            if (postResponse.ok) {
                await fetchTags();
            } else {
                console.error(`Failed to create tag: ${postResponse.statusText}`);
                alert(`Creation failed. Server responded with: ${postResponse.status}`);
            }
        } catch (err) {
            console.error("Error during POST request: ", err);
            alert("An error occurred while creating the tag.");
        } finally {
            setIsCreateModalOpen(false);
        }
    };
    // --- End CREATE Handlers ---


    // --- NEW: DELETE Handlers ---

    // Handler to open the delete confirmation modal
    const handleDeleteRequest = (tagId, tagName) => {
        setTagToDelete({ id: tagId, name: tagName });
        setIsDeleteModalOpen(true);
    };

    // Handler for Cancel button in delete modal
    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setTagToDelete(null);
    };

    // Handler for Confirm button in delete modal (main logic)
    const handleConfirmDelete = async () => {
        if (!tagToDelete) return;

        const tagIdToDelete = String(tagToDelete.id);
        let isTagUsed = false;

        // 1. Fetch ALL tasks for validation (required by prompt)
        try {
            const tasksResponse = await fetch(`${API_URL}/tasks`);
            if (!tasksResponse.ok) throw new Error("Failed to fetch tasks for validation.");
            const allTasks = await tasksResponse.json();

            // Check if the tag ID is present in any task's 'tags' string
            isTagUsed = allTasks.some(task => {
                if (!task.tags) return false;
                const tagIdsInTask = task.tags.split(',').map(s => s.trim());
                return tagIdsInTask.includes(tagIdToDelete);
            });
        } catch (validationErr) {
            console.error("Task validation failed: ", validationErr);
            alert("Failed to perform task validation before deletion. Aborting delete.");
            setIsDeleteModalOpen(false);
            setTagToDelete(null);
            return;
        }

        // 2. If tag is used, show alert and abort
        if (isTagUsed) {
            alert(`Tag "${tagToDelete.name}" cannot be deleted because it is assigned to one or more tasks.`);
            setIsDeleteModalOpen(false);
            setTagToDelete(null);
            return;
        }

        // 3. If tag is not used, perform DELETE request
        try {
            const deleteResponse = await fetch(`${API_URL}/tags/${tagIdToDelete}`, {
                method: 'DELETE',
            });

            if (deleteResponse.ok) {
                // Update local state immediately after successful deletion
                setTags(currentTags =>
                    currentTags.filter(tag => String(tag.id) !== tagIdToDelete)
                );
            } else {
                console.error(`Failed to delete tag ${tagIdToDelete}: ${deleteResponse.statusText}`);
                alert(`Deletion failed. Server responded with: ${deleteResponse.status}`);
            }
        } catch (err) {
            console.error("Error during DELETE request: ", err);
            alert("An error occurred while deleting the tag.");
        } finally {
            setIsDeleteModalOpen(false);
            setTagToDelete(null);
        }
    };
    // --- End DELETE Handlers ---


    if (isLoading) {
        return <div className="view-content-box"><p>Loading tags...</p></div>;
    }

    if (error) {
        return <div className="view-content-box"><p className="error-message">Error: {error}</p></div>;
    }

    return (
        <>
            <div className="view-content-box">
                {/* Header container for title and Add button */}
                <div className="task-view-header">
                    <h2 className="view-title">{title}</h2>
                    {/* Button to open the Create Tag modal */}
                    <button
                        className="add-task-button"
                        onClick={handleOpenCreateModal}
                    >
                        Add new tag
                    </button>
                </div>

                {/* Display message if no tags are found */}
                {tags.length === 0 ? (
                    <p className="view-text">No tags found on the server.</p>
                ) : (
                    // Container for TagCard elements
                    <div className="tags-list">
                        {tags.map(tag => (
                            <TagCard
                                key={tag.id}
                                id={tag.id}
                                name={tag.name}
                                additional_data={tag.additional_data}
                                onDeleteRequest={handleDeleteRequest} // Pass the delete handler
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Tag Modal */}
            <CreateTag
                isOpen={isCreateModalOpen}
                onCreate={handleConfirmCreate}
                onCancel={handleCancelCreate}
            />

            {/* Delete Confirmation Modal (using local definition) */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Confirm Deletion"
                message={`Do you want to delete the tag: ${tagToDelete?.name}?`}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
};

export default TagsView;