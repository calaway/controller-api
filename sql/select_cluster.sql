select
  tc.cluster,
  region,
  tc.name,
  tc.tags,
  tc.created,
  tc.updated
from clusters tc
join regions r using (region)
where
  (tc.cluster::varchar(128) = $1 or tc.name::varchar(128) || '-' || r.name::varchar(128) = $1) and
  tc.deleted = false