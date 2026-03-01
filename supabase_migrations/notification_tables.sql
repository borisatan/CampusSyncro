-- ============================================
-- Notification System Migration
-- ============================================
-- This migration creates the tables needed for the notification system
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. NotificationMessages Table
-- ============================================
-- Stores user-defined notification message variants
CREATE TABLE IF NOT EXISTS NotificationMessages (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_messages_user_id
  ON NotificationMessages(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_messages_active
  ON NotificationMessages(user_id, is_active);

-- ============================================
-- 2. NotificationLogs Table
-- ============================================
-- Tracks notification history for analytics
CREATE TABLE IF NOT EXISTS NotificationLogs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_message_id INTEGER REFERENCES NotificationMessages(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  sent_time TIMESTAMPTZ DEFAULT NOW(),
  was_dismissed BOOLEAN DEFAULT false,
  had_transaction_today BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id
  ON NotificationLogs(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_time
  ON NotificationLogs(sent_time);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_date
  ON NotificationLogs(user_id, DATE(sent_time));

-- ============================================
-- 3. Update Profiles Table (if needed)
-- ============================================
-- Add daily_notification_frequency column if it doesn't exist
-- Note: The user mentioned they already added this column
-- Uncomment the following if you need to add it:

-- ALTER TABLE Profiles
--   ADD COLUMN IF NOT EXISTS daily_notification_frequency INTEGER DEFAULT 0
--   CHECK (daily_notification_frequency IN (0, 1, 2, 3, 5, 8, 10));

-- ============================================
-- 4. Row Level Security (RLS) Policies
-- ============================================
-- Enable RLS on both tables
ALTER TABLE NotificationMessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE NotificationLogs ENABLE ROW LEVEL SECURITY;

-- NotificationMessages Policies
-- Users can only see their own messages
CREATE POLICY "Users can view their own notification messages"
  ON NotificationMessages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can create their own notification messages"
  ON NotificationMessages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own messages
CREATE POLICY "Users can update their own notification messages"
  ON NotificationMessages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own notification messages"
  ON NotificationMessages
  FOR DELETE
  USING (auth.uid() = user_id);

-- NotificationLogs Policies
-- Users can only see their own logs
CREATE POLICY "Users can view their own notification logs"
  ON NotificationLogs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can create their own notification logs"
  ON NotificationLogs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. Verification Queries
-- ============================================
-- Run these queries after the migration to verify everything is set up correctly

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('NotificationMessages', 'NotificationLogs');

-- Check if indexes exist
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('notificationmessages', 'notificationlogs');

-- Check RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('notificationmessages', 'notificationlogs');
