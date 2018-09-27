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
  tc.deleted = false