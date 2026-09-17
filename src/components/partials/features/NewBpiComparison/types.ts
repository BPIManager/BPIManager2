import type { CurvePoint } from "./CurveChart";
import type { FormulaSongInfo } from "./FormulaCard";
import type { ScoreSimulatorSongInfo } from "./ScoreSimulatorCard";
import type { ScoreRateRow } from "./ScoreRateTable";
import type { SongParamsInfo } from "./SongParamsPanel";

export type SortKey =
  | "deltaDesc"
  | "deltaAsc"
  | "level"
  | "currentBpiDesc"
  | "newBpiDesc";
export type AccessState = "loading" | "not-found" | "private" | "ok";

export interface NewBpiRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  exScore: number;
  currentBpi: number | null;
  newBpi: number | null;
  delta: number | null;
  /** 新方式の単曲BPIから引いた推定順位（現行の順位式）。 */
  estimatedRank: number | null;
  /** BPIM内での本人の実際の順位（songRankingCache）。 */
  actualRank: number | null;
  actualTotalPlayers: number | null;
  /** ノーツレーダーのカテゴリ（topElements.json による分類。未分類は null）。 */
  radarTop: string | null;
  /** BPM 表示用の生文字列。 */
  bpm: string | null;
  /** BPM 範囲の下端・上端（フィルタ用。パース不可なら null）。 */
  bpmLo: number | null;
  bpmHi: number | null;
}

export interface UserPoint {
  exScore: number;
  currentBpi: number | null;
  newBpi: number | null;
}

export interface Props {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  onSelectUser: (userId: string) => void;
  isViewingSelf: boolean;
  viewedUserName: string | null;
  accessState: AccessState;
  isDataLoading: boolean;

  rows: NewBpiRow[];
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  /** 既存のノーツレーダーと同じカテゴリ分けによる、現行/新方式のカテゴリ別総合BPI。 */
  radarCurrent: Record<string, number> | null;
  radarNew: Record<string, number> | null;
  currentTotalBpi: number | null;
  newTotalBpi: number | null;
  comparableCount: number;
  curveEligibleRows: NewBpiRow[];
  selectedSongId: number | null;
  onSelectedSongIdChange: (songId: number) => void;
  /** 「一覧」タブで現在アコーディオン展開している行（null = 未展開）。 */
  listExpandedSongId: number | null;
  onToggleListSong: (songId: number) => void;
  selectedSongParams: SongParamsInfo | null;
  curveData: CurvePoint[] | null;
  scoreRateRows: ScoreRateRow[] | null;
  scoreRateMaxScore: number | null;
  selectedSongUserPoint: UserPoint | null;
  selectedSongFormula: FormulaSongInfo | null;
  selectedSongSimulator: ScoreSimulatorSongInfo | null;
  selectedSongInitialScore: number;
}
