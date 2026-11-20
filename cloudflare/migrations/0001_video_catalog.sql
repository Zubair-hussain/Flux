-- Optional public video metadata catalog. Never store media, cookies, signed
-- download URLs, private job records, or personal browsing history here.
CREATE TABLE IF NOT EXISTS video_catalog (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  public_source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  rights_note TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS video_catalog_platform ON video_catalog(platform);
