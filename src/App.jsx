import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TaskCard from './TaskCard.jsx';
import InfoView from './InfoView.jsx';

const viewData = [
  { path: '/tasks', name: 'Tasks', content: 'Tasks List' },
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

const TasksView = ({ title, content }) => {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = 'http://127.0.0.1:3010';

    const fetchData = async () => {
      try {
        const tagsResponse = await fetch(`${API_URL}/tags`);
        const tagsData = await tagsResponse.json();
        const tagsMap = new Map(tagsData.map(tag => [String(tag.id), tag.name]));

        const tasksResponse = await fetch(`${API_URL}/tasks`);
        const tasksData = await tasksResponse.json();

        const combinedTasks = tasksData.map(task => {
          const tagIds = task.tags.split(',').filter(id => id.trim() !== '');
          const tagNames = tagIds.map(id => tagsMap.get(id)).filter(name => name);
          return {
            ...task,
            tagNames: tagNames,
          };
        });

        setTags(tagsData);
        setTasks(combinedTasks);
        setIsLoading(false);

      } catch (err) {
        console.error("Error fetching data: ", err);
        setError("Failed to fetch data from the server.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="view-content-box"><p>Loading tasks...</p></div>;
  }

  if (error) {
    return <div className="view-content-box"><p className="error-message">Error: {error}</p></div>;
  }

  return (
    <div className="view-content-box">
      <h2 className="view-title">{title}</h2>
      <p className="view-text">{content}</p>

      <div className="tasks-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            name={task.name}
            tagNames={task.tagNames}
          />
        ))}
      </div>
    </div>
  );
};

const RenderViewContent = ({ title, content }) => (
  <div className="view-content-box">
    <h2 className="view-title">{title}</h2>
    <p className="view-text">{content}</p>
  </div>
);

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