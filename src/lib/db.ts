import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'panel.db');
const db = new Database(dbPath);

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 安全: 不创建默认账号，首个注册用户自动成为管理员

export default db;

export function findUserByUsername(username: string) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function createUser(username: string, password: string, role: string = 'user') {
  const hash = bcrypt.hashSync(password, 10);
  return db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
}

export function getUserCount(): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  return result.count;
}
