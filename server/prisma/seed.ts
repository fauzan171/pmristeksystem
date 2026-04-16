import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create PM user
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'pm@ristek.com' },
    update: {},
    create: {
      email: 'pm@ristek.com',
      passwordHash,
      name: 'Project Manager',
      role: 'pm',
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create notification settings for user
  await prisma.notificationSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      deadlineReminderDays: '3,1',
      overdueNotifyEnabled: true,
      overdueNotifyInterval: 'daily',
      notifyTime: '09:00',
    },
  });

  // Sample projects
  const projects = [
    {
      name: 'Website Redesign',
      description: 'Complete redesign of the corporate website with modern UI/UX',
      status: 'ongoing' as const,
      priority: 'high' as const,
      progress: 65,
      startDate: new Date('2026-01-15'),
      deadline: new Date('2026-05-01'),
      waGroupName: 'Website Redesign Team',
    },
    {
      name: 'Mobile App Development',
      description: 'Build a cross-platform mobile application for internal use',
      status: 'ongoing' as const,
      priority: 'high' as const,
      progress: 40,
      startDate: new Date('2026-02-01'),
      deadline: new Date('2026-06-15'),
      waGroupName: 'Mobile App Team',
    },
    {
      name: 'Data Migration Project',
      description: 'Migrate legacy data to new cloud infrastructure',
      status: 'planning' as const,
      priority: 'medium' as const,
      progress: 10,
      startDate: new Date('2026-04-01'),
      deadline: new Date('2026-07-30'),
    },
    {
      name: 'API Integration Layer',
      description: 'Build centralized API gateway for all microservices',
      status: 'on_hold' as const,
      priority: 'medium' as const,
      progress: 25,
      startDate: new Date('2026-01-10'),
      deadline: new Date('2026-04-10'),
    },
    {
      name: 'Security Audit & Compliance',
      description: 'Annual security audit and compliance certification renewal',
      status: 'completed' as const,
      priority: 'high' as const,
      progress: 100,
      startDate: new Date('2025-11-01'),
      deadline: new Date('2026-03-01'),
    },
  ];

  for (let i = 0; i < projects.length; i++) {
    const projectData = projects[i];
    const projectCode = `PRJ-${String(i + 1).padStart(3, '0')}`;

    const project = await prisma.project.create({
      data: {
        projectCode,
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        priority: projectData.priority,
        progress: projectData.progress,
        startDate: projectData.startDate,
        deadline: projectData.deadline,
        waGroupName: projectData.waGroupName || null,
        pmId: user.id,
        lastUpdatedAt: new Date(),
      },
    });

    console.log(`Created project: ${project.projectCode} - ${project.name}`);

    // Create sample notes for ongoing projects
    if (projectData.status === 'ongoing') {
      const notes = [
        `Weekly progress update: ${projectData.name} is on track. Team completed sprint goals.`,
        `Stakeholder review completed. Feedback incorporated into next iteration.`,
        `Resource allocation adjusted. Additional developer assigned to accelerate timeline.`,
      ];

      for (const noteContent of notes) {
        await prisma.progressNote.create({
          data: {
            projectId: project.id,
            content: noteContent,
            createdBy: user.id,
          },
        });
      }

      // Update last note
      await prisma.project.update({
        where: { id: project.id },
        data: { lastNote: notes[notes.length - 1] },
      });
    }

    // Create activity log entries
    await prisma.activityLog.createMany({
      data: [
        {
          projectId: project.id,
          action: 'project_created',
          description: `Project "${project.name}" (${project.projectCode}) created`,
          performedBy: user.id,
        },
        ...(projectData.status === 'ongoing'
          ? [
              {
                projectId: project.id,
                action: 'status_changed',
                description: `Project "${project.name}" status changed from planning to ongoing`,
                oldValue: 'planning',
                newValue: 'ongoing',
                performedBy: user.id,
              },
            ]
          : []),
      ],
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
