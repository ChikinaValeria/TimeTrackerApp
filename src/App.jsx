// App.jsx (updated with Create Task component imported and Routes fixed)

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TaskCard from './TaskCard.jsx';
import InfoView from './InfoView.jsx';
import CreateTask from './CreateTask.jsx'; // Import CreateTask component

// API base URL
const API_URL = 'http://127.0.0.1:3010';

// --- Edit Modal Component ---
// Modal for editing task details
const EditModal = ({ isOpen, taskData, onSave, onCancel }) => {
  const MAX_LENGTH = 40;

  // State for form fields, initialized with taskData props
  const [taskName, setTaskName] = useState(taskData?.name || '');
  const [additionalData, setAdditionalData] = useState(taskData?.additional_data || '');

  // Effect to reset form state when a new task is passed for editing
  useEffect(() => {
    if (taskData) {
      setTaskName(taskData.name || '');
      setAdditionalData(taskData.additional_data || '');
    }
  }, [taskData]);

  if (!isOpen || !taskData) return null;

  // Handler for form field changes with length check
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setTaskName(value);
    }
  };

  const handleAdditionalDataChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setAdditionalData(value);
    }
  };

  // Handler for Save button
  const handleSave = () => {
    // Collect all data, ensuring we send all original fields as required by the prompt
    const updatedTask = {
      ...taskData,
      name: taskName, // Updated fields
      additional_data: additionalData, // Updated fields
      // tags, description, is_active remain from original taskData
    };
    onSave(updatedTask);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content edit-modal-content">
        <h3 className="modal-title">Edit Task: {taskData.id}</h3>
        <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

          {/* Task Name Field */}
          <div className="form-group">
            <label htmlFor="taskName">Task Name:</label>
            <input
              id="taskName"
              type="text"
              value={taskName}
              onChange={handleNameChange}
              className="form-input"
              maxLength={MAX_LENGTH} // HTML-based max length
            />
            <p className="char-limit-message">Max length: {MAX_LENGTH} characters.</p>
          </div>

          {/* Additional Data Field */}
          <div className="form-group">
            <label htmlFor="additionalData">Additional Data:</label>
            <input
              id="additionalData"
              type="text"
              value={additionalData}
              onChange={handleAdditionalDataChange}
              className="form-input"
              maxLength={MAX_LENGTH} // HTML-based max length
            />
            <p className="char-limit-message">Max length: {MAX_LENGTH} characters.</p>
          </div>

          {/* Tags field (display only) */}
          <div className="form-group">
            <label>Tags (IDs):</label>
            <p className="tag-display">{taskData.tags || 'No tags'}</p>
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
// --- End Edit Modal Component ---

// --- Modal Component (Delete Confirmation) ---
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
  { path: '/tasks', name: 'Tasks', content: 'Tasks List', title: 'Tasks' },
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

// TasksView component updated for delete, edit and CREATE functionality
const TasksView = ({ title, content }) => {
  // State for task list and loading status
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // State for create task modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State Hook for modal visibility


  // Function to fetch tasks and tags
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch tags
      const tagsResponse = await fetch(`${API_URL}/tags`);
      if (!tagsResponse.ok) throw new Error("Failed to fetch tags.");
      const tagsData = await tagsResponse.json();
      const tagsMap = new Map(tagsData.map(tag => [String(tag.id), tag.name]));

      // 2. Fetch tasks
      const tasksResponse = await fetch(`${API_URL}/tasks`);
      if (!tasksResponse.ok) throw new Error("Failed to fetch tasks.");
      const tasksData = await tasksResponse.json();

      // 3. Combine tasks with tag names
      const combinedTasks = tasksData.map(task => {
        const tagIds = task.tags ? task.tags.split(',').filter(id => id.trim() !== '') : [];
        const tagNames = tagIds.map(id => tagsMap.get(id)).filter(name => name);
        return {
          ...task,
          tagNames: tagNames, // For display
        };
      });

      setTasks(combinedTasks);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching data: ", err);
      setError("Failed to fetch data from the server.");
      setIsLoading(false);
    }
  }, []);

  // Effect Hook to fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CREATE Handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
  };

  const handleConfirmCreate = async (newTask) => {
    try {
      // POST request to create a new task
      const postResponse = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (postResponse.ok) {
        // Automatically update UI after successful creation
        await fetchData();
      } else {
        console.error(`Failed to create task: ${postResponse.statusText}`);
        alert(`Creation failed. Server responded with: ${postResponse.status}`);
      }
    } catch (err) {
      console.error("Error during POST request: ", err);
      alert("An error occurred while creating the task.");
    } finally {
      setIsCreateModalOpen(false); // Close the modal regardless of success
    }
  };


  // DELETE Handlers
  const handleDeleteRequest = (taskId, taskName) => {
    setTaskToDelete({ id: taskId, name: taskName });
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const deleteResponse = await fetch(`${API_URL}/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        setTasks(currentTasks =>
          currentTasks.filter(task => String(task.id) !== String(taskToDelete.id))
        );
      } else {
        console.error(`Failed to delete task ${taskToDelete.id}: ${deleteResponse.statusText}`);
        alert(`Deletion failed. Server responded with: ${deleteResponse.status}`);
      }
    } catch (err) {
      console.error("Error during DELETE request: ", err);
      alert("An error occurred while deleting the task.");
    } finally {
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    }
  };

  // EDIT Handlers

  // Handler to open the edit modal
  const handleEditRequest = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  // Handler for Cancel button in edit modal
  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setTaskToEdit(null); // Clear the task to edit
  };

  // Handler for Save button in edit modal (PUT request)
  const handleSaveEdit = async (updatedTask) => {
    try {
      const putResponse = await fetch(`${API_URL}/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the full updated task object as required
        body: JSON.stringify({
          id: updatedTask.id,
          name: updatedTask.name,
          description: updatedTask.description,
          tags: updatedTask.tags,
          additional_data: updatedTask.additional_data,
          is_active: updatedTask.is_active,
        }),
      });

      if (putResponse.ok) {
        // Re-fetch the updated task list to ensure UI is updated
        await fetchData();
      } else {
        console.error(`Failed to update task ${updatedTask.id}: ${putResponse.statusText}`);
        alert(`Update failed. Server responded with: ${putResponse.status}`);
      }
    } catch (err) {
      console.error("Error during PUT request: ", err);
      alert("An error occurred while saving the task.");
    } finally {
      setIsEditModalOpen(false);
      setTaskToEdit(null); // Close modal and clear task state
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
        {/* Header container for title and Add button */}
        <div className="task-view-header">
          <h2 className="view-title">{title}</h2>
          {/* Button to open the Create Task modal */}
          <button
            className="add-task-button"
            onClick={handleOpenCreateModal}
          >
            Add new task
          </button>
        </div>

        <p className="view-text">{content}</p>

        <div className="tasks-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              id={task.id}
              name={task.name}
              tagNames={task.tagNames}
              // Pass full task data required for PUT request and form pre-fill
              description={task.description}
              tags={task.tags}
              additional_data={task.additional_data}
              is_active={task.is_active}

              onDeleteRequest={handleDeleteRequest}
              onEditRequest={handleEditRequest}
            />
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirm Deletion"
        message={`Do you want to delete the task: ${taskToDelete?.name}?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Create Task Modal using the imported component */}
      <CreateTask
        isOpen={isCreateModalOpen}
        onCreate={handleConfirmCreate}
        onCancel={handleCancelCreate}
      />

      {/* Edit Task Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        taskData={taskToEdit}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
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

// App component - FIX applied here
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
            </Routes> {/* <--- ИСПРАВЛЕННЫЙ ТЕГ */}
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;