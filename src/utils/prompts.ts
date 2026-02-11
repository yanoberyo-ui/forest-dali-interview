/**
 * AI評価レポート生成用プロンプト
 * 面接完了時にClaude APIで候補者のパーソナリティ評価を生成するために使用
 */
export const ASSESSMENT_PROMPT = `
以下はAI面接での候補者との会話です。この会話を分析し、候補者のパーソナリティ評価を行ってください。

以下のJSON形式で回答してください（日本語で）:
{
  "summary": "候補者のパーソナリティの総合的な概要（200-300文字）",
  "traits": {
    "values": { "score": 1-5, "comment": "価値観に関する所見" },
    "teamwork": { "score": 1-5, "comment": "チームワークに関する所見" },
    "problemSolving": { "score": 1-5, "comment": "問題解決力に関する所見" },
    "communication": { "score": 1-5, "comment": "コミュニケーションに関する所見" },
    "stressHandling": { "score": 1-5, "comment": "ストレス対処に関する所見" },
    "creativity": { "score": 1-5, "comment": "創造性に関する所見" },
    "growth": { "score": 1-5, "comment": "成長意欲に関する所見" }
  }
}

スコアの基準:
1 = あまり見られない
2 = やや見られる
3 = 普通
4 = よく見られる
5 = 非常に優れている

JSONのみを出力してください。
`;
