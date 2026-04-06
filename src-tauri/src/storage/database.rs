use crate::models::generation::GenerationRecord;
use rusqlite::{Connection, params};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> anyhow::Result<Self> {
        let db_path = app_data_dir.join("workdocgen.db");
        let conn = Connection::open(&db_path)?;

        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA foreign_keys = ON;"
        )?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS generations (
                id          TEXT PRIMARY KEY,
                template_id TEXT NOT NULL,
                provider    TEXT NOT NULL,
                model       TEXT NOT NULL,
                variables   TEXT NOT NULL,
                system_prompt TEXT NOT NULL DEFAULT '',
                user_prompt   TEXT NOT NULL DEFAULT '',
                output      TEXT NOT NULL,
                tokens_used INTEGER DEFAULT 0,
                created_at  TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS custom_templates (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                content     TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_generations_created_at
                ON generations(created_at DESC);"
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn save_generation(&self, record: &GenerationRecord) -> anyhow::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO generations (id, template_id, provider, model, variables,
             system_prompt, user_prompt, output, tokens_used, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                record.id,
                record.template_id,
                record.provider,
                record.model,
                record.variables,
                record.system_prompt,
                record.user_prompt,
                record.output,
                record.tokens_used,
                record.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_generations(
        &self,
        limit: u32,
        offset: u32,
    ) -> anyhow::Result<Vec<GenerationRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, template_id, provider, model, variables,
                    system_prompt, user_prompt, output, tokens_used, created_at
             FROM generations
             ORDER BY created_at DESC
             LIMIT ?1 OFFSET ?2",
        )?;
        let rows = stmt.query_map(params![limit, offset], |row| {
            Ok(GenerationRecord {
                id: row.get(0)?,
                template_id: row.get(1)?,
                provider: row.get(2)?,
                model: row.get(3)?,
                variables: row.get(4)?,
                system_prompt: row.get(5)?,
                user_prompt: row.get(6)?,
                output: row.get(7)?,
                tokens_used: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;

        let mut records = Vec::new();
        for row in rows {
            records.push(row?);
        }
        Ok(records)
    }

    pub fn delete_generation(&self, id: &str) -> anyhow::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM generations WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> anyhow::Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        match rows.next()? {
            Some(row) => Ok(Some(row.get(0)?)),
            None => Ok(None),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> anyhow::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_all_settings(&self) -> anyhow::Result<std::collections::HashMap<String, String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
        let rows = stmt.query_map([], |row| {
            let key: String = row.get(0)?;
            let value: String = row.get(1)?;
            Ok((key, value))
        })?;
        let mut map = std::collections::HashMap::new();
        for row in rows {
            let (k, v) = row?;
            map.insert(k, v);
        }
        Ok(map)
    }
}
