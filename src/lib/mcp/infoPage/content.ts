

export type ToolDoc = {
  name: string;
  desc: string;
};

export const TOOLS: ToolDoc[] = [
  {
    name: "get_my_scores",
    desc: "自分のスコア一覧を取得(バージョン・クリア状況・BPI範囲・BPM範囲・notes数範囲・ソフラン曲・タイトル検索・日付指定・並び替え等で絞り込み可能)",
  },
  {
    name: "search_users",
    desc: "ユーザー名・IIDX ID・アリーナクラスでユーザーを検索(公開プロフィールのみ)",
  },
  { name: "get_my_follows", desc: "自分のフォロー中ユーザー一覧を取得" },
  {
    name: "get_user_scores",
    desc: "指定ユーザー(自分または公開プロフィールのユーザー)のスコア一覧を取得",
  },
  {
    name: "search_songs",
    desc: "楽曲マスタをタイトル・難易度・難易度レベルで検索し、songIdを取得",
  },
  {
    name: "update_my_score",
    desc: "自分のスコア・クリアランプを更新(自己ベストを上回る場合のみ反映)",
  },
  {
    name: "get_my_dashboard",
    desc: "スコア一覧を取得せずに、総合BPI・日別推移・単日BPI・得意曲/苦手曲/ライバル僅差曲TOP Nをまとめて取得",
  },
  {
    name: "get_song_rivals",
    desc: "特定の1曲について、自分とフォロー中ライバル全員の現在のスコアを一覧取得",
  },
];

export type Example = { q: string; a: string };

export const EXAMPLES: Example[] = [
  {
    q: "今のプレイデータから、AAA埋めまであと僅かな☆12を教えて",
    a: "get_my_scores を絞り込みなしに近い形で呼び出し、スコア率が近い曲を分析",
  },
  {
    q: "自分と○○さんの☆12レジェンダリア譜面のスコアを比較して",
    a: "search_users で相手を検索し、get_user_scores で互いのスコアを取得して比較",
  },
  {
    q: "IIDXID 1234-5678の人と自分のスコアを比較して",
    a: "search_users にIIDX IDを指定してユーザーを特定し、get_my_scores と get_user_scores で双方のスコアを取得して比較",
  },
  {
    q: "フォロー中の人で自分より総合BPIが高い人は? どの曲なら勝てそうですか。",
    a: "get_my_follows でフォロー一覧を取得し、各ユーザーのスコアと比較",
  },
  {
    q: "新曲『○○』の[A]をEXスコア1234、クリアランプHARD CLEARでスコア更新して",
    a: "search_songs で songId を検索し、update_my_score で更新(既存の自己ベストを上回らない場合は更新されない)",
  },
  {
    q: "リザルト画面のスクリーンショットを貼り付けて「このスコアで更新して」",
    a: "LLMが画像から曲名・難易度・EXスコア・クリアランプ・ミスカウントをOCRで読み取り、search_songs で songId を特定した上で update_my_score を呼び出す、という一連の流れをLLM側が自動で行う(BPIManager2側にOCR機能はなく、画像解釈はLLMクライアントの機能に依存する)",
  },
  {
    q: "今日はどの曲を伸ばせばいい？ライバルに追いつかれそうな曲もあれば教えて",
    a: "get_my_dashboard を呼び出し、苦手曲とライバル僅差曲を提示",
  },
  {
    q: "『○○』[A]で自分は○○さんに勝ってる？",
    a: "search_songs で songId を検索し、get_song_rivals で自分とライバルのスコアを比較",
  },
];
