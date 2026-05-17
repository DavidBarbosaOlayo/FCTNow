WITH bootstrap_config AS (
  SELECT
    NULLIF('${bootstrapTutorEmail}', '') AS email,
    NULLIF('${bootstrapTutorPasswordHash}', '') AS password_hash,
    NULLIF('${bootstrapTutorDisplayName}', '') AS display_name
),
upsert_user AS (
  INSERT INTO app_users (
    email,
    password_hash,
    display_name,
    enabled
  )
  SELECT
    email,
    password_hash,
    COALESCE(display_name, 'Tutor Centro'),
    TRUE
  FROM bootstrap_config
  WHERE email IS NOT NULL
    AND password_hash IS NOT NULL
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    enabled = TRUE,
    updated_at = NOW()
  RETURNING id
)
INSERT INTO user_roles (user_id, role)
SELECT id, 'TUTOR_CENTRO'
FROM upsert_user
ON CONFLICT (user_id, role) DO NOTHING;
