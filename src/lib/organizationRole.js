export function getMembershipForOrganization(user, organizationId) {
  if (!user?.organizations?.length || !organizationId) {
    return null;
  }

  return user.organizations.find(
    (membership) => membership.organization?.id === organizationId
  ) || null;
}

export function getCurrentOrganizationRole(user, currentOrganization) {
  const membership = getMembershipForOrganization(user, currentOrganization?.id);
  return membership?.role || null;
}

export function hasOrganizationRole(user, currentOrganization, allowedRoles = []) {
  const role = getCurrentOrganizationRole(user, currentOrganization);
  return Boolean(role && allowedRoles.includes(role));
}
