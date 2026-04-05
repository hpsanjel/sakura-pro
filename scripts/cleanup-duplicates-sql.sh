#!/bin/bash

# Direct SQL cleanup script for duplicate todo categories
# This script connects directly to PostgreSQL to clean up duplicates

echo "🧹 Starting SQL cleanup of duplicate todo categories..."

# Database connection details from .env
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="hariprasadsanjel"
DB_NAME="studyabroad_db"

# SQL to clean up duplicates
SQL_SCRIPT="
-- First, let's see what duplicates we have
SELECT 
    name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id, ', ') as duplicate_ids,
    STRING_AGG(\"createdAt\"::text, ', ') as created_dates
FROM todo_categories 
WHERE \"consultancyId\" IN (SELECT id FROM consultancies LIMIT 1)
GROUP BY name 
HAVING COUNT(*) > 1;

-- Now clean up duplicates by keeping the oldest record for each name
WITH duplicates AS (
    SELECT 
        id,
        name,
        \"createdAt\",
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY \"createdAt\" ASC) as rn
    FROM todo_categories 
    WHERE \"consultancyId\" IN (SELECT id FROM consultancies LIMIT 1)
),
to_delete AS (
    SELECT id FROM duplicates WHERE rn > 1
),
to_keep AS (
    SELECT id, name FROM duplicates WHERE rn = 1
)
-- Update student_todos to point to the kept category
UPDATE student_todos 
SET \"categoryId\" = to_keep.id
FROM to_delete td, to_keep tk
WHERE student_todos.\"categoryId\" = td.id 
AND td.name = tk.name;

-- Update todo_templates to point to the kept category  
UPDATE todo_templates 
SET \"categoryId\" = to_keep.id
FROM to_delete td, to_keep tk
WHERE todo_templates.\"categoryId\" = td.id 
AND td.name = tk.name;

-- Delete the duplicate categories
DELETE FROM todo_categories 
WHERE id IN (SELECT id FROM to_delete);

-- Show final results
SELECT 
    name,
    COUNT(*) as final_count
FROM todo_categories 
WHERE \"consultancyId\" IN (SELECT id FROM consultancies LIMIT 1)
GROUP BY name 
ORDER BY name;
"

# Execute the SQL
PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
$SQL_SCRIPT
EOF

echo "✅ SQL cleanup completed!"
