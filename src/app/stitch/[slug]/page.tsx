import { notFound } from "next/navigation";
import path from "path";
import { readFileSync } from "fs";

const stitchSlugMap: Record<string, string> = {
  "ai-summary-processing": "ai_summary_processing",
  "billing-usage-management": "billing_&_usage_management",
  "client-update-email-template": "client_update_email_template",
  "create-new-update": "create_new_update",
  "create-your-account": "create_your_account",
  "login-to-subbie-updates": "login_to_subbie_updates",
  "plan-limit-reached-upgrade": "plan_limit_reached_upgrade",
  "project-settings-recipients": "project_settings_&_recipients",
  "public-client-update-page": "public_client_update_page",
  "recipient-limit-upgrade-prompt": "recipient_limit_upgrade_prompt",
  "review-edit-summary": "review_&_edit_summary",
  "subscription-plans-selection": "subscription_plans_selection",
  "tradie-dashboard": "tradie_dashboard",
  "update-sent-success": "update_sent_success",
};

export default function StitchPage({ params }: { params: { slug: string } }) {
  const folder = stitchSlugMap[params.slug];
  if (!folder) return notFound();

  const htmlPath = path.join(process.cwd(), "stitch-export", folder, "code.html");
  let html = "";
  try {
    html = readFileSync(htmlPath, "utf8");
  } catch {
    return notFound();
  }

  return (
    <div className="w-full h-screen bg-black">
      <iframe
        title={params.slug}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        srcDoc={html}
      />
    </div>
  );
}
