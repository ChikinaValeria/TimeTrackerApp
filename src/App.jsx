// App.jsx (updated)

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TaskCard from './TaskCard.jsx';
import InfoView from './InfoView.jsx';

// API base URL
const API_URL = 'http://127.0.0.1:3010';

// --- Modal Component ---
// Simple modal for delete confirmation
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Simple modal implementation for student project
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
// --- End Modal Component ---

const viewData = [
  { path: '/tasks', name: 'Tasks', content: 'Tasks List', title: 'Tasks' }, // Added title for TasksView
  { path: '/task-activity-summary', name: 'Task activity summary', content: 'Task activity summary content', title: 'Task Activity Summary' },
  { path: '/tag-activity-summary', name: 'Tag activity summary', content: 'Tag activity summary content', title: 'Tag Activity Summary' },
  { path: '/info', name: 'Info', content: '', title: 'Information' },
];

// NavigationMenu component remains unchanged

const NavigationMenu = () => {
  const location = useLocation();
  const activePath = location.pathname;

  return (
    <nav className="nav-menu">
      <ul className="nav-list">
        {viewData.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${activePath === item.path ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// TasksView component updated for delete functionality
const TasksView = ({ title, content }) => {
  // State for task list and loading status
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modal window
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to store task details for deletion
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Function to fetch tasks and tags
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch tags
      const tagsResponse = await fetch(`${API_URL}/tags`);
      if (!tagsResponse.ok) throw new Error("Failed to fetch tags.");
      const tagsData = await tagsResponse.json();
      // Create a map for quick tag name lookup
      const tagsMap = new Map(tagsData.map(tag => [String(tag.id), tag.name]));

      // 2. Fetch tasks
      const tasksResponse = await fetch(`${API_URL}/tasks`);
      if (!tasksResponse.ok) throw new Error("Failed to fetch tasks.");
      const tasksData = await tasksResponse.json();

      // 3. Combine tasks with tag names
      const combinedTasks = tasksData.map(task => {
        // Split tags string (e.g., "1,2,3") into an array of IDs
        const tagIds = task.tags ? task.tags.split(',').filter(id => id.trim() !== '') : [];
        // Map tag IDs to names
        const tagNames = tagIds.map(id => tagsMap.get(id)).filter(name => name);
        return {
          ...task,
          tagNames: tagNames, // Add tagNames array to the task object
        };
      });

      setTasks(combinedTasks);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching data: ", err);
      setError("Failed to fetch data from the server.");
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  // Effect Hook to fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to open the modal and set the task to delete
  const handleDeleteRequest = (taskId, taskName) => {
    setTaskToDelete({ id: taskId, name: taskName });
    setIsModalOpen(true);
  };

  // Handler for 'No' button in modal
  const handleCancelDelete = () => {
    setIsModalOpen(false);
    setTaskToDelete(null); // Clear the task to delete
  };

  // Handler for 'Yes' button in modal (confirmation)
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      // Send DELETE request to the backend
      const deleteResponse = await fetch(`${API_URL}/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        // No body needed for a standard REST DELETE request
      });

      if (deleteResponse.ok) {
        // Update the UI: remove the task from the local state
        // This ensures the UI is updated automatically (Task 3)
        setTasks(currentTasks =>
          currentTasks.filter(task => String(task.id) !== String(taskToDelete.id))
        );
      } else {
        // Log error if DELETE request failed
        console.error(`Failed to delete task ${taskToDelete.id}: ${deleteResponse.statusText}`);
        alert(`Deletion failed. Server responded with: ${deleteResponse.status}`);
      }
    } catch (err) {
      // Log network/other errors
      console.error("Error during DELETE request: ", err);
      alert("An error occurred while deleting the task.");
    } finally {
      // Close modal and clear task state regardless of success
      setIsModalOpen(false);
      setTaskToDelete(null);
    }
  };


  if (isLoading) {
    return <div className="view-content-box"><p>Loading tasks...</p></div>;
  }

  if (error) {
    return <div className="view-content-box"><p className="error-message">Error: {error}</p></div>;
  }

  return (
    <>
      <div className="view-content-box">
        <h2 className="view-title">{title}</h2>
        <p className="view-text">{content}</p>

        <div className="tasks-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              id={task.id} // Pass task id to TaskCard
              name={task.name}
              tagNames={task.tagNames}
              onDeleteRequest={handleDeleteRequest} // Pass handler to TaskCard
            />
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirm Deletion"
        message={`Do you want to delete the task: ${taskToDelete?.name}?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};

// RenderViewContent component remains unchanged

const RenderViewContent = ({ title, content }) => (
  <div className="view-content-box">
    <h2 className="view-title">{title}</h2>
    <p className="view-text">{content}</p>
  </div>
);

// App component remains largely unchanged, just uses the updated TasksView

const App = () => {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <div className="main-container">
          <h1 className="app-title">
            TaskTrack
          </h1>

          <NavigationMenu />

          <div className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/tasks" replace />} />
              {viewData.map((item) => {
                let element;
                if (item.path === '/tasks') {
                  // Pass title and content for TasksView
                  element = <TasksView title={item.title} content={item.content} />;
                } else if (item.path === '/info') {
                  element = <InfoView />;
                } else {
                  element = <RenderViewContent title={item.title} content={item.content} />;
                }

                return (
                  <Route
                    key={item.path}
                    path={item.path}
                    element={element}
                  />
                );
              })}
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;