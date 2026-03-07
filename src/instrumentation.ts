export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setupArenaService } = await import("@/lib/cron/metrics/job");
    setupArenaService();
  }
}
