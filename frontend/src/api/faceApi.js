/**
 * Face Enrollment API
 * Talks to Node.js /api/face/* which proxies to the Python face-service.
 * Uses the shared axios instance (auto-attaches JWT token).
 */

import api from "./axios";

/**
 * Enroll face images for an employee.
 * @param {string} employeeMongoId  - Employee MongoDB _id
 * @param {string[]} images         - Array of base64-encoded image strings
 * @param {string} employeeIdStr    - Human-readable employee ID (e.g. "EMP102")
 */
export const enrollFace = (employeeMongoId, images, employeeIdStr = "") =>
  api.post(`/face/enroll/${employeeMongoId}`, {
    images,
    employee_id_str: employeeIdStr,
  });

/**
 * Get face enrollment profile for an employee.
 * @param {string} employeeMongoId - Employee MongoDB _id
 */
export const getFaceProfile = (employeeMongoId) =>
  api.get(`/face/profile/${employeeMongoId}`);

/**
 * Delete face profile for an employee.
 * @param {string} employeeMongoId - Employee MongoDB _id
 */
export const deleteFaceProfile = (employeeMongoId) =>
  api.delete(`/face/profile/${employeeMongoId}`);

/**
 * Verify a face image frame and record attendance for the recognized employee.
 * @param {string} image - Base64 encoded image frame
 * @param {string} [employeeMongoId] - Optional employee MongoDB _id for 1:1 check
 */
export const verifyAndCheckIn = (image, employeeMongoId = null) =>
  api.post("/face/verify-checkin", {
    image,
    employeeId: employeeMongoId,
  });

