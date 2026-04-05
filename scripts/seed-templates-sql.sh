#!/bin/bash

echo "🌱 Seeding database templates for existing categories..."

# Get consultancy ID
CONSULTANCY_ID=$(PGPASSWORD="" psql -h localhost -p 5432 -U hariprasadsanjel -d studyabroad_db -t -c "SELECT id FROM consultancies LIMIT 1;" | tr -d ' ')

echo "📋 Using consultancy: $CONSULTANCY_ID"

# Insert templates for each category
PGPASSWORD="" psql -h localhost -p 5432 -U hariprasadsanjel -d studyabroad_db << 'EOF'

-- Accommodation templates
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Apply for Student Accommodation',
    'Complete and submit student housing application',
    'HIGH',
    5,
    true,
    '{}',
    '{"Research available accommodation options", "Complete housing application form", "Submit required documents", "Pay accommodation deposit", "Sign housing contract", "Confirm move-in date"}',
    '["https://www.studyjapan.go.jp/en/"]',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Accommodation' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Apply for Student Accommodation'
);

INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Prepare Housing Documents',
    'Gather all documents required for rental accommodation',
    'MEDIUM',
    3,
    true,
    '{}',
    '{"Prepare guarantor documents", "Get proof of scholarship/funding", "Fill rental application forms", "Prepare emergency contact info", "Translate documents if needed"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Accommodation' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Prepare Housing Documents'
);

-- Application Documents templates
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Submit Passport Copy',
    'Provide a clear scanned copy of your passport for university application',
    'HIGH',
    2,
    true,
    '{}',
    '{"Scan passport information page", "Ensure scan is clear and readable", "Save as PDF or high-quality JPEG", "Upload to document portal"}',
    '["https://www.mofa.go.jp/passport/"]',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Application Documents' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Submit Passport Copy'
);

INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Submit Academic Transcripts',
    'Provide official academic transcripts and certificates from previous education',
    'HIGH',
    7,
    true,
    '{}',
    '{"Request official transcripts from school", "Get English translations if needed", "Obtain graduation certificates", "Scan all documents clearly", "Upload with proper naming convention"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Application Documents' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Submit Academic Transcripts'
);

-- Communication template
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Contact University International Office',
    'Establish communication with the university''s international student office',
    'MEDIUM',
    2,
    true,
    '{}',
    '{"Find international office contact information", "Send introduction email", "Ask about pre-arrival requirements", "Set up communication channel", "Save important contact details"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Communication' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Contact University International Office'
);

-- Financial Documents templates
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Submit Bank Statement',
    'Provide recent bank statement showing sufficient funds for studies',
    'HIGH',
    3,
    true,
    '{}',
    '{"Get statement from last 6 months", "Ensure sufficient balance is shown", "Translate if not in English/Japanese", "Get bank verification letter", "Scan and upload clearly"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Financial Documents' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Submit Bank Statement'
);

INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Pay Tuition Deposit',
    'Pay the required tuition deposit to secure admission',
    'URGENT',
    3,
    true,
    '{}',
    '{"Check payment deadline", "Confirm payment amount and method", "Arrange for international transfer", "Get payment receipt", "Submit receipt to university", "Keep copy for records"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Financial Documents' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Pay Tuition Deposit'
);

-- Health & Medical template
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Get Medical Certificate',
    'Obtain medical certificate as required by university/visa',
    'MEDIUM',
    5,
    true,
    '{}',
    '{"Schedule doctor appointment", "Take medical form to doctor", "Complete required medical tests", "Get doctor''s signature and stamp", "Translate if not in English", "Submit to university"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Health & Medical' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Get Medical Certificate'
);

-- Language Preparation templates
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Register for JLPT Exam',
    'Register for Japanese Language Proficiency Test if required',
    'MEDIUM',
    2,
    true,
    '{}',
    '{"Check JLPT test dates", "Determine required level (N5/N4/N3)", "Complete online registration", "Pay registration fee", "Download admission ticket", "Prepare for exam day"}',
    '["https://www.jlpt.jp/e/"]',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Language Preparation' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Register for JLPT Exam'
);

INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Create Japanese Study Plan',
    'Develop a structured plan for Japanese language learning',
    'MEDIUM',
    3,
    true,
    '{}',
    '{"Assess current Japanese level", "Set target proficiency level", "Create daily study schedule", "Choose study materials/textbooks", "Plan practice with native speakers", "Set milestones and deadlines"}',
    '["https://www.marugoto.org/"]',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Language Preparation' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Create Japanese Study Plan'
);

-- Pre-Departure templates
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Book Flight to Japan',
    'Book international flight to Japan with appropriate dates',
    'MEDIUM',
    5,
    true,
    '{}',
    '{"Check visa processing timeline", "Compare flight prices and airlines", "Book flexible ticket if possible", "Check baggage allowance", "Arrive 1-2 weeks before orientation", "Share flight details with university"}',
    '["https://www.skyscanner.com/"]',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Pre-Departure' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Book Flight to Japan'
);

INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Prepare Luggage Packing',
    'Pack essential items for living and studying in Japan',
    'LOW',
    7,
    true,
    '{}',
    '{"Check airline baggage limits", "Pack essential documents separately", "Include appropriate clothing for season", "Pack electronics and adapters", "Bring some local currency", "Prepare medications with prescriptions"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Pre-Departure' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Prepare Luggage Packing'
);

-- Visa Preparation templates
INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Complete Visa Application Form',
    'Fill out the Japanese student visa application form accurately',
    'HIGH',
    3,
    true,
    '{}',
    '{"Download latest visa application form", "Read instructions carefully", "Fill form in black ink or type", "Answer all questions truthfully", "Double-check for errors", "Sign and date the form"}',
    '["https://www.mofa.go.jp/e/visa/tourist/visa.html"]',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Visa Preparation' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Complete Visa Application Form'
);

INSERT INTO todo_templates (id, "consultancyId", "categoryId", title, description, priority, "estimatedDays", isRequired, dependencies, "checklistItems", "helpfulLinks", "targetStage", isActive, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '$CONSULTANCY_ID',
    tc.id,
    'Submit Visa Photos',
    'Provide passport-sized photos meeting Japanese visa requirements',
    'MEDIUM',
    2,
    true,
    '{}',
    '{"Check photo specifications (45mm x 35mm)", "Visit professional photo studio", "Wear formal attire (no uniforms)", "Ensure plain white background", "Get 2-3 recent photos", "Photos must be within 6 months"}',
    '{}',
    'INITIAL_ENQUIRY',
    true,
    NOW(),
    NOW()
FROM todo_categories tc 
WHERE tc.name = 'Visa Preparation' AND tc."consultancyId" = '$CONSULTANCY_ID'
AND NOT EXISTS (
    SELECT 1 FROM todo_templates tt 
    WHERE tt."categoryId" = tc.id AND tt.title = 'Submit Visa Photos'
);

EOF

echo "✅ Template seeding completed!"

# Show results
echo ""
echo "📊 Template creation results:"
PGPASSWORD="" psql -h localhost -p 5432 -U hariprasadsanjel -d studyabroad_db -c "
SELECT 
    tc.name as category_name,
    COUNT(tt.id) as template_count
FROM todo_categories tc 
LEFT JOIN todo_templates tt ON tc.id = tt.\"categoryId\"
WHERE tc.\"consultancyId\" = '$CONSULTANCY_ID'
GROUP BY tc.id, tc.name 
ORDER BY tc.name;
"

echo ""
echo "🎉 Templates are now available for the todo modal!"
