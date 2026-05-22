export function consultationCardPath(id: string) {
  return `/consultation-cards/${id}`;
}

export function parentReportPath(id: string, role?: 'parent' | 'staff') {
  return role === 'parent' ? `/parent/reports/${id}` : `/parent-reports/${id}`;
}
