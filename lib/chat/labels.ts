import type { ChatChannel } from '@/types/database';

export function channelDisplayLabel(ch: ChatChannel | undefined | null): string {
  if (!ch) return '채팅';
  if (ch.display_name?.trim()) return ch.display_name.trim();
  if (ch.type === 'direct') {
    const who = ch.direct_audience === 'student' ? '학생' : '학부모';
    return ch.students?.name ? `${ch.students.name} · ${who}` : `1:1 · ${who}`;
  }
  return ch.classes?.name ? `${ch.classes.name} 반 톡방` : '반 톡방';
}

export function channelListSubtitle(ch: ChatChannel): string {
  if (ch.type === 'direct') {
    if (ch.direct_audience === 'student') {
      return ch.students?.name ? `${ch.students.name} 학생` : '학생 1:1';
    }
    return ch.students?.name ? `${ch.students.name} 학부모` : '학부모 1:1';
  }
  return ch.classes?.name ? `${ch.classes.name}` : '반 톡방';
}
