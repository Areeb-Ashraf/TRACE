import { UserRole } from "@prisma/client";

// Define a type for our permissions structure
type Permissions = {
  [key in UserRole]: {
    canManageUsers: boolean;
    canManageClasses: boolean;
    canCreateContent: boolean; // Assignments, Quizzes, Lessons
    canGradeSubmissions: boolean;
    canViewAllSubmissions: boolean;
    canSubmitAssignments: boolean;
    canParticipateInDiscussions: boolean;
    canViewGrades: boolean;
  };
};

// Define the specific permissions for each role
export const permissions: Permissions = {
  ADMIN: {
    canManageUsers: true,
    canManageClasses: true,
    canCreateContent: true,
    canGradeSubmissions: true,
    canViewAllSubmissions: true,
    canSubmitAssignments: false,
    canParticipateInDiscussions: false,
    canViewGrades: false,
  },
  PROFESSOR: {
    canManageUsers: false,
    canManageClasses: true,
    canCreateContent: true,
    canGradeSubmissions: true,
    canViewAllSubmissions: true,
    canSubmitAssignments: false,
    canParticipateInDiscussions: true, // Can create discussion prompts
    canViewGrades: false,
  },
  STUDENT: {
    canManageUsers: false,
    canManageClasses: false,
    canCreateContent: false,
    canGradeSubmissions: false,
    canViewAllSubmissions: false,
    canSubmitAssignments: true,
    canParticipateInDiscussions: true,
    canViewGrades: true,
  },
};

// Helper function to check if a user has a specific permission
export const hasPermission = (
  role: UserRole | undefined | null,
  permission: keyof Permissions[UserRole]
): boolean => {
  if (!role) {
    return false;
  }
  return permissions[role][permission] ?? false;
}; 