CREATE TABLE cards (
 id text PRIMARY KEY, data jsonb NOT NULL, version integer NOT NULL DEFAULT 1,
 publication_hash text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE card_sources (
 card_id text NOT NULL, url text NOT NULL, snapshot jsonb, content_hash text,
 fetch_status text NOT NULL, error text, fetched_at timestamptz NOT NULL DEFAULT now(), last_success_at timestamptz,
 PRIMARY KEY(card_id,url)
);
CREATE TABLE card_extractions (
 id bigserial PRIMARY KEY, card_id text NOT NULL, fingerprint text NOT NULL, source_hashes jsonb NOT NULL,
 data jsonb NOT NULL, model text NOT NULL, input_tokens integer NOT NULL DEFAULT 0, output_tokens integer NOT NULL DEFAULT 0,
 cost_usd numeric NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(card_id,fingerprint)
);
CREATE TABLE card_versions (
 card_id text NOT NULL, version integer NOT NULL, data jsonb NOT NULL, publication_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(card_id,version)
);
CREATE TABLE card_reviews (
 id uuid PRIMARY KEY, card_id text NOT NULL, base_version integer NOT NULL, changes jsonb NOT NULL,
 context jsonb NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','superseded')),
 reviewer text, resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX card_reviews_status ON card_reviews(status,card_id);
CREATE TABLE jobs (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('sync','cache')), card_id text, force boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed')),
 progress jsonb NOT NULL DEFAULT '{}', cost_usd numeric NOT NULL DEFAULT 0, error text,
 created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, heartbeat_at timestamptz, completed_at timestamptz
);
CREATE INDEX jobs_status ON jobs(status,created_at);
CREATE UNIQUE INDEX jobs_one_sync ON jobs((coalesce(card_id,'*'))) WHERE kind='sync' AND status IN ('queued','running');
CREATE TABLE cache_entries (
 key text PRIMARY KEY, payload text NOT NULL, content_hash text NOT NULL, card_version integer,
 updated_at timestamptz NOT NULL DEFAULT now()
);
