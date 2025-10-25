// TagCard.jsx

// TagCard component, displays a single tag item with its details.
// Implemented as a simple Function Component.
const TagCard = ({ id, name, additional_data }) => {
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
        </div>
    );
};

export default TagCard;