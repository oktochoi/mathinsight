export function notifyAnnouncementPublished(announcementId: string) {
  void fetch('/api/push/announcement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ announcementId }),
  }).catch(() => {});
}
