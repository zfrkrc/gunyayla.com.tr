import { drizzle as pgDrizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const [cmd, ...args] = process.argv.slice(2)
const dbType = cmd === "ghost" ? "mysql" : "pg"

const pgClient = postgres(process.env.DATABASE_URL || "postgresql://authuser:AuTh%239Pq4Xv!7Lm2Kr8@auth_db:5432/authdb")
const pg = pgDrizzle(pgClient)

async function main() {
  if (cmd === "tables" || cmd === "list-tables") {
    if (dbType === "pg") {
      const result = await pgClient.unsafe(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' ORDER BY table_name
      `)
      console.log("PostgreSQL tablolari:")
      result.forEach(r => console.log(`  - ${r.table_name}`))
    }
  }
  else if (cmd === "query") {
    const sql = args.join(" ")
    try {
      const result = await pgClient.unsafe(sql)
      console.log(JSON.stringify(result, null, 2))
    } catch (e) {
      console.error("Hata:", e.message)
    }
  }
  else if (cmd === "users" || cmd === "kullanicilar") {
    const result = await pgClient.unsafe(`SELECT id, name, email, role, created_at FROM "user" ORDER BY created_at DESC`)
    console.log("\nKullanicilar:")
    if (result.length === 0) {
      console.log("  (kayitli kullanici yok)")
    } else {
      result.forEach(u => console.log(`  [${u.role}] ${u.name} <${u.email}> (${u.id})`))
    }
  }
  else if (cmd === "album" || cmd === "albums") {
    const result = await pgClient.unsafe(`SELECT a.id, a.title, a.slug, a.created_at, COUNT(p.id) as photo_count FROM albums a LEFT JOIN photos p ON p.album_id = a.id GROUP BY a.id ORDER BY a.created_at DESC`)
    console.log("\nAlbumler:")
    if (result.length === 0) {
      console.log("  (album yok)")
    } else {
      result.forEach(a => console.log(`  [${a.photo_count} foto] ${a.title} (${a.slug})`))
    }
  }
  else if (cmd === "ghost" && args[0] === "tables") {
    console.log("Ghost MySQL - dogrudan psql kullanmiyorum, bunun icin make db-shell-ghost kullan")
    console.log("Alternatif: docker compose exec ghost_db mysql ...")
  }
  else {
    console.log(`Kullanim: node sql.mjs <komut>`)
    console.log(`Komutlar:`)
    console.log(`  tables         - PostgreSQL tablolarini listele`)
    console.log(`  users/kullanicilar - Kullanicilari goster`)
    console.log(`  albums/album   - Albumleri goster`)
    console.log(`  query <sql>    - SQL sorgusu calistir`)
    console.log(`  ghost query .. - Ghost MySQL sorgusu (icin make db-shell-ghost)`)
  }

  await pgClient.end()
}

main().catch(e => { console.error(e); process.exit(1) })
