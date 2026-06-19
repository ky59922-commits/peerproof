// Bilingual (English + Japanese) email templates for PeerProof.
// Each function returns { subject, html }.
//
// Layout convention: English block first, a divider, then Japanese block —
// so every recipient gets both regardless of which they read.

const BRAND = "#2a9d8f";
const INK = "#1a2b4a";
const MUTED = "#6b7280";

function layout(innerHtml) {
  return `
  <div style="background:#f1f5f9;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:${INK};padding:24px 32px;">
        <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">PeerProof</span>
        <span style="color:${BRAND};font-size:22px;font-weight:800;">Δ</span>
      </div>
      <div style="padding:32px;">
        ${innerHtml}
      </div>
      <div style="padding:20px 32px;border-top:1px solid #e2e8f0;color:${MUTED};font-size:12px;line-height:1.6;">
        PeerProof — Academic peer verification<br/>
        This is an automated message. Please do not reply directly.<br/>
        これは自動送信メールです。このメールには返信しないでください。
      </div>
    </div>
  </div>`;
}

function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">${label}</a>`;
}

function codeBox(code) {
  return `<div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:16px;text-align:center;margin:18px 0;">
    <span style="font-size:26px;font-weight:800;letter-spacing:0.12em;color:${INK};font-family:monospace;">${code}</span>
  </div>`;
}

function divider() {
  return `<div style="border-top:1px solid #e2e8f0;margin:24px 0;"></div>`;
}

function h(text) {
  return `<h1 style="font-size:20px;font-weight:800;color:${INK};margin:0 0 16px;">${text}</h1>`;
}
function p(text) {
  return `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 14px;">${text}</p>`;
}

// ---------- 1. Company application received ----------
export function companyApplicationReceived({ contactName, companyName }) {
  return {
    subject: "PeerProof — Application received / お申し込みを受け付けました",
    html: layout(`
      ${h("Application received")}
      ${p(`Hi ${contactName || "there"},`)}
      ${p(`Thank you for applying to PeerProof on behalf of <strong>${companyName || "your company"}</strong>. We've received your application and our team will review it shortly. You'll hear from us by email with next steps.`)}
      ${divider()}
      ${h("お申し込みを受け付けました")}
      ${p(`${contactName || "ご担当者"}様`)}
      ${p(`<strong>${companyName || "貴社"}</strong>を代表してPeerProofにお申し込みいただき、ありがとうございます。お申し込みを受け付けました。担当者が内容を確認のうえ、次のステップについてメールでご連絡いたします。`)}
    `),
  };
}

// ---------- 2. Company application approved (join code) ----------
export function companyApproved({ contactName, companyName, joinCode, signupUrl }) {
  return {
    subject: "PeerProof — Application approved / お申し込みが承認されました",
    html: layout(`
      ${h("Your application is approved")}
      ${p(`Hi ${contactName || "there"},`)}
      ${p(`<strong>${companyName || "Your company"}</strong> has been approved on PeerProof. Use the join code below to create your account:`)}
      ${codeBox(joinCode)}
      ${p(signupUrl ? `Sign up here: ${btn(signupUrl, "Create your account")}` : "")}
      ${divider()}
      ${h("お申し込みが承認されました")}
      ${p(`${contactName || "ご担当者"}様`)}
      ${p(`<strong>${companyName || "貴社"}</strong>のPeerProofへのご登録が承認されました。下記のジョインコードを使用してアカウントを作成してください。`)}
      ${codeBox(joinCode)}
      ${p(signupUrl ? `こちらから登録: ${btn(signupUrl, "アカウントを作成")}` : "")}
    `),
  };
}

// ---------- 3. Company application rejected ----------
export function companyRejected({ contactName, companyName }) {
  return {
    subject: "PeerProof — Application update / お申し込みについて",
    html: layout(`
      ${h("Application update")}
      ${p(`Hi ${contactName || "there"},`)}
      ${p(`Thank you for your interest in PeerProof. After reviewing your application for <strong>${companyName || "your company"}</strong>, we're unable to approve it at this time. If you believe this was in error or your situation changes, you're welcome to reach out.`)}
      ${divider()}
      ${h("お申し込みについて")}
      ${p(`${contactName || "ご担当者"}様`)}
      ${p(`PeerProofにご関心をお寄せいただきありがとうございます。<strong>${companyName || "貴社"}</strong>のお申し込みを審査いたしましたが、今回は承認を見送らせていただくこととなりました。状況が変わった場合は、改めてお問い合わせください。`)}
    `),
  };
}

