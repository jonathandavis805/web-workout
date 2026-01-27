#!/usr/bin/env python3
"""
Database migration script to add user authentication and update workout models.
Run this script to migrate existing data to the new user-based system.
"""

import os
import sqlite3
from datetime import datetime


def migrate_database():
    db_path = os.path.join(os.path.dirname(__file__), "workouts.db")

    if not os.path.exists(db_path):
        print("No existing database found. A new one will be created.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if user table already exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='user'"
        )
        user_table_exists = cursor.fetchone()

        if not user_table_exists:
            print("Creating user table...")
            cursor.execute("""
                CREATE TABLE user (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    oauth_provider VARCHAR(50) NOT NULL,
                    oauth_id VARCHAR(100) NOT NULL
                )
            """)

            # Create a default user for existing workouts
            print("Creating default user for existing workouts...")
            cursor.execute("""
                INSERT INTO user (email, name, oauth_provider, oauth_id)
                VALUES ('default@example.com', 'Default User', 'migration', 'default-user')
            """)
            default_user_id = cursor.lastrowid

            # Add user_id column to workout table
            print("Adding user_id to workout table...")
            cursor.execute(
                "ALTER TABLE workout ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"
            )

            # Update existing workouts to belong to default user
            cursor.execute(
                "UPDATE workout SET user_id = ? WHERE user_id = 1", (default_user_id,)
            )

            print("Migration completed successfully!")
        else:
            print("User table already exists. Skipping migration.")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_database()
