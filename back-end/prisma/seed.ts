import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.interaction.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: { name: "YHack School CRM" },
  });

  const adminHash = await bcrypt.hash("admin12345", 10);
  const memberHash = await bcrypt.hash("member12345", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@yhack.local",
      passwordHash: adminHash,
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });

  const member = await prisma.user.create({
    data: {
      name: "Member User",
      email: "member@yhack.local",
      passwordHash: memberHash,
      role: "MEMBER",
      tenantId: tenant.id,
    },
  });

  const sponsorOrg = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: "TechCorp Sponsors",
      website: "https://techcorp.example.com",
      industry: "Technology",
      description: "Annual hackathon sponsor",
    },
  });

  const alumniOrg = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: "Alumni Network",
      industry: "Education",
    },
  });

  const john = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@techcorp.example.com",
      phone: "555-0100",
      jobTitle: "Partnerships Manager",
      organizationId: sponsorOrg.id,
      notes: "Primary sponsor contact for 2026 event.",
    },
  });

  const jane = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@alumni.edu",
      jobTitle: "Alumni Coordinator",
      organizationId: alumniOrg.id,
    },
  });

  await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex@example.com",
      jobTitle: "Volunteer",
    },
  });

  await prisma.interaction.createMany({
    data: [
      {
        tenantId: tenant.id,
        contactId: john.id,
        userId: admin.id,
        type: "CALL",
        date: new Date("2026-07-20"),
        subject: "Initial outreach",
        description: "Discussed sponsorship tiers.",
      },
      {
        tenantId: tenant.id,
        contactId: john.id,
        userId: member.id,
        type: "EMAIL",
        date: new Date("2026-07-30"),
        subject: "Proposal sent",
        description: "Sent sponsorship proposal document.",
      },
      {
        tenantId: tenant.id,
        contactId: john.id,
        userId: admin.id,
        type: "MEETING",
        date: new Date("2026-08-08"),
        subject: "Sponsorship meeting",
        description: "Met with John to discuss sponsorship details.",
      },
      {
        tenantId: tenant.id,
        contactId: jane.id,
        userId: member.id,
        type: "EMAIL",
        date: new Date("2026-08-05"),
        description: "Invited to alumni networking event.",
      },
    ],
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);

  await prisma.task.createMany({
    data: [
      {
        tenantId: tenant.id,
        title: "Follow up with TechCorp Sponsors",
        description: "Send revised proposal",
        status: "TODO",
        priority: "HIGH",
        dueDate: tomorrow,
        contactId: john.id,
        assignedUserId: admin.id,
        createdByUserId: admin.id,
      },
      {
        tenantId: tenant.id,
        title: "Email John Smith",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: dayAfter,
        contactId: john.id,
        assignedUserId: member.id,
        createdByUserId: admin.id,
      },
      {
        tenantId: tenant.id,
        title: "Schedule alumni meeting",
        status: "IN_PROGRESS",
        priority: "LOW",
        dueDate: nextWeek,
        contactId: jane.id,
        assignedUserId: member.id,
        createdByUserId: member.id,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@yhack.local / admin12345");
  console.log("Member login: member@yhack.local / member12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
