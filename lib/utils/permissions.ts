import type { WorkspaceRole } from '@/lib/types/database.types';

export type WorkspaceAction =
  | 'view'
  | 'create_event'
  | 'edit_event'
  | 'delete_event'
  | 'create_guest'
  | 'edit_guest'
  | 'delete_guest'
  | 'create_budget'
  | 'edit_budget'
  | 'delete_budget'
  | 'create_vendor'
  | 'edit_vendor'
  | 'delete_vendor'
  | 'create_task'
  | 'edit_task'
  | 'delete_task'
  | 'upload_document'
  | 'delete_document'
  | 'manage_members'
  | 'delete_workspace'
  | 'edit_workspace_settings';

const ROLE_ABILITIES: Record<WorkspaceRole, WorkspaceAction[]> = {
  owner: [
    'view',
    'create_event',
    'edit_event',
    'delete_event',
    'create_guest',
    'edit_guest',
    'delete_guest',
    'create_budget',
    'edit_budget',
    'delete_budget',
    'create_vendor',
    'edit_vendor',
    'delete_vendor',
    'create_task',
    'edit_task',
    'delete_task',
    'upload_document',
    'delete_document',
    'manage_members',
    'delete_workspace',
    'edit_workspace_settings',
  ],
  editor: [
    'view',
    'create_event',
    'edit_event',
    'delete_event',
    'create_guest',
    'edit_guest',
    'delete_guest',
    'create_budget',
    'edit_budget',
    'delete_budget',
    'create_vendor',
    'edit_vendor',
    'delete_vendor',
    'create_task',
    'edit_task',
    'delete_task',
    'upload_document',
    'delete_document',
  ],
  viewer: ['view'],
};

export function can(
  role: WorkspaceRole | null | undefined,
  action: WorkspaceAction,
  opts: { isSuperadmin?: boolean } = {}
): boolean {
  if (opts.isSuperadmin) return true;
  if (!role) return false;
  return ROLE_ABILITIES[role]?.includes(action) ?? false;
}

export function roleLabel(role: WorkspaceRole): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
  }
}

export function roleDescription(role: WorkspaceRole): string {
  switch (role) {
    case 'owner':
      return 'Full control. Can invite/remove people and delete the workspace.';
    case 'editor':
      return 'Can add and edit everything. Cannot manage members or delete the workspace.';
    case 'viewer':
      return 'Read-only access. Cannot make any changes.';
  }
}
