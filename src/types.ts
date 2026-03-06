export interface Channel {
  id: string;
  name: string;
  url: string;
  category: string;
  logo?: string;
  nation?: string;
}

export interface ChannelGroup {
  category: string;
  channels: Channel[];
}

export interface Nation {
  id: string;
  name: string;
}
