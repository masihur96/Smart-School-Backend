import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
});

async function run() {
  await dataSource.initialize();
  
  const sql = `
      SELECT
        a.classId                                   AS classId,
        c.name                                       AS className,
        u.sectionId                                  AS sectionId,
        s.name                                       AS sectionName,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS totalPresent,
        SUM(CASE WHEN a.status = 'absent'  THEN 1 ELSE 0 END) AS totalAbsent,
        SUM(CASE WHEN a.status = 'leave'   THEN 1 ELSE 0 END) AS totalLeave,
        COUNT(a.id)                                  AS totalRecords
      FROM attendance a
      LEFT JOIN user   u ON u.id = a.studentId
      LEFT JOIN class  c ON c.id = a.classId
      LEFT JOIN sections s ON s.id = u.sectionId
      WHERE strftime('%Y', a.date) = ?
        AND strftime('%m', a.date) = ?
      GROUP BY a.classId, u.sectionId
    `;

  try {
    const res = await dataSource.query(sql, ['2026', '03']);
    console.log("Success:", res);
  } catch (err) {
    console.error("SQL Error:", err.message);
  }
  
  await dataSource.destroy();
}

run();
