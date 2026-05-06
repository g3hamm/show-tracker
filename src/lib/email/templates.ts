const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chillflix.app";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Chillflix</title>
</head>
<body style="margin:0;padding:0;background:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#C01900;border-radius:8px 8px 0 0;padding:24px 32px;">
              <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">Chillflix</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#1a1a1a;border-radius:0 0 8px 8px;padding:32px;color:#e5e5e5;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 0;text-align:center;">
              <span style="font-size:11px;color:#555555;">Chillflix · <a href="${BASE_URL}" style="color:#555555;text-decoration:none;">${BASE_URL.replace(/https?:\/\//, "")}</a></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function newRecommendationEmail(opts: {
  recommenderName: string;
  title: string;
  mediaType: string;
  note: string | null;
  overview: string | null;
}): { subject: string; html: string } {
  const label = opts.mediaType === "movie" ? "movie" : "show";
  const subject = `${opts.recommenderName} recommended "${opts.title}" on Chillflix`;

  const html = layout(`
    <p style="margin:0 0 8px;font-size:13px;color:#999;">New recommendation</p>
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#ffffff;">${opts.title}</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#aaaaaa;">
      ${label === "movie" ? "🎬" : "📺"} ${label.charAt(0).toUpperCase() + label.slice(1)} &nbsp;·&nbsp; recommended by <strong style="color:#e5e5e5;">${opts.recommenderName}</strong>
    </p>

    ${opts.note ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#111111;border-left:3px solid #C01900;padding:12px 16px;border-radius:0 4px 4px 0;">
          <p style="margin:0;font-size:14px;color:#cccccc;font-style:italic;">&ldquo;${opts.note}&rdquo;</p>
        </td>
      </tr>
    </table>` : ""}

    ${opts.overview ? `
    <p style="margin:0 0 20px;font-size:13px;color:#888888;line-height:1.6;">${opts.overview}</p>` : ""}

    <a href="${BASE_URL}" style="display:inline-block;background:#C01900;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px;">
      View on Chillflix →
    </a>
  `);

  return { subject, html };
}

export function watchedItEmail(opts: {
  recommenderName: string;
  title: string;
  mediaType: string;
}): { subject: string; html: string } {
  const label = opts.mediaType === "movie" ? "movie" : "show";
  const subject = `We watched "${opts.title}"!`;

  const html = layout(`
    <p style="margin:0 0 8px;font-size:13px;color:#999;">You recommended it, we watched it.</p>
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#ffffff;">${opts.title}</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#aaaaaa;">
      ${label === "movie" ? "🎬" : "📺"} ${label.charAt(0).toUpperCase() + label.slice(1)}
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#cccccc;line-height:1.6;">
      Hey ${opts.recommenderName}! We finished <strong style="color:#ffffff;">${opts.title}</strong> — thanks for the recommendation.
      If you have more suggestions, head over to our page and drop them in.
    </p>

    <a href="${BASE_URL}/recommend" style="display:inline-block;background:#C01900;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px;">
      Recommend another →
    </a>
  `);

  return { subject, html };
}
