DROP INDEX IF EXISTS "ReaderProfile_cohort_idx";

ALTER TABLE IF EXISTS "ReaderProfile"
  DROP COLUMN IF EXISTS "cohort",
  DROP COLUMN IF EXISTS "canViewSeven";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ReaderCohort'
  ) THEN
    DROP TYPE "ReaderCohort";
  END IF;
END
$$;
