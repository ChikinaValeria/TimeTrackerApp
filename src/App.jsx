// App.jsx (MODIFIED: TasksView now includes D&D state and CLIENT-SIDE reordering)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TaskCard from './TaskCard.jsx';
import InfoView from './InfoView.jsx';
import CreateTask from './CreateTask.jsx';
import TagsView from './TagsView.jsx';
import EditTask from './EditTask.jsx';
import TagFilter from './TagFilter.jsx';

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

// TasksView component updated for D&D functionality
const TasksView = ({ title, content, tasks, availableTags, fetchData, postNewTag }) => {

  const [isLoading, setIsLoading] = useState(true);

  // State for delete modal, edit modal, create modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State Hook for selected tag IDs for filtering (array of strings)
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Ref to store the ID of the task currently being dragged
  const dragItem = useRef(null);
  // Ref to store the ID of the task that is the drag target
  const dragOverItem = useRef(null);

  // State for task list order (derived from props.tasks, but used for D&D manipulation)
  // This state holds the currently visible/reordered list.
  const [tasksOrder, setTasksOrder] = useState(tasks);

  // Effect Hook to update tasksOrder whenever the centralized tasks prop changes (e.g., after initial fetch, create, or edit)
  useEffect(() => {
    // Only update if the content of tasks has actually changed
    if (JSON.stringify(tasksOrder.map(t => t.id)) !== JSON.stringify(tasks.map(t => t.id))
        || tasksOrder.length !== tasks.length) {
        // When the master 'tasks' list changes (due to CRUD operation or initial fetch),
        // we reset the visual order to the new master list.
        setTasksOrder(tasks);
    }

    // Also update loading state (existing logic)
    if (tasks.length > 0 || availableTags.length > 0) {
      setIsLoading(false);
    }
    if (!tasks && !availableTags) {
        setIsLoading(false);
    }
  }, [tasks, availableTags]);


  // --- D&D Handlers (CLIENT-SIDE ONLY) ---

  // 1. Called when dragging starts on TaskCard
  const handleDragStart = useCallback((taskId) => {
    dragItem.current = taskId;
  }, []);

  // 2. Called when a dragged item enters the drop target TaskCard
  const handleDragEnter = useCallback((taskId) => {
    dragOverItem.current = taskId;
    // Optional: Add visual feedback logic here if needed
  }, []);

  // 3. Called when dragging over. Crucial for drop to work (preventDefault is in TaskCard)
  const handleDragOver = useCallback((taskId) => {
    // No visual changes needed here for simple implementation
  }, []);

  // 4. Called when the dragged item is dropped onto the drop target TaskCard
  const handleDrop = useCallback((draggedId, targetId) => {
    // 1. Calculate new local order
    const list = [...tasksOrder];
    const draggedItemIndex = list.findIndex(task => task.id === draggedId);
    const targetItemIndex = list.findIndex(task => task.id === targetId);

    // Safety check
    if (draggedItemIndex === -1 || targetItemIndex === -1) return;

    // Remove the dragged item from its original position
    const [reorderedItem] = list.splice(draggedItemIndex, 1);
    // Insert the item into the new position
    list.splice(targetItemIndex, 0, reorderedItem);

    // 2. Update local state immediately for visual feedback
    setTasksOrder(list);

    // 3. IMPORTANT: Clear refs
    dragItem.current = null;
    dragOverItem.current = null;

    // NOTE: Server saving (saveNewOrder) is intentionally omitted here
    // because the server lacks the necessary endpoint/data structure.

  }, [tasksOrder]); // Dependency on tasksOrder for the list manipulation


  // --- Filter Logic and Handler ---

  // Function to toggle a tag ID in the selectedTagIds state
  const handleFilterChange = (tagId) => {
    setSelectedTagIds(prevIds => {
      const idString = String(tagId);
      if (prevIds.includes(idString)) {
        // Remove tag ID (unselect)
        return prevIds.filter(id => id !== idString);
      } else {
        // Add tag ID (select)
        return [...prevIds, idString];
      }
    });
  };

  // Function to clear all filters
  const handleClearFilter = () => {
      setSelectedTagIds([]);
  }


  // Memoized function to perform the filtering based on the 'AND' logic
  // Filters the tasksOrder state, which is the currently displayed list
  const filteredTasks = React.useMemo(() => {
    if (selectedTagIds.length === 0) {
      return tasksOrder; // Use tasksOrder for rendering (D&D state)
    }

    return tasksOrder.filter(task => {
      // Get the tag IDs of the current task as an array of strings
      const taskTagIds = task.tags ? task.tags.split(',').map(id => id.trim()).filter(id => id !== '') : [];

      // Check if EVERY selected tag ID is present in the task's tag IDs
      return selectedTagIds.every(selectedId =>
        taskTagIds.includes(selectedId)
      );
    });
  }, [tasksOrder, selectedTagIds]); // Dependency on tasksOrder for D&D consistency


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
        await fetchData(); // Update UI (resets client-side D&D order)
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
        await fetchData(); // Update UI (resets client-side D&D order)
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


  // --- EDIT Handlers (Unchanged logic) ---
  const handleEditRequest = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  };

  const handleSaveEdit = async (updatedTask) => {
    try {
      // NOTE: This PUT uses the existing endpoint structure: PUT http://127.0.0.1:3010/tasks/1
      const putResponse = await fetch(`${API_URL}/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask), // Send the full updated task object
      });

      if (putResponse.ok) {
        await fetchData(); // Re-fetch the updated task list (resets client-side D&D order)
      } else {
        console.error(`Failed to update task ${updatedTask.id}: ${putResponse.statusText}`);
        alert(`Update failed. Server responded with: ${putResponse.status}`);
      }
    } catch (err) {
      console.error("Error during PUT request: ", err);
      alert("An error occurred while saving the task.");
    } finally {
      setIsEditModalOpen(false);
      setTaskToEdit(null);
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

        {/* Tag Filter Component */}
        <TagFilter
            availableTags={availableTags}
            selectedTagIds={selectedTagIds}
            onFilterChange={handleFilterChange}
        />
        <button
            className={`clear-filter-button ${selectedTagIds.length === 0 ? 'inactive' : ''}`}
            onClick={handleClearFilter}
            disabled={selectedTagIds.length === 0}
        >
            Clear Filters ({selectedTagIds.length})
        </button>


        <div className="tasks-list">
          {filteredTasks.length > 0 ? (
            // Map over the filtered list (which uses tasksOrder for D&D)
            filteredTasks.map(task => (
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
                    // Pass D&D handlers to TaskCard
                    onDragStart={handleDragStart}
                    onDragEnter={handleDragEnter}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                />
            ))
          ) : (
             <p className="no-tasks-found">No tasks found matching all selected tags.</p>
          )}
        </div>
      </div>

      {/* Delete, Create, Edit Modals remain here */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirm Deletion"
        message={`Do you want to delete the task: ${taskToDelete?.name}?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <CreateTask
        isOpen={isCreateModalOpen}
        onCreate={handleConfirmCreate}
        onCancel={handleCancelCreate}
        availableTags={availableTags}
        postNewTag={postNewTag}
      />
      <EditTask
        isOpen={isEditModalOpen}
        taskData={taskToEdit}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        availableTags={availableTags}
        postNewTag={postNewTag}
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

    // --- Core POST New Tag Function ---
    const postNewTag = async (name, additional_data) => {
        const newTag = { name, additional_data };

        try {
            const postResponse = await fetch(`${API_URL}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTag),
            });

            if (postResponse.ok) {
                const createdTag = await postResponse.json();
                setAvailableTags(prevTags => [...prevTags, createdTag]);
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


    const RenderViewContent = ({ title, content }) => (
        <div className="view-content-box">
            <h2 className="view-title">{title}</h2>
            <p className="view-text">{content}</p>
        </div>
    );

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
                                    element = <TasksView
                                        title={item.title}
                                        tasks={tasks}
                                        availableTags={availableTags}
                                        fetchData={fetchData}
                                        postNewTag={postNewTag}
                                    />;
                                } else if (item.path === '/tags') {
                                    element = <TagsView
                                        title={item.title}
                                        tasks={tasks}
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