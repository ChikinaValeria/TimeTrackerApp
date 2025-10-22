const TaskCard = ({ name, tagNames }) => {
  return (
    <div className="task-card">
      <h3 className="task-name">{name}</h3>
      <div className="task-tags">
        {tagNames.length > 0 && 
          tagNames.map((tag, index) => (
            <span key={index} className="task-tag">
              {tag}
            </span>
          ))
        }
      </div>
    </div>
  );
};

export default TaskCard;