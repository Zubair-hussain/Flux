import { platforms, qualities, type Quality } from './platforms';

export class AppError extends Error { constructor(message: string, public status = 400) { super(message); } }
const sexualTerms = /\b(porn\w*|xxx|nsfw|nude[sd]?|nudity|sexual|sex|hentai|onlyfans|erotic\w*|explicit|adult[ -]content)\b/i;
export function validateUrl(input: unknown) {
  if (typeof input !== 'string' || input.length > 2048) throw new AppError('Enter a valid video URL.');
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new AppError('Enter a complete https:// video URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new AppError('Use a public HTTPS video URL without credentials or custom ports.');
  const platform = platforms.find(p => p.hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)));
  if (!platform) throw new AppError('This platform is not supported. Choose a platform shown on the homepage.');
  let decoded: string;
  try { decoded = decodeURIComponent(url.href); } catch { throw new AppError('The URL encoding is invalid.'); }
  if (sexualTerms.test(decoded)) throw new AppError('Sexual content is not allowed.', 403);
  url.hash = '';
  return { url: url.href, platform: platform.name };
}
export function validateQuality(input: unknown): Quality {
  if (!qualities.includes(input as Quality)) throw new AppError('Choose a supported resolution.');
  return input as Quality;
}
export function enforceContentPolicy(info: Record<string, unknown>) {
  if (info.is_live || info.live_status === 'is_live') throw new AppError('Live streams are not supported.');
  if (info._type === 'playlist' || info.entries) throw new AppError('Paste a single video URL, not a playlist.');
  if (Number(info.age_limit) >= 18 || info.is_nsfw === true || info.nsfw === true) throw new AppError('Age-restricted or sexual content is not allowed.', 403);
  const text = [info.title, info.description, info.categories, info.tags].flat().filter(Boolean).join(' ');
  if (sexualTerms.test(text)) throw new AppError('Sexual content is not allowed.', 403);
  if (!info.title || !Array.isArray(info.formats)) throw new AppError('The source did not return usable video metadata.', 422);
  if (Number(info.duration) > 7200) throw new AppError('This MVP supports videos up to two hours.');
}
