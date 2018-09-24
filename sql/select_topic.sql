select
  topics.topic,
  topics.name, 
  topic_config,
  topic_configs.name as config_name,
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
  topic_configs using (topic_config)
where
  (topics.name::varchar(128) = $1 or topics.topic::varchar(128) = $1) and
  topics.deleted = false