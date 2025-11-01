import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:3010';

/**
 * Custom hook to fetch all necessary data from the API.
 * @returns {object} Contains loading status and fetched data (tasks, tags, timestamps).
 */
const useApiData = () => {
    const [data, setData] = useState({
        tasks: [],
        tags: [],
        timestamps: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [tasksRes, tagsRes, timestampsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/tasks`),
                fetch(`${API_BASE_URL}/tags`),
                fetch(`${API_BASE_URL}/timestamps`),
            ]);

            // Simple check for OK status, though fetch API only throws for network errors
            if (!tasksRes.ok || !tagsRes.ok || !timestampsRes.ok) {
                throw new Error("Server returned non-ok status");
            }

            const tasks = await tasksRes.json();
            const tags = await tagsRes.json();
            const timestamps = await timestampsRes.json();

            // Store data
            setData({ tasks, tags, timestamps });
        } catch (err) {
            console.error("Failed to fetch API data:", err);
            // Use user-friendly error message
            setError("Failed to load application data. Check server status.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // NOTE: In a full SPA, refreshData would be called after any action
        // (like adding a timestamp) to fulfill Requirement 2 (automatic UI update).
    }, []);

    return { data, isLoading, error, refreshData: fetchData };
};


/**
 * Function component to format a time duration in milliseconds into HH:MM:SS format.
 * @param {object} props - Component properties.
 * @param {number} props.milliseconds - The duration in milliseconds.
 * @returns {JSX.Element} Formatted time string.
 */
const TimeFormatter = ({ milliseconds }) => {
    if (milliseconds <= 0 || isNaN(milliseconds)) {
        return <span>00:00:00</span>;
    }

    const totalSeconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    return (
        <span>
            {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
    );
};


/**
 * Calculates the total non-overlapping active time for a set of tags over a given interval.
 * (This is the core, complex logic).
 *
 * @param {Array<Object>} allTimestamps - List of all timestamps from the API.
 * @param {Array<Object>} allTasks - List of all tasks from the API.
 * @param {Array<Object>} allTags - List of all tags from the API.
 * @param {string} startDateTime - The start of the observation interval (ISO string).
 * @param {string} endDateTime - The end of the observation interval (ISO string).
 * @returns {Array<Object>} Summary list: [{ tagId, tagName, activeTimeMs }]
 */
const calculateTagActivitySummary = (allTimestamps, allTasks, allTags, startDateTime, endDateTime) => {
    const intervalStart = new Date(startDateTime);
    const intervalEnd = new Date(endDateTime);

    if (intervalStart >= intervalEnd) {
        return [];
    }

    // 1. Map task IDs to their tag IDs
    const taskTagsMap = new Map();
    allTasks.forEach(task => {
        const tagIds = task.tags ? task.tags.split(',').map(id => parseInt(id.trim(), 10)) : [];
        taskTagsMap.set(task.id, tagIds);
    });

    // 2. Identify all activity intervals for each task
    const taskActivityIntervals = new Map();
    const timestampsByTask = allTimestamps.reduce((acc, ts) => {
        if (!acc[ts.task]) acc[ts.task] = [];
        acc[ts.task].push(ts);
        return acc;
    }, {});

    for (const taskId in timestampsByTask) {
        // Sort timestamps to correctly pair start (0) and end (1) events
        const timestamps = timestampsByTask[taskId].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const intervals = [];
        let currentStart = null;

        timestamps.forEach(ts => {
            const time = new Date(ts.timestamp);
            if (ts.type === 0) { // START
                if (!currentStart) {
                    currentStart = time;
                }
            } else if (ts.type === 1) { // END
                if (currentStart) {
                    intervals.push({ start: currentStart, end: time });
                    currentStart = null;
                }
            }
        });

        // Handle tasks that are currently active (no closing END timestamp)
        if (currentStart) {
             intervals.push({ start: currentStart, end: intervalEnd });
        }

        taskActivityIntervals.set(parseInt(taskId, 10), intervals);
    }

    // 3. Collect all tag activity intervals (clipping them to the observation interval)
    const tagActivityTimeline = new Map();

    for (const [taskId, intervals] of taskActivityIntervals.entries()) {
        const tagIds = taskTagsMap.get(taskId) || [];

        intervals.forEach(interval => {
            // Clip interval to the observation period
            const effectiveStart = new Date(Math.max(interval.start, intervalStart));
            const effectiveEnd = new Date(Math.min(interval.end, intervalEnd));

            if (effectiveStart < effectiveEnd) {
                tagIds.forEach(tagId => {
                    if (!tagActivityTimeline.has(tagId)) {
                        tagActivityTimeline.set(tagId, []);
                    }
                    tagActivityTimeline.get(tagId).push({ start: effectiveStart, end: effectiveEnd });
                });
            }
        });
    }

    // 4. Calculate non-overlapping time for each tag
    const summary = [];
    const tagNamesMap = new Map(allTags.map(tag => [tag.id, tag.name]));

    for (const [tagId, intervals] of tagActivityTimeline.entries()) {
        intervals.sort((a, b) => a.start - b.start);

        let totalActiveTimeMs = 0;
        let mergedIntervals = [];

        if (intervals.length > 0) {
            let currentMerge = { ...intervals[0] };

            for (let i = 1; i < intervals.length; i++) {
                const next = intervals[i];

                // Check for overlap and merge
                if (currentMerge.end >= next.start) {
                    currentMerge.end = new Date(Math.max(currentMerge.end, next.end));
                } else {
                    mergedIntervals.push(currentMerge);
                    currentMerge = { ...next };
                }
            }
            mergedIntervals.push(currentMerge); // Add the last merge
        }

        // Sum the duration of all non-overlapping intervals
        mergedIntervals.forEach(interval => {
            totalActiveTimeMs += interval.end - interval.start;
        });

        if (totalActiveTimeMs > 0) {
            summary.push({
                tagId: tagId,
                tagName: tagNamesMap.get(tagId) || `Unknown Tag (${tagId})`,
                activeTimeMs: totalActiveTimeMs
            });
        }
    }

    // Sort results by active time descending
    return summary.sort((a, b) => b.activeTimeMs - a.activeTimeMs);
};


// Utility to format date for input[type="datetime-local"]
const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Utility to set default interval: current day from start to current time
const getDefaultInterval = () => {
    const now = new Date();
    // Start of current day (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    return {
        start: formatDateTimeLocal(startOfDay),
        end: formatDateTimeLocal(now),
    };
};

// --- MAIN COMPONENT ---

/**
 * Functional component for Tag Activity Summary View.
 * Allows users to define a time interval and view the non-overlapping
 * total active time for associated tags.
 *
 * @returns {JSX.Element} The Tag Activity Summary View interface.
 */
const TagActivitySummaryView = () => {
    const { data, isLoading, error } = useApiData();
    const defaultInterval = getDefaultInterval();

    const [interval, setInterval] = useState(defaultInterval);
    const [summary, setSummary] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);

    // Handler for date/time input changes
    const handleIntervalChange = (e) => {
        setInterval(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // Core function to calculate the summary (memoized)
    const recalculateSummary = useCallback(() => {
        if (isLoading) return;

        setIsCalculating(true);

        // Convert datetime-local strings to ISO strings for use with Date objects
        const startIso = interval.start ? new Date(interval.start).toISOString() : '';
        const endIso = interval.end ? new Date(interval.end).toISOString() : '';

        // Perform the calculation
        const result = calculateTagActivitySummary(
            data.timestamps,
            data.tasks,
            data.tags,
            startIso,
            endIso
        );

        setSummary(result);
        setIsCalculating(false);
    }, [data.timestamps, data.tasks, data.tags, interval.start, interval.end, isLoading]);

    // Recalculate summary automatically when data loads for the first time
    useEffect(() => {
        // Only run calculation once data is available and not actively loading
        if (!isLoading && data.timestamps.length > 0) {
            recalculateSummary();
        }
    }, [isLoading, data.timestamps.length, recalculateSummary]);

    if (error) {
        return <div className="view-content-box">Error: {error}</div>;
    }

    if (isLoading) {
        return <div className="view-content-box">Loading data...</div>;
    }

    return (
        <div className="view-content-box">
            <h2 className="view-title">Tag Activity Summary</h2>

            {/* Summary Input Form (Uses existing CSS classes from index.css) */}
            <div className="summary-form">
                <div className="form-group">
                    <label htmlFor="start">Starting Date and Time:</label>
                    <input
                        type="datetime-local"
                        id="start"
                        name="start"
                        className="form-input"
                        value={interval.start}
                        onChange={handleIntervalChange}
                        step="1"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="end">Ending Date and Time:</label>
                    <input
                        type="datetime-local"
                        id="end"
                        name="end"
                        className="form-input"
                        value={interval.end}
                        onChange={handleIntervalChange}
                        step="1"
                    />
                </div>
                <button
                    className="generate-summary-button"
                    onClick={recalculateSummary}
                    disabled={isCalculating || isLoading}
                >
                    {isCalculating ? 'Calculating...' : 'Recalculate Summary'}
                </button>

            </div>

            <div className="summary-results">
                <h3>Results for Tags of Interest</h3>

                {summary.length > 0 ? (
                    <table className="summary-table">
                        <thead>
                            <tr>
                                <th>Tag Name</th>
                                <th>Total Active Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.map(item => (
                                <tr key={item.tagId}>
                                    <td>{item.tagName}</td>
                                    <td>
                                        <TimeFormatter milliseconds={item.activeTimeMs} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-summary-data">
                        No tag activity found in the specified interval or interval is invalid.
                    </p>
                )}
            </div>
        </div>
    );
};

export default TagActivitySummaryView;