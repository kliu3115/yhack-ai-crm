import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { prisma } from "../db/prisma";

const app = createApp();

describe("CRM API", () => {
  let token: string;
  let tenantId: string;
  let contactId: string;
  let organizationId: string;
  let taskId: string;

  beforeAll(async () => {
    await prisma.interaction.deleteMany();
    await prisma.task.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    const tenant = await prisma.tenant.create({ data: { name: "Test Tenant" } });
    tenantId = tenant.id;

    const hash = await bcrypt.hash("testpass123", 10);
    await prisma.user.create({
      data: {
        name: "Test Admin",
        email: "test@example.com",
        passwordHash: hash,
        role: "ADMIN",
        tenantId,
      },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "testpass123" });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/contacts");
    expect(res.status).toBe(401);
  });

  it("creates an organization", async () => {
    const res = await request(app)
      .post("/api/organizations")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Acme Corp" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Acme Corp");
    organizationId = res.body.id;
  });

  it("creates a contact", async () => {
    const res = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@acme.com",
        organizationId,
      });

    expect(res.status).toBe(201);
    expect(res.body.firstName).toBe("Alice");
    contactId = res.body.id;
  });

  it("lists contacts with search", async () => {
    const res = await request(app)
      .get("/api/contacts?search=alice")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("updates a contact", async () => {
    const res = await request(app)
      .patch(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ jobTitle: "Director" });

    expect(res.status).toBe(200);
    expect(res.body.jobTitle).toBe("Director");
  });

  it("creates an interaction", async () => {
    const res = await request(app)
      .post(`/api/contacts/${contactId}/interactions`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "EMAIL",
        date: new Date().toISOString(),
        subject: "Hello",
      });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe("EMAIL");
  });

  it("creates a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Follow up",
        priority: "HIGH",
        contactId,
      });

    expect(res.status).toBe(201);
    taskId = res.body.id;
  });

  it("returns dashboard data", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.contacts).toBeGreaterThan(0);
  });

  it("rejects invalid contact creation", async () => {
    const res = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "" });

    expect(res.status).toBe(400);
  });

  it("soft deletes a contact", async () => {
    const res = await request(app)
      .delete(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});
