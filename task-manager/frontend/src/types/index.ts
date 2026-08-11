export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type NotificationType =
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'ASSIGNED'
  | 'COMMENT_MENTION'
  | 'COMMENT_ADDED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
}

export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  creatorId: string;
  creator: User;
  assigneeId: string | null;
  assignee: User | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author: User;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateItem {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueOffsetDays: number | null;
  order: number;
}

export interface TaskTemplate {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: string;
  items: TemplateItem[];
}

export interface Notification {
  id: string;
  userId: string;
  taskId: string | null;
  type: NotificationType;
  message: string;
  readAt: string | null;
  createdAt: string;
}
