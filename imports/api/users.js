import { Meteor } from 'meteor/meteor';

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export function hasRole(user, role) {
  if (!user) return false;
  return user.profile?.role === role;
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

export function getCurrentUserRole() {
  const user = Meteor.user();
  return user?.profile?.role || null;
}

export function isCurrentUserAdmin() {
  return isAdmin(Meteor.user());
}
