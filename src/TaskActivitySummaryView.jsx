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
    const [selectedTaskId, setSelectedTaskId] = useState('all');
    const [detailedIntervals, setDetailedIntervals] = useState([]);

    const formatDisplayDate = (dateObj) => {
        if (!dateObj) return '';
        try {
            return dateObj.toLocaleString();
        } catch {
            return String(dateObj);
        }
    };

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

        // 1. If showing ALL tasks, fetch each task's timestamps and compute totals
        if (selectedTaskId === 'all') {
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

            // Clear any previously computed detailed intervals
            setDetailedIntervals([]);
        } else {
            // 2. Specific task selected: fetch timestamps and build interval list
            try {
                const timestamps = await fetchTaskTimestamps(Number(selectedTaskId));

                // Build intervals from timestamps (sorted by timestamp ascending)
                const sorted = timestamps.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                const intervals = [];
                let currentStart = null;

                sorted.forEach(ts => {
                    if (ts.type === 0) {
                        // START
                        if (currentStart === null) {
                            currentStart = new Date(ts.timestamp);
                        } else {
                            // consecutive START without STOP - treat as new start
                            currentStart = new Date(ts.timestamp);
                        }
                    } else if (ts.type === 1) {
                        // STOP
                        if (currentStart !== null) {
                            intervals.push({ start: currentStart, end: new Date(ts.timestamp) });
                            currentStart = null;
                        } else {
                            // STOP without START - ignore
                        }
                    }
                });

                // If still active (last START without STOP)
                if (currentStart !== null) {
                    intervals.push({ start: currentStart, end: null });
                }

                // Filter intervals to those that at least partially overlap observation interval
                const obsStartMs = intervalStart.getTime();
                const obsEndMs = intervalEnd.getTime();

                const overlapping = intervals.filter(interval => {
                    const s = interval.start.getTime();
                    const e = interval.end ? interval.end.getTime() : Infinity;

                    return s <= obsEndMs && e >= obsStartMs;
                }).sort((a, b) => a.start - b.start);

                setDetailedIntervals(overlapping);

                // For single-task view, we clear the summaryData (we'll render detailedIntervals)
                setSummaryData([]);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch task timestamps.');
            }
        }
        setIsLoading(false);
    }, [tasks, fetchTaskTimestamps, selectedTaskId]);

    // Effect to run the calculation on initial load (with default interval)
    useEffect(() => {
        if (tasks.length > 0) {
            calculateSummary(startTime, endTime);
        }
    }, [tasks, calculateSummary, startTime, endTime, selectedTaskId]);

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
                    <label htmlFor="taskSelect">Select Task:</label>
                    <select
                        id="taskSelect"
                        className="form-input"
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                    >
                        <option value="all">-- All tasks --</option>
                        {tasks.map(t => (
                            <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                    </select>
                </div>

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
                    selectedTaskId === 'all' ? (
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
                    ) : (
                        // Single-task detailed intervals view
                        <div className="task-details">
                            <h4>Activity intervals for task: {
                                (tasks.find(t => String(t.id) === String(selectedTaskId)) || { name: 'Unknown' }).name
                            }</h4>

                            {detailedIntervals.length === 0 ? (
                                <p className="no-tasks-found">No activity intervals overlap the selected interval.</p>
                            ) : (
                                <div className="intervals-list">
                                    {detailedIntervals.map((iv, idx) => {
                                        const obsStartMs = new Date(startTime).getTime();
                                        const obsEndMs = new Date(endTime).getTime();
                                        const nowMs = Date.now();

                                        // Determine whether to hide end for ongoing interval per requirement
                                        const isOngoing = iv.end === null;
                                        const hideEnd = isOngoing && (obsStartMs <= nowMs) && (obsEndMs > nowMs);

                                        return (
                                            <div key={idx} className="task-card" style={{borderLeftColor: '#10b981', cursor: 'default'}}>
                                                <div className="task-content">
                                                    <p className="additional-data" style={{marginBottom: 0}}>
                                                        <strong>Start:</strong>
                                                        <span style={{marginLeft: '8px'}}>{formatDisplayDate(iv.start)}</span>
                                                    </p>
                                                    <p className="additional-data" style={{marginBottom: 0}}>
                                                        <strong>End:</strong>
                                                        <span style={{marginLeft: '8px'}}>{hideEnd ? '—' : (iv.end ? formatDisplayDate(iv.end) : 'Ongoing')}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default TaskActivitySummaryView;