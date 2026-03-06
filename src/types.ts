export interface Channel {
  id: string;
  name: string;
  url: string;
  category: string;
  logo?: string;
}

export interface ChannelGroup {
  category: string;
  channels: Channel[];
}
