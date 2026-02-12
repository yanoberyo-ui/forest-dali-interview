interface SlackNotificationParams {
  candidateName: string;
  candidateEmail: string;
  interviewType: string;
  interviewId: string;
  completedAt: Date;
}

export async function sendSlackNotification(params: SlackNotificationParams): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  if (!token || !channel) {
    console.log("[Slack] SLACK_BOT_TOKEN or SLACK_CHANNEL_ID not set, skipping notification");
    return;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const detailUrl = `https://forest-dali-interview.onrender.com/admin/dashboard`;
  const completedTime = params.completedAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const text = [
    `:white_check_mark: *面接が完了しました*`,
    ``,
    `*候補者:* ${params.candidateName} (${params.candidateEmail})`,
    `*面接タイプ:* ${params.interviewType}`,
    `*完了日時:* ${completedTime}`,
    ``,
    `<${detailUrl}|:mag: 面接詳細を確認する>`,
  ].join("\n");

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text,
        mrkdwn: true,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("[Slack] API error:", data.error);
    } else {
      console.log("[Slack] Notification sent successfully");
    }
  } catch (error) {
    console.error("[Slack] Failed to send notification:", error);
    // Don't throw - Slack notification failure should not break interview completion
  }
}
