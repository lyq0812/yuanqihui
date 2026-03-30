const { Pool } = require('pg');

// 数据库连接配置（已填好你的正确信息）
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_KtoMbvNPh59U@ep-lingering-fire-a1vgis35-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

// 查询并打印所有表数据
async function showAllTables() {
  try {
    console.log("✅ 数据库连接成功！\n");

    // 查询 users 表
    const users = await pool.query('SELECT * FROM "users"');
    console.log("👥 users 表（用户数据）：");
    console.log(users.rows);

    // 查询 properties 表
    const properties = await pool.query('SELECT * FROM "properties"');
    console.log("\n🏭 properties 表（厂房数据）：");
    console.log(properties.rows);

    // 查询 requests 表
    const requests = await pool.query('SELECT * FROM "requests"');
    console.log("\n📩 requests 表（求租数据）：");
    console.log(requests.rows);

  } catch (err) {
    console.error("❌ 执行出错：", err);
  } finally {
    await pool.end(); // 关闭连接
  }
}

// 执行主函数
showAllTables();