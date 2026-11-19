import { describe, it, expect } from 'vitest';
import { enforceContentPolicy, validateQuality, validateUrl } from '../src/lib/policy';
import { platforms, qualityLabel } from '../src/lib/platforms';
describe('URL and quality policy', () => {
  it.each(platforms)('accepts $name public HTTPS links', p => expect(validateUrl(`https://www.${p.hosts[0]}/video/123#fragment`)).toEqual({ url: `https://www.${p.hosts[0]}/video/123`, platform: p.name }));
  it.each([undefined, 42, 'a'.repeat(2049), 'invalid', 'http://youtube.com/a', 'https://youtube.com:8080/a', 'https://user:password@youtube.com/a', 'https://127.0.0.1/a', 'https://youtube.com.evil.test/a', 'https://evilyoutube.com/a', 'https://youtube.com/%zz'])('rejects unsafe URL %s', value => expect(() => validateUrl(value)).toThrow());
  it.each(['porn', 'nsfw', '%6e%75%64%69%74%79'])('blocks sexual terms %s', term => expect(() => validateUrl(`https://reddit.com/r/${term}`)).toThrow('Sexual content'));
  it('rejects invalid qualities and labels source resolutions', () => { expect(() => validateQuality('2160')).toThrow(); expect(validateQuality(4320)).toBe(4320); expect(qualityLabel(4320)).toBe('8K'); expect(qualityLabel(2160)).toBe('4K'); expect(qualityLabel(720)).toBe('720p'); });
});
describe('metadata filter', () => {
  const clean = { title: 'Mountain sunrise', formats: [{ height: 1080 }], age_limit: 0, duration: 120 };
  it('allows ordinary metadata', () => expect(() => enforceContentPolicy(clean)).not.toThrow());
  it.each([{ age_limit: 18 }, { is_nsfw: true }, { nsfw: true }, { title: 'Explicit content' }, { description: 'sexual content' }, { categories: ['Pornography'] }, { tags: ['NSFW'] }])('blocks restricted metadata %j', extra => expect(() => enforceContentPolicy({ ...clean, ...extra })).toThrow());
  it.each([{ is_live: true }, { live_status: 'is_live' }, { _type: 'playlist' }, { entries: [] }, { duration: 7201 }, { title: '' }, { formats: null }])('blocks unsupported metadata %j', extra => expect(() => enforceContentPolicy({ ...clean, ...extra })).toThrow());
});
