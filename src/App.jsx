// App.jsx (MODIFIED: Added TagActivitySummaryView)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TaskCard from './TaskCard.jsx';
import InfoView from './InfoView.jsx';
import CreateTask from './CreateTask.jsx';
import TagsView from './TagsView.jsx';
import EditTask from './EditTask.jsx';
import TagFilter from './TagFilter.jsx';

// NEW IMPORTS: Import TagActivitySummaryView
import TaskActivitySummaryView from './TaskActivitySummaryView.jsx';
import TagActivitySummaryView from './TagActivitySummaryView.jsx'; // <--- NEW IMPORT


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


// UPDATED: Added the new view to the navigation data array.
const viewData = [
    { path: '/tasks', name: 'Tasks', content: 'Tasks List', title: 'Tasks' },
    { path: '/tags', name: 'Tags', content: 'Available Tags', title: 'Available Tags' },
    { path: '/task-activity-summary', name: 'Task activity summary', content: 'Task activity summary content', title: 'Task Activity Summary' },
    { path: '/tag-activity-summary', name: 'Tag activity summary', content: 'Tag activity summary content', title: 'Tag Activity Summary' }, // <--- NEW ENTRY
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
const TasksView = ({
    title,
    content,
    tasks,
    availableTags,
    fetchData,
    postNewTag,
    handleStartStopRequest
}) => {

    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);
    const [tasksOrder, setTasksOrder] = useState(tasks);

    // Effect Hook to update tasksOrder whenever the centralized tasks prop changes
    useEffect(() => {
        // We check both ID array and is_active status to ensure D&D order is reset after real data change (CRUD or Start/Stop)
        const currentOrderSnapshot = tasksOrder.map(t => ({ id: t.id, isActive: t.is_active }));
        const newTasksSnapshot = tasks.map(t => ({ id: t.id, isActive: t.is_active }));

        if (JSON.stringify(currentOrderSnapshot) !== JSON.stringify(newTasksSnapshot)
            || tasksOrder.length !== tasks.length) {

            setTasksOrder(tasks);
        }

        if (tasks.length > 0 || availableTags.length > 0) {
            setIsLoading(false);
        }
        if (!tasks && !availableTags) {
            setIsLoading(false);
        }
    }, [tasks, availableTags]);


    // --- D&D Handlers (CLIENT-SIDE ONLY) ---

    const handleDragStart = useCallback((taskId) => {
        dragItem.current = taskId;
    }, []);

    const handleDragEnter = useCallback((taskId) => {
        dragOverItem.current = taskId;
    }, []);

    const handleDragOver = useCallback((taskId) => {
        // No visual changes needed here for simple implementation
    }, []);

    const handleDrop = useCallback((draggedId, targetId) => {
        // 1. Calculate new local order
        const list = [...tasksOrder];
        const draggedItemIndex = list.findIndex(task => task.id === draggedId);
        const targetItemIndex = list.findIndex(task => task.id === targetId);

        if (draggedItemIndex === -1 || targetItemIndex === -1) return;

        const [reorderedItem] = list.splice(draggedItemIndex, 1);
        list.splice(targetItemIndex, 0, reorderedItem);

        // 2. Update local state immediately for visual feedback
        setTasksOrder(list);

        // 3. IMPORTANT: Clear refs
        dragItem.current = null;
        dragOverItem.current = null;

    }, [tasksOrder]);


    // --- Task Activity Handler ---
    // This handler calls the parent (App) function to post the timestamp
    const handleTaskStartStopRequest = async (taskId, type) => {
        // 'type' is 0 for Start (Activate), 1 for Stop (Deactivate)
        await handleStartStopRequest(taskId, type);
    };
    // --- End Task Activity Handler ---


    // --- Filter Logic and Handler ---

    const handleFilterChange = (tagId) => {
        setSelectedTagIds(prevIds => {
            const idString = String(tagId);
            if (prevIds.includes(idString)) {
                return prevIds.filter(id => id !== idString);
            } else {
                return [...prevIds, idString];
            }
        });
    };

    const handleClearFilter = () => {
        setSelectedTagIds([]);
    }

    const filteredTasks = React.useMemo(() => {
        if (selectedTagIds.length === 0) {
            return tasksOrder;
        }

        return tasksOrder.filter(task => {
            const taskTagIds = task.tags ? task.tags.split(',').map(id => id.trim()).filter(id => id !== '') : [];

            return selectedTagIds.every(selectedId =>
                taskTagIds.includes(selectedId)
            );
        });
    }, [tasksOrder, selectedTagIds]);


    // --- CREATE Handlers (Adjusted for is_active default) ---
    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
    };

    const handleConfirmCreate = async (newTask) => {
        // New task is always created as INACTIVE
        const taskWithInitialState = { ...newTask, is_active: false };

        try {
            const postResponse = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskWithInitialState),
            });

            if (postResponse.ok) {
                await fetchData();
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
                await fetchData();
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


    // --- EDIT Handlers (Unchanged) ---
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
            const putResponse = await fetch(`${API_URL}/tasks/${updatedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask),
            });

            if (putResponse.ok) {
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
                                onStartStopRequest={handleTaskStartStopRequest} // Pass the new handler
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

            {/* Modals remain here */}
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


    // --- Helper Function to check active status (NEW) ---
    // Determines if a task is currently active by checking its last timestamp type.
    const checkActiveStatus = async (taskId) => {
        try {
            // Get all timestamps for this task, sorted by ID (which implies timestamp order)
            const response = await fetch(`${API_URL}/timesfortask/${taskId}`);
            if (!response.ok) {
                console.error(`Failed to fetch timestamps for task ${taskId}`);
                return false;
            }
            const timestamps = await response.json();

            // The task is active if the LAST timestamp has type=0 (Start).
            if (timestamps.length === 0) {
                return false;
            }

            // Sort by ID to find the latest one reliably
            timestamps.sort((a, b) => b.id - a.id);
            const lastTimestamp = timestamps[0];

            // Type 0 is Start (Active), Type 1 is Stop (Inactive)
            return lastTimestamp.type === 0;

        } catch (err) {
            console.error(`Error checking active status for task ${taskId}: `, err);
            // Default to inactive in case of API error
            return false;
        }
    };


    // --- Core Data Fetching Function (MODIFIED) ---
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

            // 3. Determine active status for all tasks concurrently
            const activeStatusPromises = tasksData.map(task => checkActiveStatus(task.id));
            const activeStatusResults = await Promise.all(activeStatusPromises);

            // 4. Combine tasks with tag names AND active status
            const combinedTasks = tasksData.map((task, index) => {
                const tagIds = task.tags ? task.tags.split(',').filter(id => id.trim() !== '') : [];
                const tagNames = tagIds.map(id => tagsMap.get(id)).filter(name => name);

                return {
                    ...task,
                    tagNames: tagNames,
                    is_active: activeStatusResults[index],
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


    // --- Core POST Timestamp Function (NEW) ---
    // Handles task activation (type=0) and deactivation (type=1)
    const postTimestamp = async (taskId, type) => {
        // Simple client-side timestamp generation (server is expected to handle format and final storage)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestampString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;

        const newTimestamp = {
            timestamp: timestampString,
            task: taskId,
            type: type
        };

        try {
            const postResponse = await fetch(`${API_URL}/timestamps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTimestamp),
            });

            if (postResponse.ok) {
                // Automatically update UI after successful Start/Stop (Requirement 2)
                await fetchData();
            } else {
                console.error(`Failed to post timestamp for task ${taskId}, type ${type}: ${postResponse.statusText}`);
                alert(`Action failed. Server responded with: ${postResponse.status}`);
            }
        } catch (err) {
            console.error("Error during timestamp POST request: ", err);
            alert("An error occurred while performing the action.");
        }
    };


    // --- Core POST New Tag Function (remains unchanged) ---
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
                // Update available tags list immediately (Requirement 2)
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
                                        handleStartStopRequest={postTimestamp}
                                    />;
                                } else if (item.path === '/tags') {
                                    element = <TagsView
                                        title={item.title}
                                        tasks={tasks}
                                        fetchTags={fetchData}
                                    />;
                                } else if (item.path === '/task-activity-summary') {
                                    // Route for Task Activity Summary
                                    element = <TaskActivitySummaryView
                                        title={item.title}
                                        tasks={tasks}
                                    />;
                                } else if (item.path === '/tag-activity-summary') {
                                    // <--- NEW ROUTE MAPPING
                                    element = <TagActivitySummaryView
                                        title={item.title}
                                        // TagActivitySummaryView will contain its own data fetching logic
                                        // as requested in the previous step (to keep the structure simple).
                                        // If it needed App's centralized data, we'd pass 'fetchData', 'tasks', etc.
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