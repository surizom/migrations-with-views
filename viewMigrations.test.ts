import { DataType, newDb } from "pg-mem";
import { describe, it, expect } from "vitest";

describe("Proving that we can use views to make migrations backwards-compatible", () => {
  const database = newDb();

  it("initialize user table", () => {
    database.public.declareTable({
      name: "users_old",
      fields: [
        { name: "id", type: DataType.text },
        { name: "name", type: DataType.text },
      ],
    });

    const insertedUsers = database.public.many(`
    INSERT INTO users_old (id, name)
    VALUES ('1', 'Bruce Wayne');

    SELECT * FROM users_old;
    `);

    expect(insertedUsers.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "1", name: "Bruce Wayne" },
    ]);
  });

  describe("rename user table - non forward compatible way ", () => {
    it("should rename table from users_old to users_new", () => {
      database.public.none(`
    ALTER TABLE users_old RENAME TO users_new
    `);
    });

    it("old query should fail", () => {
      expect(() =>
        database.public.many(`
    SELECT * FROM users_old
    `)
      ).toThrowErrorMatchingInlineSnapshot(`
        "relation \\"users_old\\" does not exist

        🐜 This seems to be an execution error, which means that your request syntax seems okay,
            but the resulting statement cannot be executed → Probably not a pg-mem error.

        *️⃣ Failed SQL statement: 
            SELECT * FROM users_old
            ;

        👉 You can file an issue at https://github.com/oguimbal/pg-mem along with a way to reproduce this error (if you can), and  the stacktrace:

        "
      `);
    });

    it("new query should succeed", () => {
      const insertedUsersWithNewQuery = database.public.many(`
    SELECT * FROM users_new
    `);

      expect(
        insertedUsersWithNewQuery.map(({ id, name }) => ({ id, name }))
      ).toEqual([{ id: "1", name: "Bruce Wayne" }]);
    });

    it("cleanup - restore old name", () => {
      database.public.none(`
      ALTER TABLE users_new RENAME TO users_old
      `);
    });
  });

  describe("rename user table with views ", () => {
    it("should create view to host both users_old and users_new query", () => {
      database.public.none(`
    ALTER TABLE users_old RENAME TO users_new
    `);

      database.public.none(`
    CREATE VIEW users_old AS SELECT * FROM users_new`);
    });

    console.log("lol");

    it("old query should still work", () => {
      const insertedUsersWithOldQuery = database.public.many(`
        SELECT * FROM users_old
        `);

      expect(
        insertedUsersWithOldQuery.map(({ id, name }) => ({ id, name }))
      ).toEqual([{ id: "1", name: "Bruce Wayne" }]);
    });

    it("new query should succeed", () => {
      const insertedUsersWithNewQuery = database.public.many(`
    SELECT * FROM users_new
    `);

      expect(
        insertedUsersWithNewQuery.map(({ id, name }) => ({ id, name }))
      ).toEqual([{ id: "1", name: "Bruce Wayne" }]);
    });
  });
});
