import { Channel } from '../types';

export function parseM3U8(text: string): Channel[] {
  const lines = text.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXTINF:')) {
      const logoMatch = trimmed.match(/tvg-logo="(.*?)"/);
      const groupMatch = trimmed.match(/group-title="(.*?)"/);
      // Title follows the comma after the last quoted attribute value.
      // Using lastIndexOf('"') + indexOf(',') correctly handles channel
      // names that contain commas (e.g. "BBC One, HD").
      const lastQuote = trimmed.lastIndexOf('"');
      const commaIdx = trimmed.indexOf(',', lastQuote);
      const nameMatch = commaIdx >= 0 ? trimmed.slice(commaIdx + 1).trim() : undefined;

      let category = 'General';
      let nation = 'Unknown';

      if (groupMatch?.[1]) {
        const parts = groupMatch[1].split(';');
        nation = parts[0].trim();
        if (parts.length > 1) category = parts[1].trim();
      }

      currentChannel = {
        id: `ch-${channels.length}`,
        name: nameMatch || 'Unknown Channel',
        logo: logoMatch?.[1] || undefined,
        category,
        nation,
      };
    } else if (trimmed && !trimmed.startsWith('#')) {
      if (currentChannel.name) {
        channels.push({ ...currentChannel, url: trimmed } as Channel);
        currentChannel = {};
      }
    }
  }

  return channels;
}
