// ActivityAnalysis.js
// Utility functions for calculating active time of tasks.

/**
 * Calculates the total active time (in milliseconds) for a single task
 * within a specified observation interval.
 *
 * The active time is the sum of the durations of the parts of activity intervals
 * for that task that overlap with the observation interval.
 *
 * @param {Array<Object>} timestamps - Sorted list of timestamps for one task.
 * @param {Date} intervalStart - The beginning of the observation interval.
 * @param {Date} intervalEnd - The end of the observation interval.
 * @returns {number} Total active time in milliseconds.
 */
export const calculateActiveTime = (timestamps, intervalStart, intervalEnd) => {
    let totalActiveTimeMs = 0;
    let isActive = false;
    let activityStartTime = null;

    // Convert interval boundaries to milliseconds for easy comparison
    const obsStartMs = intervalStart.getTime();
    const obsEndMs = intervalEnd.getTime();

    // Loop through all timestamps for the task
    for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const tsTime = new Date(timestamp.timestamp).getTime();
        const type = timestamp.type; // 0=Start, 1=Stop

        // 1. Check if the timestamp is relevant (before or during the observation end)
        if (tsTime > obsEndMs) {
            // If we're active, we must account for the duration until obsEndMs
            if (isActive && activityStartTime !== null) {
                // The activity started before or during the interval and ends after
                const segmentStart = Math.max(activityStartTime, obsStartMs);
                totalActiveTimeMs += (obsEndMs - segmentStart);
            }
            // Stop processing as all further timestamps are outside the range
            break;
        }

        if (type === 0) { // START
            isActive = true;
            activityStartTime = tsTime;

        } else if (type === 1) { // STOP
            if (isActive && activityStartTime !== null) {
                // The activity interval is [activityStartTime, tsTime]

                const activityEndTime = tsTime;

                // Check for overlap with the observation interval [obsStartMs, obsEndMs]
                // Overlap interval is [max(activityStartTime, obsStartMs), min(activityEndTime, obsEndMs)]
                const segmentStart = Math.max(activityStartTime, obsStartMs);
                const segmentEnd = Math.min(activityEndTime, obsEndMs);

                // If segmentStart < segmentEnd, there is an overlap
                if (segmentStart < segmentEnd) {
                    totalActiveTimeMs += (segmentEnd - segmentStart);
                }
            }
            isActive = false;
            activityStartTime = null;
        }
    }

    // 2. Final check: If the task was still active when the loop ended,
    // it means its last timestamp was a START or the loop broke because
    // the next timestamp was after obsEndMs.
    if (isActive && activityStartTime !== null) {
        // The activity started before the end of the observation interval and is still running (or stopped after obsEndMs)
        const segmentStart = Math.max(activityStartTime, obsStartMs);
        totalActiveTimeMs += (obsEndMs - segmentStart);
    }

    return totalActiveTimeMs;
};

/**
 * Formats milliseconds into H:MM:SS string.
 * @param {number} ms - time in milliseconds.
 * @returns {string} Formatted time string.
 */
export const formatDuration = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};