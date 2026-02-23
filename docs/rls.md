# Row Level Security (RLS) Policies

## disc_found_notifications

```sql
-- 1. Enable RLS on the table
ALTER TABLE disc_found_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Anyone (including anonymous visitors) can insert
CREATE POLICY "Allow public insert"
  ON disc_found_notifications
  FOR INSERT
  WITH CHECK (true);

-- 3. Only authenticated users can read
CREATE POLICY "Allow authenticated select"
  ON disc_found_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Only authenticated users can update (for marking as read)
CREATE POLICY "Allow authenticated update"
  ON disc_found_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Only authenticated users can delete
CREATE POLICY "Allow authenticated delete"
  ON disc_found_notifications
  FOR DELETE
  TO authenticated
  USING (true);
```
