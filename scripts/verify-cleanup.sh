#!/bin/bash

echo "🔍 Verifying Todo Categories Cleanup Results"
echo "=========================================="

# Check current category count
echo ""
echo "📊 Current Category Status:"
PGPASSWORD="" psql -h localhost -p 5432 -U hariprasadsanjel -d studyabroad_db -c "
SELECT 
    name,
    COUNT(*) as count,
    \"createdAt\" as created_time
FROM todo_categories 
GROUP BY name, \"createdAt\"
ORDER BY name;
"

echo ""
echo "🔗 Data Integrity Check:"
# Check for orphaned records
PGPASSWORD="" psql -h localhost -p 5432 -U hariprasadsanjel -d studyabroad_db -c "
SELECT 
    'student_todos' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN \"categoryId\" NOT IN (SELECT id FROM todo_categories) THEN 1 END) as orphaned_records
FROM student_todos
UNION ALL
SELECT 
    'todo_templates' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN \"categoryId\" NOT IN (SELECT id FROM todo_categories) THEN 1 END) as orphaned_records
FROM todo_templates;
"

echo ""
echo "📈 Summary Statistics:"
# Get summary stats
PGPASSWORD="" psql -h localhost -p 5432 -U hariprasadsanjel -d studyabroad_db -c "
SELECT 
    (SELECT COUNT(*) FROM todo_categories) as total_categories,
    (SELECT COUNT(DISTINCT name) FROM todo_categories) as unique_category_names,
    (SELECT COUNT(*) FROM student_todos) as total_todos,
    (SELECT COUNT(*) FROM todo_templates) as total_templates;
"

echo ""
echo "✅ Cleanup Verification Complete!"
echo ""
echo "🎯 Expected Results:"
echo "   - Total categories should equal unique category names"
echo "   - No orphaned records in student_todos or todo_templates"
echo "   - All category counts should be 1"
echo ""
echo "🚀 The API endpoint /api/student-todos/categories should now return clean data"
