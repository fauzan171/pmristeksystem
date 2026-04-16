interface TemplateVariables {
  [key: string]: string | number | Date | undefined;
}

const DEFAULT_DEADLINE_TEMPLATE = `*Deadline Reminder* 📅

Project: {{project_name}}
Code: {{project_code}}
Deadline: {{deadline}}
Days Remaining: {{days_remaining}}
Current Progress: {{progress}}%
PM: {{pm_name}}

{{project_description}}

Please ensure all tasks are on track.`;

const DEFAULT_OVERDUE_TEMPLATE = `*Overdue Alert* ⚠️

Project: {{project_name}}
Code: {{project_code}}
Deadline: {{deadline}}
Days Overdue: {{days_overdue}}
Current Progress: {{progress}}%
PM: {{pm_name}}

This project has passed its deadline. Immediate attention required!`;

const DEFAULT_PROGRESS_TEMPLATE = `*Progress Update* 📊

Project: {{project_name}}
Code: {{project_code}}
Progress: {{progress}}%
Status: {{status}}
Last Updated: {{last_updated}}

{{last_note}}`;

export const processTemplate = (
  template: string,
  variables: TemplateVariables
): string => {
  let processed = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = value instanceof Date
      ? value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : String(value ?? '');
    processed = processed.replace(new RegExp(placeholder, 'g'), replacement);
  }

  return processed;
};

export const getDefaultTemplate = (type: 'deadline' | 'overdue' | 'progress'): string => {
  switch (type) {
    case 'deadline':
      return DEFAULT_DEADLINE_TEMPLATE;
    case 'overdue':
      return DEFAULT_OVERDUE_TEMPLATE;
    case 'progress':
      return DEFAULT_PROGRESS_TEMPLATE;
  }
};

export const buildDeadlineMessage = (
  template: string | null | undefined,
  data: {
    projectName: string;
    projectCode: string;
    deadline: Date;
    daysRemaining: number;
    progress: number;
    pmName: string;
    projectDescription?: string;
  }
): string => {
  const tpl = template || getDefaultTemplate('deadline');
  return processTemplate(tpl, {
    project_name: data.projectName,
    project_code: data.projectCode,
    deadline: data.deadline,
    days_remaining: data.daysRemaining,
    progress: data.progress,
    pm_name: data.pmName,
    project_description: data.projectDescription || '',
  });
};

export const buildOverdueMessage = (
  template: string | null | undefined,
  data: {
    projectName: string;
    projectCode: string;
    deadline: Date;
    daysOverdue: number;
    progress: number;
    pmName: string;
  }
): string => {
  const tpl = template || getDefaultTemplate('overdue');
  return processTemplate(tpl, {
    project_name: data.projectName,
    project_code: data.projectCode,
    deadline: data.deadline,
    days_overdue: data.daysOverdue,
    progress: data.progress,
    pm_name: data.pmName,
  });
};

export const buildProgressMessage = (
  template: string | null | undefined,
  data: {
    projectName: string;
    projectCode: string;
    progress: number;
    status: string;
    lastUpdated: Date;
    lastNote?: string;
  }
): string => {
  const tpl = template || getDefaultTemplate('progress');
  return processTemplate(tpl, {
    project_name: data.projectName,
    project_code: data.projectCode,
    progress: data.progress,
    status: data.status,
    last_updated: data.lastUpdated,
    last_note: data.lastNote || '',
  });
};
