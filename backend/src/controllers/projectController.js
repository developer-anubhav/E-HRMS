import {
  createProjectService,
  getProjectsService,
  getProjectByIdService,
  updateProjectService,
  deleteProjectService,
} from "../services/projectService.js";

export const createProject = async (req, res) => {
  try {
    const project = await createProjectService(req.body, req.user);
    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    const statusCode = error.message.includes("required") || error.message.includes("already exists") || error.message.includes("eligible") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await getProjectsService(req.user, req.query);
    return res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await getProjectByIdService(req.params.id, req.user);
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("denied") ? 403 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await updateProjectService(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("denied") ? 403 : error.message.includes("eligible") || error.message.includes("already in use") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const result = await deleteProjectService(req.params.id, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("denied") ? 403 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};
