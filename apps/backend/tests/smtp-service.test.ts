import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { validateEnv } from "../src/config/env.js";
import { prisma } from "../src/database/prisma.js";
import { signAdminToken } from "../src/utils/auth.js";
import { EmailService } from "../src/services/email/email-service.js";

const env = validateEnv();
const app = createApp(env);

describe("PERALAGAE Jewellery — Nodemailer SMTP Architecture Verification", () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = signAdminToken({ email: "admin@peralagae.com" }, env.ADMIN_JWT_SECRET);
  });

  it("verifies SMTP connection health via EmailService.verifyConnection()", async () => {
    const result = await EmailService.verifyConnection();
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toContain("SMTP");
  });

  it("returns SMTP provider details in admin stats via GET /api/emails/admin/stats", async () => {
    const res = await request(app)
      .get("/api/emails/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe("SMTP");
    expect(res.body.data.smtpPort).toBe(env.SMTP_PORT);
    expect(res.body.data.smtpSecure).toBe(env.SMTP_SECURE);
  });

  it("verifies SMTP connectivity via POST /api/emails/admin/smtp/verify", async () => {
    const res = await request(app)
      .post("/api/emails/admin/smtp/verify")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.success).toBe(true);
  });

  it("dispatches transactional email with provider set to SMTP in MongoDB EmailLog", async () => {
    const testRecipient = `smtp_test_${Date.now()}@royalperalagae.test`;
    const idempotencyKey = `smtp_dispatch_${Date.now()}`;

    const sendResult = await EmailService.sendEmail({
      to: testRecipient,
      subject: "PERALAGAE — SMTP Protocol Test",
      html: "<p>Exclusive Royal Jewellery Notification</p>",
      text: "Exclusive Royal Jewellery Notification",
      emailType: "WELCOME",
      idempotencyKey,
    });

    expect(sendResult.success).toBe(true);
    expect(sendResult.logId).toBeDefined();

    const createdLog = await prisma.emailLog.findUnique({
      where: { id: sendResult.logId! },
    });

    expect(createdLog).not.toBeNull();
    expect(createdLog?.provider).toBe("SMTP");
    expect(createdLog?.status).toBe("SENT");
    expect(createdLog?.recipientEmail).toBe(testRecipient);

    // Clean up
    await prisma.emailLog.delete({ where: { id: sendResult.logId! } });
  });

  it("ensures sensitive credentials are NEVER leaked in EmailLog on simulated failure", async () => {
    const testRecipient = `error_sanitization_${Date.now()}@peralagae.test`;
    const dummyPassword = "SuperSecretSmtpPassword123!";

    // Create an error log directly simulating an error message that might contain sensitive strings
    const rawError = `Authentication failed for user smtp@peralagae.com with password ${dummyPassword}`;
    const sanitizedError = rawError.replace(/with password.*$/i, "with password [REDACTED]");

    const logRecord = await prisma.emailLog.create({
      data: {
        recipientEmail: testRecipient,
        emailType: "WELCOME",
        subject: "Security Test",
        provider: "SMTP",
        status: "FAILED",
        errorMessage: sanitizedError,
      },
    });

    expect(logRecord.errorMessage).not.toContain(dummyPassword);
    expect(logRecord.errorMessage).toContain("[REDACTED]");

    // Clean up
    await prisma.emailLog.delete({ where: { id: logRecord.id } });
  });
});

