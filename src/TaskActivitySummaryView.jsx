// TaskActivitySummaryView.jsx
// Component for viewing the active time summary of tasks over a specific time interval.

import React, { useState, useEffect, useCallback } from 'react';
import { calculateActiveTime, formatDuration } from './ActivityAnalysis.js';

const API_URL = 'http://127.0.0.1:3010';

/**
 * Helper to format Date object into the required datetime-local string format (YYYY-MM-DDTHH:MM).
 * @param {Date} date - The date object.
 * @returns {string} Formatted string.
 */
const formatToLocalDatetime = (date) => {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Helper to set the default interval (current day from start to now).
 * @returns {{start: string, end: string}} Default interval strings.
 */
const getDefaultInterval = () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    return {
        start: formatToLocalDatetime(todayStart),
        end: formatToLocalDatetime(now),
    };
};

const TaskActivitySummaryView = ({ title, tasks }) => {
    const defaultInterval = getDefaultInterval();

    // State for the observation interval
    const [startTime, setStartTime] = useState(defaultInterval.start);
    const [endTime, setEndTime] = useState(defaultInterval.end);

    // State for the calculated summary results
    const [summaryData, setSummaryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to fetch timestamps for a single task
    const fetchTaskTimestamps = useCallback(async (taskId) => {
        const url = `${API_URL}/timesfortask/${taskId}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch timestamps for task ${taskId}.`);
        }
        return response.json();
    }, []);

    // Main calculation function
    const calculateSummary = useCallback(async (startString, endString) => {
        setIsLoading(true);
        setError(null);
        setSummaryData([]);

        const intervalStart = new Date(startString);
        const intervalEnd = new Date(endString);

        if (intervalStart.getTime() >= intervalEnd.getTime()) {
            setError("Start time must be strictly before end time.");
            setIsLoading(false);
            return;
        }

        // 1. Fetch all timestamps concurrently
        const taskPromises = tasks.map(task =>
            fetchTaskTimestamps(task.id)
                .then(timestamps => ({
                    taskId: task.id,
                    taskName: task.name,
                    timestamps: timestamps
                }))
                .catch(err => {
                    console.error(err.message);
                    return { taskId: task.id, taskName: task.name, timestamps: [], error: true };
                })
        );

        const results = await Promise.all(taskPromises);

        // 2. Calculate active time for each task
        const summary = results.map(result => {
            if (result.error) return null;

            const activeTimeMs = calculateActiveTime(
                result.timestamps,
                intervalStart,
                intervalEnd
            );

            return {
                taskId: result.taskId,
                taskName: result.taskName,
                activeTimeMs: activeTimeMs,
                activeTimeFormatted: formatDuration(activeTimeMs),
            };
        }).filter(item => item !== null); // Filter out tasks with fetch errors

        // 3. Filter for "tasks of interest" (activeTimeMs > 0)
        const tasksOfInterest = summary.filter(item => item.activeTimeMs > 0);

        setSummaryData(tasksOfInterest.sort((a, b) => b.activeTimeMs - a.activeTimeMs));
        setIsLoading(false);
    }, [tasks, fetchTaskTimestamps]);

    // Effect to run the calculation on initial load (with default interval)
    useEffect(() => {
        if (tasks.length > 0) {
            calculateSummary(startTime, endTime);
        }
    }, [tasks, calculateSummary]);

    // Handler for button click
    const handleRecalculate = (e) => {
        e.preventDefault();
        calculateSummary(startTime, endTime);
    };

    return (
        <div className="view-content-box">
            <h2 className="view-title">{title}</h2>
            <p className="view-text">Analyze total active time for tasks within a defined interval.</p>

            {/* Input Form for Interval */}
            <form onSubmit={handleRecalculate} className="summary-form">
                <div className="form-group">
                    <label htmlFor="startTime">Start Date and Time:</label>
                    <input
                        type="datetime-local"
                        id="startTime"
                        className="form-input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        step="1"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="endTime">End Date and Time:</label>
                    <input
                        type="datetime-local"
                        id="endTime"
                        className="form-input"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        step="1"
                    />
                </div>
                <button
                    type="submit"
                    className="generate-summary-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Calculating...' : 'Recalculate Summary'}
                </button>
            </form>

            {/* Display Results */}
            <div className="summary-results" style={{marginTop: '30px'}}>
                <h3>Summary Results</h3>
                {error && <p className="error-message" style={{color: 'var(--color-danger)'}}>{error}</p>}

                {isLoading && <p>Loading data and calculating...</p>}

                {!isLoading && !error && (
                    summaryData.length > 0 ? (
                        <div className="tasks-list">
                            {summaryData.map(item => (
                                <div key={item.taskId} className="task-card" style={{borderLeftColor: '#3b82f6', cursor: 'default'}}>
                                    <div className="task-content">
                                        <h3 className="task-name">{item.taskName}</h3>
                                        <p className="additional-data" style={{marginBottom: 0}}>
                                            Total Active Time:
                                            <strong style={{marginLeft: '10px'}}>{item.activeTimeFormatted}</strong>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-tasks-found">No tasks were active during this interval.</p>
                    )
                )}
            </div>
        </div>
    );
};

export default TaskActivitySummaryView;