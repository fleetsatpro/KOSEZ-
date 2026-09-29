import assert from "node:assert/strict";
import test from "node:test";
import { dbSource, getSql, withAuthedSql } from "../db.ts";

/**
 * Integration contract for the guardian-link RLS backstop.
 *
 * The suite is intentionally PGLite-only: it uses the embedded database created
 * by the application test runner and must never seed or mutate a real Neon DB.
 */
const GUARDIAN_A = "rls-test-guardian-a";
const LEARNER_A = "rls-test-learner-a";
const GUARDIAN_B = "rls-test-guardian-b";
const LEARNER_B = "rls-test-learner-b";
const ADMIN = "rls-test-admin";
const BYSTANDER = "rls-test-bystander";

test("guardian-link RLS isolates parties and fails closed without auth context", {
  skip: dbSource !== "pglite",
}, async () => {
  const sql = await getSql();

  // Make the fixture idempotent even after an interrupted test run.
  await sql.query("delete from blossom_guardian_link where guardian_user_id in ($1, $2)", [
    GUARDIAN_A,
    GUARDIAN_B,
  ]);
  await sql.query("delete from blossom_platform_admin where user_id = $1", [ADMIN]);

  try {
    await sql.query(
      "insert into blossom_platform_admin (user_id) values ($1) on conflict (user_id) do update set status = 'active'",
      [ADMIN],
    );

    await withAuthedSql(ADMIN, async (asAdmin) => {
      const roleState = await asAdmin.query<{ current_user: string; user_id: string }>(
        "select current_user, current_setting('app.user_id', true) as user_id",
      );
      assert.equal(roleState[0]?.current_user, "app_runtime");
      assert.equal(roleState[0]?.user_id, ADMIN);

      await asAdmin.query(
        `insert into blossom_guardian_link (guardian_user_id, learner_user_id, status)
         values ($1, $2, 'active'), ($3, $4, 'active')
         on conflict (guardian_user_id, learner_user_id) do nothing`,
        [GUARDIAN_A, LEARNER_A, GUARDIAN_B, LEARNER_B],
      );
    });

    const asGuardianA = await withAuthedSql(GUARDIAN_A, (s) =>
      s.query<{ guardian_user_id: string; learner_user_id: string }>(
        "select guardian_user_id, learner_user_id from blossom_guardian_link where guardian_user_id in ($1, $2)",
        [GUARDIAN_A, GUARDIAN_B],
      ),
    );
    assert.deepEqual(asGuardianA, [
      { guardian_user_id: GUARDIAN_A, learner_user_id: LEARNER_A },
    ]);

    const asGuardianB = await withAuthedSql(GUARDIAN_B, (s) =>
      s.query<{ guardian_user_id: string; learner_user_id: string }>(
        "select guardian_user_id, learner_user_id from blossom_guardian_link where guardian_user_id in ($1, $2)",
        [GUARDIAN_A, GUARDIAN_B],
      ),
    );
    assert.deepEqual(asGuardianB, [
      { guardian_user_id: GUARDIAN_B, learner_user_id: LEARNER_B },
    ]);

    const asBystander = await withAuthedSql(BYSTANDER, (s) =>
      s.query("select 1 from blossom_guardian_link where guardian_user_id in ($1, $2)", [
        GUARDIAN_A,
        GUARDIAN_B,
      ]),
    );
    assert.equal(asBystander.length, 0);

    await assert.rejects(() =>
      withAuthedSql(GUARDIAN_A, (s) =>
        s.query(
          "update blossom_guardian_link set status = 'inactive' where guardian_user_id = $1 and learner_user_id = $2",
          [GUARDIAN_A, LEARNER_A],
        ),
      ),
    );

    await assert.rejects(() =>
      withAuthedSql(GUARDIAN_A, (s) =>
        s.query(
          "delete from blossom_guardian_link where guardian_user_id = $1 and learner_user_id = $2",
          [GUARDIAN_A, LEARNER_A],
        ),
      ),
    );

    // Direct getSql() remains deliberately unscoped. The RLS backstop is only
    // active when a caller opts into the transaction-scoped runtime role.
    const basePathway = await sql.query(
      "select 1 from blossom_guardian_link where guardian_user_id in ($1, $2)",
      [GUARDIAN_A, GUARDIAN_B],
    );
    assert.equal(basePathway.length, 2);

    const roleButNoContext = await withAuthedSql(GUARDIAN_A, async (s) => {
      await s.query("reset app.user_id");
      return s.query(
        "select 1 from blossom_guardian_link where guardian_user_id in ($1, $2)",
        [GUARDIAN_A, GUARDIAN_B],
      );
    });
    assert.equal(roleButNoContext.length, 0);

    const asAdminRead = await withAuthedSql(ADMIN, (s) =>
      s.query("select 1 from blossom_guardian_link where guardian_user_id in ($1, $2)", [
        GUARDIAN_A,
        GUARDIAN_B,
      ]),
    );
    assert.equal(asAdminRead.length, 2);

    await assert.rejects(() =>
      withAuthedSql(GUARDIAN_A, (s) =>
        s.query(
          "insert into blossom_guardian_link (guardian_user_id, learner_user_id, status) values ($1, $2, 'active')",
          [GUARDIAN_A, "rls-test-learner-rogue"],
        ),
      ),
    );
  } finally {
    await withAuthedSql(ADMIN, (s) =>
      s.query("delete from blossom_guardian_link where guardian_user_id in ($1, $2)", [
        GUARDIAN_A,
        GUARDIAN_B,
      ]),
    );
    await sql.query("delete from blossom_platform_admin where user_id = $1", [ADMIN]);
  }
});
