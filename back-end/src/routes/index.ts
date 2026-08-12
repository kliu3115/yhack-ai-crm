import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validateBody, validateParams, validateQuery } from "../middleware/validate";
import {
  contactIdParamSchema,
  contactQuerySchema,
  createContactSchema,
  createInteractionSchema,
  createOrganizationSchema,
  createTaskSchema,
  createUserSchema,
  idParamSchema,
  loginSchema,
  organizationQuerySchema,
  taskQuerySchema,
  updateContactSchema,
  updateInteractionSchema,
  updateOrganizationSchema,
  updateTaskSchema,
  updateUserRoleSchema,
} from "../validation/schemas";
import * as contactService from "../services/contactService";
import * as organizationService from "../services/organizationService";
import * as interactionService from "../services/interactionService";
import * as taskService from "../services/taskService";
import * as dashboardService from "../services/dashboardService";
import * as userService from "../services/userService";

const router = Router();

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

// Auth routes (public)
router.post(
  "/auth/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof loginSchema>;
    const result = await userService.login(body.email, body.password);
    res.json(result);
  }),
);

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get(
  "/auth/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await userService.getMe(req.user!.id);
    res.json(user);
  }),
);

// Protected routes
router.use(authenticate);

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const data = await dashboardService.getDashboard(req.user!.tenantId);
    res.json(data);
  }),
);

// Contacts
router.get(
  "/contacts",
  validateQuery(contactQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof contactQuerySchema>;
    const result = await contactService.listContacts(req.user!.tenantId, query);
    res.json(result);
  }),
);

router.get(
  "/contacts/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const contact = await contactService.getContact(req.user!.tenantId, param(req.params.id));
    res.json(contact);
  }),
);

router.post(
  "/contacts",
  validateBody(createContactSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof createContactSchema>;
    const contact = await contactService.createContact(req.user!.tenantId, body);
    res.status(201).json(contact);
  }),
);

router.patch(
  "/contacts/:id",
  validateParams(idParamSchema),
  validateBody(updateContactSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof updateContactSchema>;
    const contact = await contactService.updateContact(
      req.user!.tenantId,
      param(req.params.id),
      body,
    );
    res.json(contact);
  }),
);

router.delete(
  "/contacts/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    await contactService.deleteContact(req.user!.tenantId, param(req.params.id), req.user!.role);
    res.status(204).send();
  }),
);

// Interactions (nested under contacts)
router.get(
  "/contacts/:contactId/interactions",
  validateParams(contactIdParamSchema),
  asyncHandler(async (req, res) => {
    const interactions = await interactionService.listInteractions(
      req.user!.tenantId,
      param(req.params.contactId),
    );
    res.json(interactions);
  }),
);

router.post(
  "/contacts/:contactId/interactions",
  validateParams(contactIdParamSchema),
  validateBody(createInteractionSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof createInteractionSchema>;
    const interaction = await interactionService.createInteraction(
      req.user!.tenantId,
      param(req.params.contactId),
      req.user!.id,
      body,
    );
    res.status(201).json(interaction);
  }),
);

router.patch(
  "/interactions/:id",
  validateParams(idParamSchema),
  validateBody(updateInteractionSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof updateInteractionSchema>;
    const interaction = await interactionService.updateInteraction(
      req.user!.tenantId,
      param(req.params.id),
      body,
    );
    res.json(interaction);
  }),
);

router.delete(
  "/interactions/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    await interactionService.deleteInteraction(
      req.user!.tenantId,
      param(req.params.id),
      req.user!.role,
    );
    res.status(204).send();
  }),
);

// Organizations
router.get(
  "/organizations",
  validateQuery(organizationQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof organizationQuerySchema>;
    const result = await organizationService.listOrganizations(req.user!.tenantId, query);
    res.json(result);
  }),
);

router.get(
  "/organizations/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const org = await organizationService.getOrganization(req.user!.tenantId, param(req.params.id));
    res.json(org);
  }),
);

router.post(
  "/organizations",
  validateBody(createOrganizationSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof createOrganizationSchema>;
    const org = await organizationService.createOrganization(req.user!.tenantId, body);
    res.status(201).json(org);
  }),
);

router.patch(
  "/organizations/:id",
  validateParams(idParamSchema),
  validateBody(updateOrganizationSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof updateOrganizationSchema>;
    const org = await organizationService.updateOrganization(
      req.user!.tenantId,
      param(req.params.id),
      body,
    );
    res.json(org);
  }),
);

router.delete(
  "/organizations/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    await organizationService.deleteOrganization(
      req.user!.tenantId,
      param(req.params.id),
      req.user!.role,
    );
    res.status(204).send();
  }),
);

// Tasks
router.get(
  "/tasks",
  validateQuery(taskQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof taskQuerySchema>;
    const result = await taskService.listTasks(req.user!.tenantId, query);
    res.json(result);
  }),
);

router.get(
  "/tasks/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.getTask(req.user!.tenantId, param(req.params.id));
    res.json(task);
  }),
);

router.post(
  "/tasks",
  validateBody(createTaskSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof createTaskSchema>;
    const task = await taskService.createTask(req.user!.tenantId, req.user!.id, body);
    res.status(201).json(task);
  }),
);

router.patch(
  "/tasks/:id",
  validateParams(idParamSchema),
  validateBody(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof updateTaskSchema>;
    const task = await taskService.updateTask(req.user!.tenantId, param(req.params.id), body);
    res.json(task);
  }),
);

router.delete(
  "/tasks/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    await taskService.deleteTask(req.user!.tenantId, param(req.params.id), req.user!.role);
    res.status(204).send();
  }),
);

// User management (admin only)
router.get(
  "/users",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await userService.listTenantUsers(req.user!.tenantId);
    res.json(users);
  }),
);

router.post(
  "/users",
  requireAdmin,
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof createUserSchema>;
    const user = await userService.createTenantUser(req.user!.tenantId, body);
    res.status(201).json(user);
  }),
);

router.patch(
  "/users/:id/role",
  requireAdmin,
  validateParams(idParamSchema),
  validateBody(updateUserRoleSchema),
  asyncHandler(async (req, res) => {
    const body = req.validatedBody as z.infer<typeof updateUserRoleSchema>;
    const user = await userService.updateUserRole(
      req.user!.tenantId,
      param(req.params.id),
      body.role,
      req.user!.id,
    );
    res.json(user);
  }),
);

export default router;
