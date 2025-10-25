// TagsView.jsx

import React, { useState, useEffect, useCallback } from 'react';
import TagCard from './TagCard.jsx';

// API base URL is hardcoded here for simplicity, typically it comes from App.jsx or context.
const API_URL = 'http://127.0.0.1:3010';

// TagsView component fetches and displays all available tags.
const TagsView = ({ title }) => {
    // State Hooks to manage the list of tags, loading state, and errors.
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effect Hook for data fetching using useCallback to stabilize the fetch function.
    const fetchTags = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // GET request to fetch all tags
            const response = await fetch(`${API_URL}/tags`);

            if (!response.ok) {
                // Throw error if response status is not successful (e.g., 404, 500)
                throw new Error("Failed to fetch tags.");
            }

            const tagsData = await response.json();
            setTags(tagsData); // Update state with fetched data
            setIsLoading(false);

        } catch (err) {
            console.error("Error fetching tags: ", err);
            setError("Failed to fetch tags from the server.");
            setIsLoading(false);
        }
    }, []); // Empty dependency array means this function is created once

    // Effect Hook to run fetchTags on component mount and automatically update UI
    useEffect(() => {
        fetchTags();
    }, [fetchTags]); // Depend on fetchTags

    if (isLoading) {
        return <div className="view-content-box"><p>Loading tags...</p></div>;
    }

    if (error) {
        return <div className="view-content-box"><p className="error-message">Error: {error}</p></div>;
    }

    return (
        <div className="view-content-box">
            <h2 className="view-title">{title}</h2>

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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagsView;