ALTER TABLE app_users ADD COLUMN centro_email VARCHAR(254);

UPDATE app_users u
SET centro_email = (
  CASE
    WHEN substring(u.display_name FROM '\S+\s+(\S+)') IS NULL THEN
      regexp_replace(
        lower(translate(
          trim(u.display_name),
          'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
        )),
        '[^a-z0-9]', '', 'g'
      )
    ELSE
      regexp_replace(
        lower(translate(
          substring(trim(u.display_name) FROM '^(\S)') ||
          substring(u.display_name FROM '\S+\s+(\S+)'),
          'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
        )),
        '[^a-z0-9]', '', 'g'
      )
  END
) || '@elpuig.xeill.net'
WHERE EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'ALUMNO'
)
AND u.centro_email IS NULL;
