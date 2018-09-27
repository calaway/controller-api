select
  topics.topic,
  cluster,
  topics.name, 
  clusters.name as cluster_name,
  topics.config,
  topics.description, 
  topics.partitions, 
  topics.replicas, 
  topics.retention_ms, 
  topics.cleanup_policy, 
  topics.cluster,
  topics.region, 
  topics.organization,
  topics.created,
  topics.updated
from 
  topics
join 
  clusters using (cluster)
where
  cluster::varchar(128) = $2 and
  topics.deleted = false
order by
  topics.name