// ---------- 4. Judge application received ----------
export function judgeApplicationReceived({ name }) {
  return {
    subject: "PeerProof — Application received / お申し込みを受け付けました",
    html: layout(`
      ${h("Application received")}
      ${p(`Hi ${name || "there"},`)}
      ${p(`Thank you for applying to be a PeerProof judge. We've received your application and will review it shortly. You'll hear from us by email with next steps.`)}
      ${divider()}
      ${h("お申し込みを受け付けました")}
      ${p(`${name || "ご応募者"}様`)}
      ${p(`PeerProofの審査員にご応募いただきありがとうございます。お申し込みを受け付けました。内容を確認のうえ、次のステップについてメールでご連絡いたします。`)}
    `),
  };
}

// ---------- 5. Judge application approved (signup code) ----------
export function judgeApproved({ name, signupCode, signupUrl }) {
  return {
    subject: "PeerProof — You're approved / 審査員として承認されました",
    html: layout(`
      ${h("You're approved as a judge")}
      ${p(`Hi ${name || "there"},`)}
      ${p(`Congratulations — your application to be a PeerProof judge has been approved. Use the signup code below to create your account:`)}
      ${codeBox(signupCode)}
      ${p(signupUrl ? `Sign up here: ${btn(signupUrl, "Create your account")}` : "")}
      ${divider()}
      ${h("審査員として承認されました")}
      ${p(`${name || "ご応募者"}様`)}
      ${p(`おめでとうございます。PeerProofの審査員としてのご応募が承認されました。下記のサインアップコードを使用してアカウントを作成してください。`)}
      ${codeBox(signupCode)}
      ${p(signupUrl ? `こちらから登録: ${btn(signupUrl, "アカウントを作成")}` : "")}
    `),
  };
}

// ---------- 6. Judge application rejected ----------
export function judgeRejected({ name }) {
  return {
    subject: "PeerProof — Application update / お申し込みについて",
    html: layout(`
      ${h("Application update")}
      ${p(`Hi ${name || "there"},`)}
      ${p(`Thank you for your interest in becoming a PeerProof judge. After reviewing your application, we're unable to approve it at this time. We appreciate the time you took to apply, and you're welcome to reach out if your situation changes.`)}
      ${divider()}
      ${h("お申し込みについて")}
      ${p(`${name || "ご応募者"}様`)}
      ${p(`PeerProofの審査員にご関心をお寄せいただきありがとうございます。ご応募内容を審査いたしましたが、今回は承認を見送らせていただくこととなりました。ご応募いただいたお時間に感謝申し上げます。状況が変わった場合は、改めてお問い合わせください。`)}
    `),
  };
}

// ---------- 7 & 11. Candidate meeting link (round 1 or second opinion) ----------
export function candidateMeetingLink({ candidateName, meetingUrl, scheduledAt, isSecondOpinion }) {
  const timeStr = scheduledAt ? new Date(scheduledAt).toLocaleString() : "the scheduled time";
  return {
    subject: isSecondOpinion
      ? "PeerProof — Your second verification session / 2回目の認証セッションのご案内"
      : "PeerProof — Your verification session / 認証セッションのご案内",
    html: layout(`
      ${h(isSecondOpinion ? "Your second verification session" : "Your verification session is scheduled")}
      ${p(`Hi ${candidateName || "there"},`)}
      ${p(`A company has requested an academic peer verification session with you${isSecondOpinion ? " (a second review with a different reviewer)" : ""}. Your session is scheduled for:`)}
      ${p(`<strong>${timeStr}</strong>`)}
      ${p(`Join using your personal link at the scheduled time:`)}
      ${p(btn(meetingUrl, "Join your session"))}
      ${p(`The session takes 20–30 minutes. Your interviewer is an anonymous academic peer. The session is recorded and shared only with the requesting company and PeerProof staff.`)}
      ${divider()}
      ${h(isSecondOpinion ? "2回目の認証セッションのご案内" : "認証セッションのご案内")}
      ${p(`${candidateName || "ご応募者"}様`)}
      ${p(`企業からあなたとの学術ピア認証セッションのご依頼がありました${isSecondOpinion ? "（別の審査員による2回目の確認です）" : ""}。セッションの予定日時は以下のとおりです。`)}
      ${p(`<strong>${timeStr}</strong>`)}
      ${p(`予定時刻になりましたら、下記の専用リンクからご参加ください。`)}
      ${p(btn(meetingUrl, "セッションに参加"))}
      ${p(`セッションは20〜30分程度です。審査員は匿名の学術ピアです。セッションは録音され、依頼元の企業とPeerProofのスタッフのみに共有されます。`)}
    `),
  };
}

