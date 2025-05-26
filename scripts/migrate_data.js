const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('../database/config');
const CaseStudy = require('../models/CaseStudy');

async function migrateData() {
  console.log('🚀 Starting data migration...');
  
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database connected');
    
    // Read existing case studies JSON
    const caseStudiesPath = path.join(__dirname, '..', 'case_studies.json');
    
    if (!fs.existsSync(caseStudiesPath)) {
      console.log('⚠️  case_studies.json not found, creating default case studies...');
      await createDefaultCaseStudies();
      return;
    }
    
    const caseStudiesData = JSON.parse(fs.readFileSync(caseStudiesPath, 'utf-8'));
    console.log('📚 Found case studies:', Object.keys(caseStudiesData).length);
    
    // Migrate each case study
    for (const [key, data] of Object.entries(caseStudiesData)) {
      try {
        // Check if case study already exists
        const existing = await CaseStudy.findByKey(key);
        
        if (existing) {
          console.log(`⏭️  Case study '${key}' already exists, skipping...`);
          continue;
        }
        
        // Create new case study
        const caseStudy = await CaseStudy.create({
          key: key,
          name: data.name,
          objective: data.objective,
          process_answer: data.process_answer,
          key_considerations_answer: data.key_considerations_answer
        });
        
        console.log(`✅ Migrated case study: ${caseStudy.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate case study '${key}':`, error);
      }
    }
    
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createDefaultCaseStudies() {
  console.log('📝 Creating default case studies...');
  
  const defaultCaseStudies = [
    {
      key: 'cloud_migration',
      name: 'Cloud Migration Strategy',
      objective: 'Design a comprehensive strategy for migrating legacy applications to the cloud',
      process_answer: [
        "Assessment and Planning",
        "Application Portfolio Analysis", 
        "Migration Strategy Selection",
        "Security and Compliance Planning",
        "Cost Optimization",
        "Migration Execution",
        "Post-Migration Optimization"
      ],
      key_considerations_answer: [
        "Security and Compliance",
        "Data Migration Strategy",
        "Downtime Minimization", 
        "Cost Management",
        "Performance Monitoring",
        "Disaster Recovery",
        "Team Training"
      ]
    },
    {
      key: 'microservices_architecture',
      name: 'Microservices Architecture Design',
      objective: 'Design a scalable microservices architecture for a large e-commerce platform',
      process_answer: [
        "Domain-Driven Design",
        "Service Decomposition",
        "API Gateway Design",
        "Data Management Strategy",
        "Communication Patterns",
        "Deployment Strategy",
        "Monitoring and Observability"
      ],
      key_considerations_answer: [
        "Service Boundaries",
        "Data Consistency",
        "Network Latency",
        "Service Discovery",
        "Circuit Breakers",
        "Security Between Services",
        "Testing Strategy"
      ]
    },
    {
      key: 'system_scalability',
      name: 'System Scalability Design',
      objective: 'Design a system that can handle 10x traffic growth while maintaining performance',
      process_answer: [
        "Current System Analysis",
        "Bottleneck Identification",
        "Horizontal Scaling Strategy",
        "Database Scaling",
        "Caching Strategy",
        "Load Balancing",
        "Performance Testing"
      ],
      key_considerations_answer: [
        "Database Sharding",
        "CDN Implementation",
        "Auto-scaling Policies",
        "Session Management",
        "Cache Invalidation",
        "Monitoring and Alerting",
        "Cost Optimization"
      ]
    }
  ];
  
  for (const caseStudyData of defaultCaseStudies) {
    try {
      const caseStudy = await CaseStudy.create(caseStudyData);
      console.log(`✅ Created default case study: ${caseStudy.name}`);
    } catch (error) {
      console.error(`❌ Failed to create case study '${caseStudyData.key}':`, error);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData, createDefaultCaseStudies }; 