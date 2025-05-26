-- Seed data for Tech Interview Analyzer
-- This script loads initial case studies into the database

-- Insert case studies from the original case_studies.json
INSERT INTO case_studies (key, name, objective, process_answer, key_considerations_answer) VALUES 
(
    'cloud_migration',
    'Cloud Migration Strategy',
    'Design a comprehensive strategy for migrating legacy applications to the cloud',
    '["Assessment and Planning", "Application Portfolio Analysis", "Migration Strategy Selection", "Security and Compliance Planning", "Cost Optimization", "Migration Execution", "Post-Migration Optimization"]'::jsonb,
    '["Security and Compliance", "Data Migration Strategy", "Downtime Minimization", "Cost Management", "Performance Monitoring", "Disaster Recovery", "Team Training"]'::jsonb
),
(
    'microservices_architecture',
    'Microservices Architecture Design',
    'Design a microservices architecture for a monolithic e-commerce application',
    '["Domain Analysis", "Service Decomposition", "API Design", "Data Management Strategy", "Communication Patterns", "Deployment Strategy", "Monitoring and Observability"]'::jsonb,
    '["Service Boundaries", "Data Consistency", "Inter-service Communication", "Fault Tolerance", "Security", "Testing Strategy", "Operational Complexity"]'::jsonb
),
(
    'system_scalability',
    'System Scalability Design',
    'Design a scalable system architecture for high-traffic applications',
    '["Load Analysis", "Horizontal vs Vertical Scaling", "Database Scaling", "Caching Strategy", "Load Balancing", "Auto-scaling Implementation", "Performance Monitoring"]'::jsonb,
    '["Performance Bottlenecks", "Database Scaling", "Caching Strategy", "Load Distribution", "Cost Optimization", "Monitoring and Alerting", "Disaster Recovery"]'::jsonb
),
(
    'data_pipeline',
    'Data Pipeline Architecture',
    'Design a real-time data processing pipeline for analytics',
    '["Data Source Analysis", "Ingestion Strategy", "Processing Framework Selection", "Storage Design", "Real-time vs Batch Processing", "Data Quality Assurance", "Monitoring and Alerting"]'::jsonb,
    '["Data Quality", "Scalability", "Fault Tolerance", "Data Governance", "Security and Privacy", "Cost Optimization", "Performance Monitoring"]'::jsonb
),
(
    'api_design',
    'RESTful API Design',
    'Design a comprehensive RESTful API for a complex business domain',
    '["Resource Identification", "HTTP Methods and Status Codes", "URL Structure Design", "Request/Response Format", "Authentication and Authorization", "Versioning Strategy", "Documentation"]'::jsonb,
    '["RESTful Principles", "Security", "Versioning", "Error Handling", "Performance", "Documentation", "Testing Strategy"]'::jsonb
);

-- Verify the data was inserted correctly
SELECT 
    key,
    name,
    jsonb_array_length(process_answer) as process_steps_count,
    jsonb_array_length(key_considerations_answer) as considerations_count,
    created_at
FROM case_studies
ORDER BY created_at; 