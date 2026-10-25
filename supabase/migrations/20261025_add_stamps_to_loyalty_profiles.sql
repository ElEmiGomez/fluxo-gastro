-- Migration: 20261025_add_stamps_to_loyalty_profiles.sql
-- Invariante de Arquitectura: Soporte nativo para cartilla digital de sellos en PostgreSQL SSOT

ALTER TABLE loyalty_profiles
ADD COLUMN IF NOT EXISTS stamps_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stamps_target INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS unlocked_rewards_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_stamps_earned INTEGER DEFAULT 0;
