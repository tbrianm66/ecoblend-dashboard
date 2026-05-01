import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  console.log("=== PLAYBOOK LIBRARY TABLE ===");
  const [cols] = await conn.query('DESCRIBE playbook_library');
  console.log('Columns:', cols.map(c => c.Field).join(', '));

  const [rows] = await conn.query('SELECT id, title, category, status, version, accessLevel, LENGTH(stepByStepGuidance) as content_len FROM playbook_library ORDER BY id');
  console.log(`Total playbooks: ${rows.length}`);
  rows.forEach(r => {
    console.log(`  [${r.id}] ${r.title} | cat=${r.category} | status=${r.status} | v=${r.version} | access=${r.accessLevel} | content_len=${r.content_len || 0}`);
  });

  console.log("\n=== CONTEXT RULES TABLE ===");
  const [rcols] = await conn.query('DESCRIBE playbook_context_rules');
  console.log('Columns:', rcols.map(c => c.Field).join(', '));

  const [rules] = await conn.query('SELECT * FROM playbook_context_rules ORDER BY id');
  console.log(`Total rules: ${rules.length}`);
  rules.forEach(r => {
    console.log(`  [${r.id}] name=${r.rule_name} | playbook=${r.playbook_id} | module=${r.module} | stage=${r.workflow_stage} | priority=${r.priority} | active=${r.active}`);
  });

  console.log("\n=== ADMIN SIDEBAR CHECK ===");
  // Check what admin routes exist
  const [adminPages] = await conn.query("SELECT 'playbook_library' as tbl, COUNT(*) as cnt FROM playbook_library UNION ALL SELECT 'playbook_context_rules', COUNT(*) FROM playbook_context_rules UNION ALL SELECT 'playbook_widget_configs', COUNT(*) FROM playbook_widget_configs");
  adminPages.forEach(r => console.log(`  ${r.tbl}: ${r.cnt} rows`));

  await conn.end();
}

run().catch(console.error);