// ---------- 8. Judge session confirmation ----------
export function judgeSessionConfirmation({ judgeName, scheduledAt, candidateField, candidateDegree, meetingUrl }) {
  const timeStr = scheduledAt ? new Date(scheduledAt).toLocaleString() : "the scheduled time";
  return {
    subject: "PeerProof — Session confirmed / セッションが確定しました",
    html: layout(`
      ${h("Your session is confirmed")}
      ${p(`Hi ${judgeName || "there"},`)}
      ${p(`You've accepted a verification session. Details:`)}
      ${p(`<strong>Time:</strong> ${timeStr}<br/><strong>Candidate field:</strong> ${candidateField || "—"}<br/><strong>Claimed level:</strong> ${candidateDegree || "—"}`)}
      ${meetingUrl ? p(`Join from your dashboard, or here at the scheduled time: ${btn(meetingUrl, "Join session")}`) : ""}
      ${p(`As a reminder, you can hold only one active session at a time. New requests appear in your queue once this one is scored.`)}
      ${divider()}
      ${h("セッションが確定しました")}
      ${p(`${judgeName || "審査員"}様`)}
      ${p(`認証セッションをお引き受けいただきました。詳細は以下のとおりです。`)}
      ${p(`<strong>日時:</strong> ${timeStr}<br/><strong>候補者の分野:</strong> ${candidateField || "—"}<br/><strong>申告された学位:</strong> ${candidateDegree || "—"}`)}
      ${meetingUrl ? p(`ダッシュボード、または予定時刻に下記からご参加ください: ${btn(meetingUrl, "セッションに参加")}`) : ""}
      ${p(`なお、同時に進行できるセッションは1件のみです。採点が完了すると、新しい依頼がキューに表示されます。`)}
    `),
  };
}

// ---------- 9. HR match notification ----------
export function hrMatchNotification({ candidateName, scheduledAt }) {
  const timeStr = scheduledAt ? new Date(scheduledAt).toLocaleString() : "the scheduled time";
  return {
    subject: "PeerProof — A judge accepted / 審査員が決定しました",
    html: layout(`
      ${h("A judge has been matched")}
      ${p(`A verified judge has accepted the assessment for <strong>${candidateName || "your candidate"}</strong>. The session is scheduled for:`)}
      ${p(`<strong>${timeStr}</strong>`)}
      ${p(`Please make sure your candidate has received their meeting link. You can copy it any time from your dashboard.`)}
      ${divider()}
      ${h("審査員が決定しました")}
      ${p(`<strong>${candidateName || "候補者"}</strong>様の認証を、認定審査員がお引き受けしました。セッションの予定日時は以下のとおりです。`)}
      ${p(`<strong>${timeStr}</strong>`)}
      ${p(`候補者の方がミーティングリンクを受け取っているかご確認ください。リンクはダッシュボードからいつでもコピーできます。`)}
    `),
  };
}

// ---------- 10. Report ready ----------
export function reportReady({ candidateName, resultUrl }) {
  return {
    subject: "PeerProof — Report ready / 認証レポートが完成しました",
    html: layout(`
      ${h("Your verification report is ready")}
      ${p(`The verification report for <strong>${candidateName || "your candidate"}</strong> is now available.`)}
      ${resultUrl ? p(btn(resultUrl, "View the report")) : p("Log in to your dashboard to view the full report.")}
      ${divider()}
      ${h("認証レポートが完成しました")}
      ${p(`<strong>${candidateName || "候補者"}</strong>様の認証レポートが完成しました。`)}
      ${resultUrl ? p(btn(resultUrl, "レポートを見る")) : p("ダッシュボードにログインして、レポートの全文をご確認ください。")}
    `),
  };
}
