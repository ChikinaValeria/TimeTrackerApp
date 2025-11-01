// TagCard component, displays a single tag item with its details.
// Implemented as a simple Function Component.
const TagCard = ({ id, name, additional_data, onDeleteRequest, onEditRequest }) => { // NEW: Added onEditRequest

    // Handler to initiate the delete process
    const handleDeleteClick = () => {
        // Calls the parent function to open the modal
        onDeleteRequest(id, name);
    };

    // NEW: Handler to initiate the edit process
    const handleEditClick = () => {
        // Calls the parent function to open the edit modal, passing the current tag data
        onEditRequest({ id, name, additional_data });
    };

    return (
        // tag-card is a new class for styling (smaller height)
        <div className="tag-card">
            <div className="tag-content">
                {/* Tag name */}
                <h4 className="tag-name">
                    {name}
                </h4>

                {/* Tag ID for easy identification */}
                <p className="tag-id">
                    ID: {id}
                </p>

                {/* Additional Data display, optional */}
                {additional_data && (
                    <p className="tag-additional-data">
                        {additional_data}
                    </p>
                )}
            </div>

            {/* Action buttons container */}
            <div className="tag-actions">
                {/* NEW: Edit button */}
                <button
                    className="edit-button" // Orange button style
                    onClick={handleEditClick}
                >
                    Edit
                </button>

                {/* Delete button */}
                <button
                    className="delete-button" // Red button style
                    onClick={handleDeleteClick}
                >
                    Delete tag
                </button>
            </div>
        </div>
    );
};

export default TagCard;