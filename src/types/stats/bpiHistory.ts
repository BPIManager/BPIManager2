/** 更新された1楽曲分の新旧スコア比較 */
export interface BpiHistoryUpdatedSong {
  /** 楽曲タイトル（難易度サフィックス付き、例: "冥[A]"） */
  title: string;
  /** 更新前のEXスコア（初回プレイの場合は `null`） */
  prevExScore: number | null;
  /** 更新後のEXスコア */
  newExScore: number;
  /** 更新前のBPI（初回プレイの場合は `null`） */
  prevBpi: number | null;
  /** 更新後のBPI */
  newBpi: number;
  /** この楽曲を反映した直後の合計BPI(ラチェット適用前の推定値)。直近一定件数のみ計算のため対象外なら`undefined` */
  rawTotalBpiAfter?: number;
  /** 直前の1件からの合計BPI(推定値)の変化量。直前の比較対象が無ければ`null` */
  rawTotalBpiDelta?: number | null;
  /** この楽曲を反映した直後の合計BPI(ラチェット適用後の表示値)。rawTotalBpiAfterと同様、対象外なら`undefined` */
  totalBpiAfter?: number;
  /** 直前の1件からの合計BPI(表示値)の変化量。rawTotalBpiDeltaと同様の理由で`null`になりうる */
  totalBpiDelta?: number | null;
  /** この楽曲を反映した直後の潜在スキルa（ベイズ縮小推定後、z尺度）。有効な観測が無ければ`null`、対象外なら`undefined` */
  latentSkillAfter?: number | null;
  /** 直前の1件からの潜在スキルaの変化量。rawTotalBpiDeltaと同様の理由で`null`になりうる */
  latentSkillDelta?: number | null;
}

/** 合計 BPI 履歴の1日分 */
export interface BpiHistoryItem {
  /** 日付（ISO 8601 形式） */
  date: string;
  /** 該当日の合計 BPI（ラチェット適用後、既存最高値を下回らない表示値） */
  totalBpi: number;
  /** 該当日時点で実際に計算した合計 BPI（ラチェット適用前の生の推定値） */
  rawTotalBpi: number;
  /** 該当日時点の潜在スキルa（ベイズ縮小推定後、z尺度）。有効な観測が無ければ`null` */
  latentSkill: number | null;
  /** 更新楽曲数 */
  count: number;
  /** 更新された楽曲の新旧スコア比較一覧 */
  updatedSongs: BpiHistoryUpdatedSong[];
}
