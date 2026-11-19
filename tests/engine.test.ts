import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
const mocks = vi.hoisted(() => ({ run: vi.fn(), files: new Map<string, string>(), names: [] as string[], missing: false }));
vi.mock('node:child_process', async () => {
  const { promisify } = await import('node:util');
  return { execFile: Object.assign(() => {}, { [promisify.custom]: mocks.run }) };
});
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async (name: string, content: string) => { mocks.files.set(name, content); }),
  rename: vi.fn(async (from: string, to: string) => { mocks.files.set(to, mocks.files.get(from)!); mocks.files.delete(from); }),
  readFile: vi.fn(async (name: string) => { if (!mocks.files.has(name)) throw new Error('ENOENT'); return mocks.files.get(name); }),
  readdir: vi.fn(async (dir: string) => dir.endsWith('downloads') ? [...mocks.files.keys()].map(f => path.basename(f)) : mocks.names),
  stat: vi.fn(async () => ({ size: 123 })),
}));
import { createJob, downloadFile, getJob, inspectVideo, listJobs, publicJob } from '../src/lib/engine';
const metadata = { title: 'Mountain sunrise', uploader: 'Creator', duration: 65, age_limit: 0, thumbnail: 'https://example.com/image.jpg', formats: [{ height: 1080, vcodec: 'avc1' }, { height: 2160, vcodec: 'vp9' }, { height: 4320, vcodec: 'vp9', has_drm: true }, { height: 720, vcodec: 'none' }] };
const id = '12345678-1234-1234-1234-123456789abc';
beforeEach(() => { mocks.files.clear(); mocks.names = ['video.mkv']; mocks.run.mockReset(); mocks.run.mockImplementation(async (_binary, args: string[]) => ({ stdout: args.includes('--dump-single-json') ? JSON.stringify(metadata) : '' })); });
describe('download engine', () => {
  it('extracts only source qualities and excludes DRM/audio-only formats', async () => {
    const info = await inspectVideo('https://youtube.com/watch?v=abc'); expect(info.qualities).toEqual([1080, 2160]); expect(info.platform).toBe('YouTube');
    const args = mocks.run.mock.calls[0][1]; expect(args).toContain('--ignore-config'); expect(args.at(-2)).toBe('--');
  });
  it('handles missing optional thumbnail and uploader', async () => {
    mocks.run.mockResolvedValue({ stdout: JSON.stringify({ ...metadata, uploader: undefined, thumbnail: 'http://example.com' }) });
    const info = await inspectVideo('https://youtu.be/abc'); expect(info.thumbnail).toBeUndefined(); expect(info.creator).toBe('YouTube');
  });
  it('rejects unusable source resolutions', async () => { mocks.run.mockResolvedValue({ stdout: JSON.stringify({ ...metadata, formats: [{ height: 360 }] }) }); await expect(inspectVideo('https://youtu.be/abc')).rejects.toThrow('No supported'); });
  it.each([{ code: 'ENOENT' }, { stderr: 'No module named yt_dlp' }])('explains a missing engine', async failure => { mocks.run.mockRejectedValue(failure); await expect(inspectVideo('https://youtu.be/abc')).rejects.toThrow('engine missing'); });
  it('reports source errors without exposing subprocess internals', async () => { mocks.run.mockRejectedValue(new Error('sensitive')); await expect(inspectVideo('https://youtu.be/abc')).rejects.toThrow('could not be accessed'); });
  it('creates a job, finishes it, lists it and resolves the file safely', async () => {
    const job = await createJob('https://youtu.be/abc', 2160); expect(job).not.toHaveProperty('file');
    await vi.waitFor(async () => expect((await getJob(job.id)).status).toBe('complete'));
    expect((await downloadFile(job.id)).size).toBe(123); expect(await listJobs()).toHaveLength(1);
    const args = mocks.run.mock.calls[1][1]; expect(args).toContain('bv[height=2160]+ba/b[height=2160]');
  });
  it('fails a job when no finished media file is produced', async () => {
    mocks.names = ['video.mkv.part']; const job = await createJob('https://youtu.be/abc', 1080);
    await vi.waitFor(async () => expect((await getJob(job.id)).status).toBe('failed'));
    expect((await getJob(job.id)).error).toContain('complete file');
  });
  it('rejects unavailable quality and invalid identifiers', async () => {
    await expect(createJob('https://youtu.be/abc', 4320)).rejects.toThrow('does not offer');
    await expect(getJob('../secret')).rejects.toThrow('not found'); await expect(getJob(id)).rejects.toThrow('not found');
  });
  it('marks interrupted jobs failed after restart', async () => {
    mocks.files.set(path.join(process.cwd(), 'downloads', `${id}.json`), JSON.stringify({ id, status: 'downloading' }));
    expect((await getJob(id)).error).toContain('server restarted'); await expect(downloadFile(id)).rejects.toThrow('not ready');
  });
  it('blocks persisted paths outside the job directory', async () => {
    mocks.files.set(path.join(process.cwd(), 'downloads', `${id}.json`), JSON.stringify({ id, status: 'complete', file: path.join(process.cwd(), 'secret') }));
    await expect(downloadFile(id)).rejects.toThrow('Invalid file');
  });
  it('removes server paths from public job responses', () => expect(publicJob({ id, title: 'A', platform: 'YouTube', quality: 720, status: 'complete', createdAt: '', file: '/secret' })).not.toHaveProperty('file'));
});
