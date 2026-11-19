import type { Quality } from './platforms';
export type VideoInfo = { url: string; platform: string; title: string; creator: string; duration: number; thumbnail?: string; qualities: Quality[] };
export type Job = { id: string; title: string; platform: string; quality: Quality; status: 'queued' | 'downloading' | 'complete' | 'failed'; createdAt: string; error?: string; file?: string };
