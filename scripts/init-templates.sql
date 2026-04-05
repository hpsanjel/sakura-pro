-- Initialize common expense templates
-- First, get the first consultancy ID
DO $$
DECLARE
    consultancy_id TEXT;
BEGIN
    -- Get the first consultancy ID
    SELECT id INTO consultancy_id FROM consultancies LIMIT 1;
    
    IF consultancy_id IS NULL THEN
        RAISE NOTICE 'No consultancy found. Please create a consultancy first.';
        RETURN;
    END IF;
    
    -- Check if templates already exist
    IF EXISTS (SELECT 1 FROM office_expense_templates WHERE "consultancyId" = consultancy_id) THEN
        RAISE NOTICE 'Templates already exist for consultancy %', consultancy_id;
        RETURN;
    END IF;
    
    -- Insert common expense templates
    INSERT INTO office_expense_templates (
        id, "consultancyId", "title", "description", "category", "suggestedAmount", 
        "expenseMode", "isCommon", "isActive", "tags", "createdAt", "updatedAt"
    ) VALUES
    -- Utilities
    (gen_random_uuid(), consultancy_id, 'Electricity Bill', 'Monthly electricity bill for office', 'UTILITIES', 150, 'CASH', true, true, ARRAY['monthly', 'essential'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Internet Bill', 'Monthly internet service bill', 'UTILITIES', 80, 'CASH', true, true, ARRAY['monthly', 'essential'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Water Bill', 'Monthly water utility bill', 'UTILITIES', 40, 'CASH', true, true, ARRAY['monthly', 'essential'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Phone Bill', 'Monthly telephone service bill', 'UTILITIES', 60, 'CASH', true, true, ARRAY['monthly', 'essential'], NOW(), NOW()),
    
    -- Office Supplies
    (gen_random_uuid(), consultancy_id, 'Stationery Supplies', 'Office stationery and supplies', 'SUPPLIES', 25, 'CASH', true, true, ARRAY['monthly', 'office'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Printer Paper', 'Paper for office printers', 'SUPPLIES', 15, 'CASH', true, true, ARRAY['monthly', 'office'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Office Cleaning', 'Professional cleaning services', 'MAINTENANCE', 100, 'CASH', true, true, ARRAY['monthly', 'essential'], NOW(), NOW()),
    
    -- Subscriptions
    (gen_random_uuid(), consultancy_id, 'Software Licenses', 'Business software subscriptions', 'SUBSCRIPTIONS', 50, 'CASH', true, true, ARRAY['monthly', 'software'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Cloud Storage', 'Cloud storage services', 'SUBSCRIPTIONS', 20, 'CASH', true, true, ARRAY['monthly', 'software'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Antivirus Software', 'Antivirus and security software', 'SUBSCRIPTIONS', 30, 'CASH', true, true, ARRAY['yearly', 'security'], NOW(), NOW()),
    
    -- Marketing
    (gen_random_uuid(), consultancy_id, 'Facebook Ads', 'Facebook advertising campaigns', 'MARKETING', 100, 'CASH', true, true, ARRAY['marketing', 'social'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Google Ads', 'Google advertising campaigns', 'MARKETING', 150, 'CASH', true, true, ARRAY['marketing', 'digital'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Business Cards', 'Professional business cards', 'MARKETING', 50, 'CASH', true, true, ARRAY['one-time', 'marketing'], NOW(), NOW()),
    
    -- Banking
    (gen_random_uuid(), consultancy_id, 'Bank Transaction Fees', 'Monthly bank service fees', 'BANKING', 10, 'CASH', true, true, ARRAY['monthly', 'banking'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Credit Card Fees', 'Annual credit card fees', 'BANKING', 25, 'CASH', true, true, ARRAY['yearly', 'banking'], NOW(), NOW()),
    
    -- Other
    (gen_random_uuid(), consultancy_id, 'Coffee & Tea', 'Office coffee and tea supplies', 'MISCELLANEOUS', 20, 'CASH', true, true, ARRAY['weekly', 'office'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Team Lunch', 'Team building lunches', 'ENTERTAINMENT', 80, 'CASH', true, true, ARRAY['occasional', 'team'], NOW(), NOW()),
    (gen_random_uuid(), consultancy_id, 'Office Snacks', 'Office snacks and refreshments', 'MISCELLANEOUS', 30, 'CASH', true, true, ARRAY['weekly', 'office'], NOW(), NOW());
    
    RAISE NOTICE 'Successfully created 18 expense templates for consultancy %', consultancy_id;
END $$;
