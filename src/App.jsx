import React, { useState, useEffect }  from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TaskCard from './TaskCard.jsx';

const viewData = [
  { path: '/first-view', name: 'First view', content: 'Tasks List', title: 'Task Manager' },
  { path: '/second-view', name: 'Second view', content: 'Second view content', title: 'Second view' },
  { path: '/third-view', name: 'Third view', content: 'Third view content', title: 'Third view' },
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

const FirstView = ({ title, content }) => {
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
            My simple application with routing
          </h1>
          
          <NavigationMenu />

          <div className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/first-view" replace />} />
              {viewData.map((item) => (
                 <Route 
                    key={item.path}
                    path={item.path} 
                    element={item.path === '/first-view' 
                       ? <FirstView title={item.title} content={item.content} />
                       : <RenderViewContent title={item.title} content={item.content} />
                     } 
                  />
              ))}
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;