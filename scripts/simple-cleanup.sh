#!/bin/bash

echo "🧹 Cleaning up duplicate todo categories..."

# Simple cleanup script
PGPASSWORD="" psql -h localhost -p 5432 -U hariprasadsanjel -d studyabroad_db << 'EOF'
-- Show current duplicates
SELECT 
    name,
    COUNT(*) as count,
    STRING_AGG(id, ', ') as ids,
    STRING_AGG("createdAt"::text, ', ') as created_times
FROM todo_categories 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY name;

-- For each duplicate group, keep the oldest one and delete the rest
-- Health & Medical (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Health & Medical' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Health & Medical' ORDER BY "createdAt" ASC LIMIT 1);

-- Application Documents (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Application Documents' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Application Documents' ORDER BY "createdAt" ASC LIMIT 1);

-- Language Preparation (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Language Preparation' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Language Preparation' ORDER BY "createdAt" ASC LIMIT 1);

-- Pre-Departure (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Pre-Departure' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Pre-Departure' ORDER BY "createdAt" ASC LIMIT 1);

-- Accommodation (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Accommodation' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Accommodation' ORDER BY "createdAt" ASC LIMIT 1);

-- Communication (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Communication' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Communication' ORDER BY "createdAt" ASC LIMIT 1);

-- Visa Preparation (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Visa Preparation' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Visa Preparation' ORDER BY "createdAt" ASC LIMIT 1);

-- Financial Documents (keep oldest)
DELETE FROM todo_categories 
WHERE name = 'Financial Documents' 
AND id != (SELECT id FROM todo_categories WHERE name = 'Financial Documents' ORDER BY "createdAt" ASC LIMIT 1);

-- Show final results
SELECT name, COUNT(*) as final_count 
FROM todo_categories 
GROUP BY name 
ORDER BY name;
EOF

echo "✅ Cleanup completed!"
