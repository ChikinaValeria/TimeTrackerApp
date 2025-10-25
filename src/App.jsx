// App.jsx (MODIFIED: postNewTag updated, EditModal component removed, EditTask imported)

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TaskCard from './TaskCard.jsx';
import InfoView from './InfoView.jsx';
import CreateTask from './CreateTask.jsx';
import TagsView from './TagsView.jsx';
import EditTask from './EditTask.jsx'; // NEW: Import the separate EditTask modal

// API base URL
const API_URL = 'http://127.0.0.1:3010';

// --- Confirmation Modal Component (Remains unchanged) ---
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

const viewData = [
  { path: '/tasks', name: 'Tasks', content: 'Tasks List', title: 'Tasks' },
  { path: '/tags', name: 'Tags', content: 'Available Tags', title: 'Available Tags' },
  { path: '/task-activity-summary', name: 'Task activity summary', content: 'Task activity summary content', title: 'Task Activity Summary' },
  { path: '/tag-activity-summary', name: 'Tag activity summary', content: 'Tag activity summary content', title: 'Tag Activity Summary' },
  { path: '/info', name: 'Info', content: '', title: 'Information' },
];

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
// NOTE: TasksView now receives tasks, availableTags and fetchData from App.jsx
const TasksView = ({ title, content, tasks, availableTags, fetchData, postNewTag }) => {
  // Tasks and Tags are now received via props, reducing state/loading complexity here
  const [isLoading, setIsLoading] = useState(true);

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // State for create task modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


  // Effect Hook to sync loading state after initial fetch in App.jsx
  useEffect(() => {
    // We rely on tasks and availableTags being populated by the parent App component
    if (tasks.length > 0 || availableTags.length > 0) {
      setIsLoading(false);
    }
    // Simple way to ensure it becomes false even if lists are empty initially
    if (!tasks && !availableTags) {
        setIsLoading(false);
    }
  }, [tasks, availableTags]);


  // --- CREATE Handlers (Unchanged) ---
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
  };

  const handleConfirmCreate = async (newTask) => {
    try {
      const postResponse = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (postResponse.ok) {
        await fetchData(); // Update UI
      } else {
        console.error(`Failed to create task: ${postResponse.statusText}`);
        alert(`Creation failed. Server responded with: ${postResponse.status}`);
      }
    } catch (err) {
      console.error("Error during POST request: ", err);
      alert("An error occurred while creating the task.");
    } finally {
      setIsCreateModalOpen(false);
    }
  };
  // --- End CREATE Handlers ---


  // --- DELETE Handlers (Unchanged) ---
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
        await fetchData(); // Update UI by re-fetching all data
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
  // --- End DELETE Handlers ---


  // --- EDIT Handlers (Unchanged logic, now calls EditTask component) ---

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask), // Send the full updated task object
      });

      if (putResponse.ok) {
        await fetchData(); // Re-fetch the updated task list to ensure UI is updated
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
  // --- End EDIT Handlers ---


  if (isLoading) {
    return <div className="view-content-box"><p>Loading tasks...</p></div>;
  }


  return (
    <>
      <div className="view-content-box">
        <div className="task-view-header">
          <h2 className="view-title">{title}</h2>
          <button
            className="add-task-button"
            onClick={handleOpenCreateModal}
          >
            Add new task
          </button>
        </div>

        <div className="tasks-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              id={task.id}
              name={task.name}
              tagNames={task.tagNames}
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

      {/* Create Task Modal - Passing required data and functions */}
      <CreateTask
        isOpen={isCreateModalOpen}
        onCreate={handleConfirmCreate}
        onCancel={handleCancelCreate}
        availableTags={availableTags} // Pass all tags
        postNewTag={postNewTag}     // Pass POST function for new tags
      />

      {/* NEW: Edit Task Modal - Using separate component */}
      <EditTask
        isOpen={isEditModalOpen}
        taskData={taskToEdit}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        availableTags={availableTags} // Pass all tags
        postNewTag={postNewTag}     // Pass POST function for new tags
      />
    </>
  );
};


// App component - Centralizing data management
const App = () => {
    const [tasks, setTasks] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);


    // --- Core Data Fetching Function ---
    // Fetches both tasks and tags, and combines task data with tag names for display
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch tags
            const tagsResponse = await fetch(`${API_URL}/tags`);
            if (!tagsResponse.ok) throw new Error("Failed to fetch tags.");
            const tagsData = await tagsResponse.json();
            setAvailableTags(tagsData);
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
                    tagNames: tagNames, // For display in TaskCard
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

    // Effect Hook to fetch data on initial component mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Core POST New Tag Function (MODIFIED TO PREVENT MODAL CLOSURE) ---
    // Function passed to CreateTask/EditModal to handle new tag creation
    const postNewTag = async (name, additional_data) => {
        const newTag = { name, additional_data };

        try {
            const postResponse = await fetch(`${API_URL}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTag),
            });

            if (postResponse.ok) {
                // Get the newly created tag object
                const createdTag = await postResponse.json();

                // *** FIX: Update ONLY the availableTags state. ***
                // This prevents the App component from re-rendering and closing the modal.
                setAvailableTags(prevTags => [...prevTags, createdTag]);

                // Return the newly created tag object
                return createdTag;
            } else {
                console.error(`Failed to create tag: ${postResponse.statusText}`);
                alert(`Creation of new tag failed.`);
                return null;
            }
        } catch (err) {
            console.error("Error during new tag POST request: ", err);
            alert("An error occurred while creating the new tag.");
            return null;
        }
    };


    // RenderViewContent component remains unchanged

    const RenderViewContent = ({ title, content }) => (
        <div className="view-content-box">
            <h2 className="view-title">{title}</h2>
            <p className="view-text">{content}</p>
        </div>
    );

    // Render loading/error state for the entire app
    if (isLoading) {
        return (
            <div className="app-wrapper">
                <div className="main-container">
                    <h1 className="app-title">TaskTrack</h1>
                    <div className="view-content-box"><p>Loading application data...</p></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-wrapper">
                <div className="main-container">
                    <h1 className="app-title">TaskTrack</h1>
                    <div className="view-content-box"><p className="error-message">Error: {error}</p></div>
                </div>
            </div>
        );
    }

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
                                    // Pass central data and functions to TasksView
                                    element = <TasksView
                                        title={item.title}
                                        tasks={tasks}
                                        availableTags={availableTags}
                                        fetchData={fetchData}
                                        postNewTag={postNewTag}
                                    />;
                                } else if (item.path === '/tags') {
                                    // Pass central data and fetch function to TagsView
                                    element = <TagsView
                                        title={item.title}
                                        tasks={tasks} // Pass tasks for delete validation
                                        // TagsView uses its own logic to fetch data, but here we can pass fetchData for general update
                                        fetchTags={fetchData}
                                    />;
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