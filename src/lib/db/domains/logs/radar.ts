import { db } from "@/lib/db";
import type { Kysely, Transaction } from "kysely";
import type { Database } from "@/types/db";
import {
  radarValuesFromRow,
  radarValuesToColumns,
  ratchetRadarValues,
  type RadarValues,
} from "@/lib/radar/snapshot";

type Executor = Kysely<Database> | Transaction<Database>;

const RADAR_COLUMNS = [
  "radarNotes",
  "radarChord",
  "radarPeak",
  "radarCharge",
  "radarScratch",
  "radarSoflan",
] as const;

type RadarRow = {
  radarNotes: unknown;
  radarChord: unknown;
  radarPeak: unknown;
  radarCharge: unknown;
  radarScratch: unknown;
  radarSoflan: unknown;
};

/** logs の radar* 列からレーダー値を取り出す。未算出（NULL）なら null */
const toValues = (row: RadarRow | undefined): RadarValues | null =>
  !row || row.radarNotes === null
    ? null
    : radarValuesFromRow({
        notes: row.radarNotes,
        chord: row.radarChord,
        peak: row.radarPeak,
        charge: row.radarCharge,
        scratch: row.radarScratch,
        soflan: row.radarSoflan,
      });

export interface LogRadarSnapshot {
  id: number;
  batchId: string;
  createdAt: Date;
  values: RadarValues;
}

/**
 * ログ（logs）のバッチ時点のレーダー値（ラチェット後）の読み書きを担当するリポジトリクラス。
 * 値はバッチごとに単調非減少のため、ユーザー×バージョンの MAX が最新値と一致する。
 */
class LogRadarRepository {
  /** ユーザー×バージョンのカテゴリ別最高値。履歴（算出済みのバッチ）が無ければ null */
  async getMax(
    userId: string,
    version: string,
    executor: Executor = db,
  ): Promise<RadarValues | null> {
    const row = await executor
      .selectFrom("logs")
      .select((eb) => [
        eb.fn.max("radarNotes").as("radarNotes"),
        eb.fn.max("radarChord").as("radarChord"),
        eb.fn.max("radarPeak").as("radarPeak"),
        eb.fn.max("radarCharge").as("radarCharge"),
        eb.fn.max("radarScratch").as("radarScratch"),
        eb.fn.max("radarSoflan").as("radarSoflan"),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .executeTakeFirst();
    return toValues(row);
  }

  /** バッチのレーダー値を保存する（ラチェット後の値を渡す） */
  async setForBatch(
    userId: string,
    batchId: string,
    values: RadarValues,
    executor: Executor = db,
  ) {
    const c = radarValuesToColumns(values);
    await executor
      .updateTable("logs")
      .set({
        radarNotes: c.notes,
        radarChord: c.chord,
        radarPeak: c.peak,
        radarCharge: c.charge,
        radarScratch: c.scratch,
        radarSoflan: c.soflan,
      })
      .where("userId", "=", userId)
      .where("batchId", "=", batchId)
      .execute();
  }

  /**
   * バックフィル対象のユーザー×バージョンの一覧。
   *
   * @param options.versions - 対象バージョン（省略時は全バージョン）
   * @param options.all - true なら算出済みのみのものも含める（単調性の再点検用）。既定は未算出のバッチを持つものだけ
   */
  async listUserVersionsForBackfill(options: { versions?: string[]; all?: boolean } = {}) {
    const { versions, all = false } = options;
    return await db
      .selectFrom("logs")
      .select(["userId", "version"])
      .$if(!all, (qb) => qb.where("radarNotes", "is", null))
      .$if(!!versions && versions.length > 0, (qb) => qb.where("version", "in", versions!))
      .distinct()
      .orderBy("userId")
      .orderBy("version")
      .execute();
  }

  /** ユーザー×バージョンの全バッチを古い順に取得する（レーダー値は未算出なら null） */
  async listBatches(userId: string, version: string) {
    const rows = await db
      .selectFrom("logs")
      .select(["id", "batchId", ...RADAR_COLUMNS])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .orderBy("id", "asc")
      .execute();
    return rows.map((r) => ({ id: r.id, batchId: r.batchId, values: toValues(r) }));
  }

  private selectSnapshot() {
    return db
      .selectFrom("logs")
      .select(["id", "batchId", "createdAt", ...RADAR_COLUMNS])
      .where("radarNotes", "is not", null);
  }

  private toSnapshot(
    row: ({ id: number; batchId: string; createdAt: Date } & RadarRow) | undefined,
  ): LogRadarSnapshot | null {
    const values = toValues(row);
    return row && values
      ? { id: row.id, batchId: row.batchId, createdAt: row.createdAt, values }
      : null;
  }

  /** 指定バッチ自身のスナップショット */
  async findByBatch(userId: string, batchId: string) {
    const row = await this.selectSnapshot()
      .where("userId", "=", userId)
      .where("batchId", "=", batchId)
      .executeTakeFirst();
    return this.toSnapshot(row);
  }

  /**
   * そのバッチに含まれるスコアのプレイ日時（lastPlayed）の最大値が基準時刻以前（または未満）のバッチについて、
   * 保存済みレーダー値のカテゴリ別最大を返す。プレイ日基準の期間でラチェットの下限を引くのに使う。
   * 該当するバッチ（算出済み）が無ければ null。
   *
   * @param inclusive - true なら基準時刻ちょうどを含める（`<=`）、false なら含めない（`<`）
   */
  async getMaxPlayedBy(
    userId: string,
    version: string,
    cutoff: Date,
    inclusive: boolean,
  ): Promise<RadarValues | null> {
    const rows = await db
      .selectFrom("logs as l")
      .innerJoin("scores as s", "s.batchId", "l.batchId")
      .select(["l.id", ...RADAR_COLUMNS.map((c) => `l.${c}` as const)])
      .where("l.userId", "=", userId)
      .where("l.version", "=", version)
      .where("l.radarNotes", "is not", null)
      .groupBy("l.id")
      .having((eb) => eb.fn.max("s.lastPlayed"), inclusive ? "<=" : "<", cutoff)
      .execute();
    const values = rows
      .map((r) =>
        toValues({
          radarNotes: r.radarNotes,
          radarChord: r.radarChord,
          radarPeak: r.radarPeak,
          radarCharge: r.radarCharge,
          radarScratch: r.radarScratch,
          radarSoflan: r.radarSoflan,
        }),
      )
      .filter((v): v is RadarValues => v !== null);
    if (values.length === 0) return null;
    return values.reduce((acc, v) => ratchetRadarValues(acc, v));
  }

  /** 指定バッチより前（logs.id が小さい）で最新のスナップショット */
  async findLatestBeforeBatch(userId: string, version: string, beforeId: number) {
    const row = await this.selectSnapshot()
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("id", "<", beforeId)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
    return this.toSnapshot(row);
  }

  /**
   * 指定時刻時点で最新のスナップショット。
   *
   * @param inclusive - true なら時刻ちょうどのバッチを含める（`<=`）、false なら含めない（`<`）
   */
  async findLatestAsOf(
    userId: string,
    version: string,
    time: Date,
    inclusive: boolean,
  ) {
    const row = await this.selectSnapshot()
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", inclusive ? "<=" : "<", time)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirst();
    return this.toSnapshot(row);
  }
}

export const logRadarRepo = new LogRadarRepository();
