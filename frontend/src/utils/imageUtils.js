/**
 * Returns a full URL for a profile image stored on the backend.
 * Handles: absolute http URLs, relative /uploads/... paths, and null/undefined.
 *
 * @param {string|null} path  - The value stored in profilePhoto / profilePicture
 * @returns {string|null}     - Full URL or null (so callers can show initials fallback)
 */
export const getProfileImageUrl = (path) => {
    if (!path) return null;
    // Already an absolute URL (e.g. http://... or https://...)
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Relative path — prepend the backend base URL
    const backendBase = `http://${window.location.hostname}:5000`;
    return `${backendBase}${path.startsWith('/') ? '' : '/'}${path}`;
};
