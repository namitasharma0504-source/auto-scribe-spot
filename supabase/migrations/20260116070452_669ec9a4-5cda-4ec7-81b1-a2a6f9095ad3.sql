ALTER TABLE garage_owners 
ADD COLUMN subscription_end_date date NULL;

COMMENT ON COLUMN garage_owners.subscription_end_date IS 'End date of the 1-year subscription period';