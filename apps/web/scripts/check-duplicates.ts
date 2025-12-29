import { db } from "../lib/db";
import { places } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function checkDuplicates() {
  const result = await db.execute(sql`
    SELECT foursquare_id, COUNT(*) as count, array_agg(id) as ids
    FROM places 
    WHERE foursquare_id IS NOT NULL 
    GROUP BY foursquare_id 
    HAVING COUNT(*) > 1
  `);

  console.log("Duplicate Groups:", result.rows.length);
  result.rows.forEach((row: any) => {
    console.log(`FSQ ID: ${row.foursquare_id}, Count: ${row.count}, IDs: ${row.ids}`);
  });

  process.exit(0);
}

checkDuplicates();
