/**
 * PERALAGAE Jewellery — Luxury Branded Email Templates
 *
 * Design System Specifications:
 * - Brand Name: PERALAGAE
 * - Primary Accents: Gold (#C5A572), Deep Charcoal (#1A1A1A), Pure White (#FFFFFF)
 * - Backgrounds: Off-white canvas (#FAF9F6), Pristine Card (#FFFFFF)
 * - Borders: Delicate Warm Taupe (#EAE6DF)
 * - Typography: Georgia / serif headings with clean sans-serif body
 * - Email client compatibility: Table-based fluid layouts with inline styles
 * - Every template provides both HTML and Plain-Text alternatives
 */

export interface StoreContactInfo {
  phone?: string | undefined;
  email?: string | undefined;
  address?: string | undefined;
}

const DEFAULT_STORE_CONTACT: StoreContactInfo = {
  phone: "+91 98765 43210",
  email: "support@peralagae.com",
  address: "PERALAGAE Fine Jewellery, Mumbai, India",
};

/**
 * Format INR currency with Indian commas
 */
function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * HTML Shell wrapping all PERALAGAE luxury emails
 */
function wrapHtmlShell(
  title: string,
  contentHtml: string,
  footerExtraHtml = "",
  _storeContact: StoreContactInfo | undefined = DEFAULT_STORE_CONTACT
): string {

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: #C5A572; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #FAF9F6; color: #1A1A1A;">
  <center>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F6;">
      <tr>
        <td align="center" style="padding: 12px 16px;">
          <!-- Container -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            
            <!-- Luxury Gold Accent Top Border -->
            <tr>
              <td height="4" style="background-color: #C5A572; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>

            <!-- Header / Brand Wordmark -->
            <tr>
              <td align="center" style="padding: 36px 32px 28px; border-bottom: 1px solid #F2EEE9; background-color: #FFFFFF;">
                <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase; color: #111111;">
                  PERALAGAE
                </h1>
                <p style="margin: 6px 0 0; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #888888; font-weight: 300;">
                  Fine Jewellery &middot; Timeless Craftsmanship
                </p>
              </td>
            </tr>

            <!-- Content Slot -->
            <tr>
              <td class="mobile-padding" style="padding: 36px 40px; background-color: #FFFFFF;">
                ${contentHtml}
              </td>
            </tr>

            <!-- Pre-Footer Guarantee / Trust Badges -->
            <tr>
              <td style="padding: 24px 40px; background-color: #FAF8F5; border-top: 1px solid #EAE6DF; border-bottom: 1px solid #EAE6DF;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="font-size: 12px; color: #555555; line-height: 1.6;">
                      <span style="display: inline-block; margin: 0 10px;">&bull; BIS Hallmarked Purity</span>
                      <span style="display: inline-block; margin: 0 10px;">&bull; Insured Signature Delivery</span>
                      <span style="display: inline-block; margin: 0 10px;">&bull; Certified Luxury Craftsmanship</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="mobile-padding" style="padding: 32px 40px 36px; background-color: #111111; color: #A5A5A5; text-align: center;">
                <p style="margin: 0 0 10px; font-family: Georgia, serif; font-size: 14px; letter-spacing: 0.15em; color: #C5A572; text-transform: uppercase;">
                  PERALAGAE JEWELLERY
                </p>
                ${footerExtraHtml}
                <p style="margin: 16px 0 0; font-size: 11px; color: #555555;">
                  &copy; ${new Date().getFullYear()} PERALAGAE. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Welcome Email
// ────────────────────────────────────────────────────────────────────────────

export interface WelcomeEmailData {
  customerName: string;
  shopUrl: string;
  storeContact?: StoreContactInfo | undefined;
}

export function renderWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const { customerName, shopUrl, storeContact = DEFAULT_STORE_CONTACT } = data;
  const firstName = customerName.trim().split(" ")[0] || "Valued Client";

  const contentHtml = `
    <h2 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #111111; text-align: center; letter-spacing: -0.01em;">
      Welcome to PERALAGAE, ${firstName}
    </h2>
    <div style="width: 48px; height: 1px; background-color: #C5A572; margin: 0 auto 24px;"></div>
    
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #333333;">
      We are delighted to welcome you to the world of PERALAGAE. Our bespoke jewellery is conceived as a celebration of enduring elegance, master craftsmanship, and timeless beauty.
    </p>
    
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #333333;">
      Whether you are acquiring a signature heirloom piece for life&apos;s defining milestones or curating your everyday luxury collection, our master jewellers are honored to accompany your journey.
    </p>

    <!-- Luxury Features Card -->
    <div style="background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; padding: 20px; margin: 0 0 28px;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #111111;">
        The PERALAGAE Experience:
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: #444444;">
        <li>100% Certified 22K & 18K Hallmarked Gold and Ethical Diamonds</li>
        <li>Complimentary Insured White-Glove Shipping across India</li>
        <li>Personalized Concierge & Custom Bespoke Designing</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 16px;">
      <tr>
        <td align="center">
          <a href="${shopUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; font-size: 13px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 36px; border-radius: 2px; text-decoration: none; border: 1px solid #111111;">
            EXPLORE THE COLLECTION
          </a>
        </td>
      </tr>
    </table>
  `;

  const text = `Welcome to PERALAGAE, ${firstName}!

We are delighted to have you with us. Discover jewellery that celebrates elegance, craftsmanship, and timeless beauty.

Thank you for becoming part of our journey.

Explore our curated collections: ${shopUrl}

If you have any questions or require bespoke consultation, our concierge team is always at your disposal at ${storeContact.email}.

PERALAGAE Fine Jewellery`;

  return {
    html: wrapHtmlShell("Welcome to PERALAGAE — Discover Timeless Elegance", contentHtml, "", storeContact),
    text,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Forgot Password — OTP Email
// ────────────────────────────────────────────────────────────────────────────

export interface PasswordResetOtpData {
  customerName: string;
  otp: string;
  expiryMinutes?: number | undefined;
  storeContact?: StoreContactInfo | undefined;
}

export function renderPasswordResetOtpEmail(data: PasswordResetOtpData): { html: string; text: string } {
  const { customerName, otp, expiryMinutes = 10, storeContact = DEFAULT_STORE_CONTACT } = data;
  const firstName = customerName.trim().split(" ")[0] || "Client";

  const contentHtml = `
    <h2 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #111111; text-align: center; letter-spacing: -0.01em;">
      Password Reset Verification
    </h2>
    <div style="width: 48px; height: 1px; background-color: #C5A572; margin: 0 auto 24px;"></div>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333333;">
      Dear ${firstName},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #333333;">
      We received a request to reset the password for your PERALAGAE Jewellery account. Please enter the one-time verification code below to authorize your request:
    </p>

    <!-- Prominent OTP Display Box -->
    <div style="background-color: #FAF8F5; border: 1px solid #C5A572; border-radius: 4px; padding: 24px; text-align: center; margin: 0 0 24px;">
      <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #666666;">
        Your One-Time Password (OTP)
      </p>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #111111; margin: 10px 0;">
        ${otp}
      </div>
      <p style="margin: 8px 0 0; font-size: 12px; color: #C5A572; font-weight: 600;">
        Valid for ${expiryMinutes} minutes only
      </p>
    </div>

    <!-- Security Warning -->
    <div style="background-color: #FFFDF9; border-left: 3px solid #C5A572; padding: 14px 18px; margin: 0 0 24px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #555555;">
        <strong>Security Notice:</strong> Never share this code with anyone. PERALAGAE staff will never ask for your verification code.
      </p>
    </div>

    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #777777;">
      If you did not initiate this request, you may safely ignore this message. Your existing password will remain secure and active.
    </p>
  `;

  const text = `PERALAGAE — Your Password Reset OTP

Dear ${firstName},

We received a request to reset your PERALAGAE Jewellery account password.

Your One-Time Password (OTP) is: ${otp}

This code is valid for ${expiryMinutes} minutes.

Security Notice: Never share this OTP with anyone. PERALAGAE representatives will never ask for your code. If you did not make this request, please disregard this email.

Need assistance? Contact our concierge at ${storeContact.email}.`;

  return {
    html: wrapHtmlShell("PERALAGAE — Your Password Reset OTP", contentHtml, "", storeContact),
    text,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Daily Evening Cart Reminder Email
// ────────────────────────────────────────────────────────────────────────────

export interface CartReminderItem {
  id: string;
  name: string;
  imageUrl?: string | null | undefined;
  priceInr: number;
  quantity: number;
}

export interface CartReminderData {
  customerName: string;
  items: CartReminderItem[];
  subtotalInr: number;
  totalInr: number;
  cartUrl: string;
  unsubscribeUrl: string;
  storeContact?: StoreContactInfo | undefined;
}

export function renderDailyCartReminderEmail(data: CartReminderData): { html: string; text: string } {
  const { customerName, items, subtotalInr, totalInr, cartUrl, unsubscribeUrl, storeContact = DEFAULT_STORE_CONTACT } = data;
  const firstName = customerName.trim().split(" ")[0] || "Valued Client";

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #F0ECE6;" width="80" valign="top">
        ${
          item.imageUrl
            ? `<img src="${item.imageUrl}" alt="${item.name}" width="72" height="72" style="display: block; border-radius: 4px; object-fit: cover; border: 1px solid #EAE6DF;" />`
            : `<div style="width: 72px; height: 72px; background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; text-align: center; line-height: 72px; color: #999; font-size: 10px;">JEWELLERY</div>`
        }
      </td>
      <td style="padding: 16px 16px; border-bottom: 1px solid #F0ECE6;" valign="middle">
        <p style="margin: 0 0 4px; font-family: Georgia, serif; font-size: 15px; color: #111111; font-weight: normal;">
          ${item.name}
        </p>
        <p style="margin: 0; font-size: 13px; color: #777777;">
          Qty: ${item.quantity} &times; ${formatInr(item.priceInr)}
        </p>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #F0ECE6; text-align: right;" valign="middle">
        <span style="font-family: Georgia, serif; font-size: 15px; color: #111111; font-weight: 500;">
          ${formatInr(item.priceInr * item.quantity)}
        </span>
      </td>
    </tr>
  `
    )
    .join("");

  const contentHtml = `
    <h2 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #111111; text-align: center; letter-spacing: -0.01em;">
      Your Selected Pieces Are Waiting
    </h2>
    <div style="width: 48px; height: 1px; background-color: #C5A572; margin: 0 auto 24px;"></div>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333333;">
      Dear ${firstName},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #333333;">
      We noticed you left handcrafted treasures in your shopping bag. Because our master artisans curate fine jewellery in limited numbers, availability is reserved on a first-come basis.
    </p>

    <!-- Cart Items Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px;">
      ${itemsHtml}
    </table>

    <!-- Cart Summary -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 28px;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #666666;">Subtotal</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111111; text-align: right;">${formatInr(subtotalInr)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #666666;">Insured Shipping</td>
        <td style="padding: 6px 0; font-size: 14px; color: #2E7D32; text-align: right; font-weight: 500;">Complimentary</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0; font-family: Georgia, serif; font-size: 17px; font-weight: 600; color: #111111; border-top: 1px solid #EAE6DF;">Total (incl. 3% GST)</td>
        <td style="padding: 12px 0 0; font-family: Georgia, serif; font-size: 18px; font-weight: 600; color: #111111; text-align: right; border-top: 1px solid #EAE6DF;">${formatInr(totalInr)}</td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 20px;">
      <tr>
        <td align="center">
          <a href="${cartUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; font-size: 13px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 36px; border-radius: 2px; text-decoration: none; border: 1px solid #111111;">
            RETURN TO YOUR CART
          </a>
        </td>
      </tr>
    </table>
  `;

  const footerExtraHtml = `
    <p style="margin: 12px 0 0; font-size: 11px; color: #666666;">
      You received this reminder because you have active items in your bag.
      <a href="${unsubscribeUrl}" style="color: #C5A572; text-decoration: underline;">Manage preferences or unsubscribe</a>.
    </p>
  `;

  const itemsText = items.map((i) => `- ${i.name} (Qty: ${i.quantity}) — ${formatInr(i.priceInr * i.quantity)}`).join("\n");
  const text = `PERALAGAE — Your Favourite Pieces Are Waiting!

Dear ${firstName},

We noticed you left handcrafted treasures in your PERALAGAE shopping bag.

Items in your bag:
${itemsText}

Estimated Total: ${formatInr(totalInr)} (Includes 3% GST & Free Insured Shipping)

Return to complete your order: ${cartUrl}

If you would rather not receive these daily reminders, you can unsubscribe here: ${unsubscribeUrl}

PERALAGAE Fine Jewellery`;

  return {
    html: wrapHtmlShell("PERALAGAE — Your Favourite Pieces Are Waiting!", contentHtml, footerExtraHtml, storeContact),
    text,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Order Confirmed / Payment Success Email
// ────────────────────────────────────────────────────────────────────────────

export interface OrderItemDetail {
  productName: string;
  productImageUrl?: string | null | undefined;
  unitPriceInr: number;
  quantity: number;
  totalPriceInr: number;
}

export interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItemDetail[];
  subtotalInr: number;
  taxInr: number;
  shippingInr: number;
  totalInr: number;
  shippingAddress: {
    fullName: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string | undefined;
    phone: string;
  };
  paymentStatus: string;
  paymentMethod: string;
  orderUrl: string;
  storeContact?: StoreContactInfo | undefined;
}

export function renderOrderConfirmedEmail(data: OrderEmailData): { html: string; text: string } {
  const { customerName, orderNumber, orderDate, items, subtotalInr, taxInr, shippingInr, totalInr, shippingAddress, paymentStatus, paymentMethod, orderUrl, storeContact = DEFAULT_STORE_CONTACT } = data;
  const firstName = customerName.trim().split(" ")[0] || "Client";

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #F0ECE6;" width="70" valign="top">
        ${
          item.productImageUrl
            ? `<img src="${item.productImageUrl}" alt="${item.productName}" width="64" height="64" style="display: block; border-radius: 4px; object-fit: cover; border: 1px solid #EAE6DF;" />`
            : `<div style="width: 64px; height: 64px; background-color: #FAF8F5; border-radius: 4px; line-height: 64px; text-align: center; color: #999; font-size: 10px;">JEWELLERY</div>`
        }
      </td>
      <td style="padding: 14px 14px; border-bottom: 1px solid #F0ECE6;" valign="middle">
        <p style="margin: 0 0 4px; font-family: Georgia, serif; font-size: 15px; color: #111111;">
          ${item.productName}
        </p>
        <p style="margin: 0; font-size: 13px; color: #777777;">
          Qty: ${item.quantity} &times; ${formatInr(item.unitPriceInr)}
        </p>
      </td>
      <td style="padding: 14px 0; border-bottom: 1px solid #F0ECE6; text-align: right;" valign="middle">
        <span style="font-family: Georgia, serif; font-size: 15px; color: #111111; font-weight: 500;">
          ${formatInr(item.totalPriceInr)}
        </span>
      </td>
    </tr>
  `
    )
    .join("");

  const contentHtml = `
    <!-- Confirmation Banner -->
    <div style="text-align: center; margin: 0 0 24px;">
      <span style="display: inline-block; background-color: #FAF8F5; border: 1px solid #C5A572; color: #111111; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 16px; border-radius: 20px;">
        PAYMENT CONFIRMED &middot; ORDER #${orderNumber}
      </span>
      <h2 style="margin: 16px 0 6px; font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #111111;">
        Thank You For Your Order
      </h2>
      <p style="margin: 0; font-size: 13px; color: #777777;">
        Placed on ${orderDate} &middot; Payment via ${paymentMethod} (${paymentStatus})
      </p>
    </div>

    <div style="width: 48px; height: 1px; background-color: #C5A572; margin: 0 auto 24px;"></div>

    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #333333;">
      Dear ${firstName}, your payment has been successfully verified, and our concierge team is preparing your bespoke parcel with insured transit care.
    </p>

    <!-- Ordered Items -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px;">
      ${itemsHtml}
    </table>

    <!-- Pricing Breakdown -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px; background-color: #FAF8F5; border-radius: 4px; padding: 16px;">
      <tr>
        <td style="padding: 4px 12px; font-size: 13px; color: #666666;">Subtotal</td>
        <td style="padding: 4px 12px; font-size: 13px; color: #111111; text-align: right;">${formatInr(subtotalInr)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px; font-size: 13px; color: #666666;">GST (3.0% Jewellery Tax)</td>
        <td style="padding: 4px 12px; font-size: 13px; color: #111111; text-align: right;">${formatInr(taxInr)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px; font-size: 13px; color: #666666;">Insured Express Transit</td>
        <td style="padding: 4px 12px; font-size: 13px; color: #2E7D32; text-align: right; font-weight: 500;">
          ${shippingInr > 0 ? formatInr(shippingInr) : "FREE"}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 12px 4px; font-family: Georgia, serif; font-size: 16px; font-weight: 600; color: #111111; border-top: 1px solid #EAE6DF;">
          Total Paid
        </td>
        <td style="padding: 10px 12px 4px; font-family: Georgia, serif; font-size: 17px; font-weight: 600; color: #111111; text-align: right; border-top: 1px solid #EAE6DF;">
          ${formatInr(totalInr)}
        </td>
      </tr>
    </table>

    <!-- Shipping Address Box -->
    <div style="border: 1px solid #EAE6DF; border-radius: 4px; padding: 16px 20px; margin: 0 0 28px;">
      <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #777777;">
        Delivery Destination
      </p>
      <p style="margin: 0 0 2px; font-weight: 600; font-size: 14px; color: #111111;">
        ${shippingAddress.fullName}
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #555555;">
        ${shippingAddress.addressLine}<br />
        ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}<br />
        ${shippingAddress.country || "India"} &middot; Tel: ${shippingAddress.phone}
      </p>
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${orderUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; font-size: 13px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 36px; border-radius: 2px; text-decoration: none; border: 1px solid #111111;">
            VIEW ORDER DETAILS
          </a>
        </td>
      </tr>
    </table>
  `;

  const itemsText = items.map((i) => `- ${i.productName} (Qty: ${i.quantity}) — ${formatInr(i.totalPriceInr)}`).join("\n");
  const text = `PERALAGAE — Order Confirmed (#${orderNumber})

Dear ${firstName},

Thank you for choosing PERALAGAE. Your order has been placed successfully and payment is confirmed.

Order Date: ${orderDate}
Payment: ${paymentMethod} (${paymentStatus})

Order Items:
${itemsText}

Subtotal: ${formatInr(subtotalInr)}
GST (3%): ${formatInr(taxInr)}
Shipping: ${shippingInr > 0 ? formatInr(shippingInr) : "FREE"}
Total Paid: ${formatInr(totalInr)}

Delivery Address:
${shippingAddress.fullName}
${shippingAddress.addressLine}
${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}
${shippingAddress.country || "India"}
Phone: ${shippingAddress.phone}

View your order online: ${orderUrl}

Concierge Inquiries: ${storeContact.email}`;

  return {
    html: wrapHtmlShell(`PERALAGAE — Your Order #${orderNumber} Is Confirmed`, contentHtml, "", storeContact),
    text,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Admin Changes Status to PROCESSING
// ────────────────────────────────────────────────────────────────────────────

export interface OrderStatusProcessingData {
  customerName: string;
  orderNumber: string;
  items: Array<{ productName: string; productImageUrl?: string | null | undefined; quantity: number }>;
  orderUrl: string;
  storeContact?: StoreContactInfo | undefined;
}

export function renderOrderProcessingEmail(data: OrderStatusProcessingData): { html: string; text: string } {
  const { customerName, orderNumber, items, orderUrl, storeContact = DEFAULT_STORE_CONTACT } = data;
  const firstName = customerName.trim().split(" ")[0] || "Client";

  const itemsSummary = items
    .map(
      (i) => `
    <div style="display: inline-block; margin: 6px; text-align: center; vertical-align: top; width: 100px;">
      ${
        i.productImageUrl
          ? `<img src="${i.productImageUrl}" alt="${i.productName}" width="72" height="72" style="display: block; margin: 0 auto 6px; border-radius: 4px; object-fit: cover; border: 1px solid #EAE6DF;" />`
          : `<div style="width: 72px; height: 72px; margin: 0 auto 6px; background-color: #FAF8F5; border-radius: 4px; line-height: 72px; text-align: center; color: #999; font-size: 10px;">JEWELLERY</div>`
      }
      <div style="font-size: 11px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${i.productName}</div>
    </div>
  `
    )
    .join("");

  const contentHtml = `
    <div style="text-align: center; margin: 0 0 24px;">
      <span style="display: inline-block; background-color: #FAF8F5; border: 1px solid #C5A572; color: #111111; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 16px; border-radius: 20px;">
        STATUS: IN PREPARATION
      </span>
      <h2 style="margin: 16px 0 6px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #111111;">
        Your Order Is Now Being Processed
      </h2>
      <p style="margin: 0; font-size: 13px; color: #777777;">
        Order #${orderNumber}
      </p>
    </div>

    <div style="width: 48px; height: 1px; background-color: #C5A572; margin: 0 auto 24px;"></div>

    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333333;">
      Dear ${firstName},
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #333333;">
      Our master jewelers and quality specialists have commenced preparation of your jewellery piece. Each PERALAGAE item undergoes rigorous craftsmanship verification, hallmark audit, and signature archival packaging.
    </p>

    <!-- Items in Process -->
    <div style="background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; padding: 18px; text-align: center; margin: 0 0 28px;">
      <p style="margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #777777; font-weight: 600;">
        Pieces in Handcrafting & Inspection
      </p>
      ${itemsSummary}
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${orderUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; font-size: 13px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 36px; border-radius: 2px; text-decoration: none; border: 1px solid #111111;">
            VIEW ORDER STATUS
          </a>
        </td>
      </tr>
    </table>
  `;

  const text = `PERALAGAE — Your Order Is Now Being Processed!

Dear ${firstName},

Your order #${orderNumber} is now being prepared by our master jewelers. Every item undergoes rigorous quality audits and signature packaging.

View your order status: ${orderUrl}

Concierge: ${storeContact.email}`;

  return {
    html: wrapHtmlShell(`PERALAGAE — Order #${orderNumber} Is Now Being Processed`, contentHtml, "", storeContact),
    text,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Shipping Update Email With Admin Uploaded Images
// ────────────────────────────────────────────────────────────────────────────

export interface OrderShippedData {
  customerName: string;
  orderNumber: string;
  carrierName?: string | null | undefined;
  trackingNumber?: string | null | undefined;
  shipmentDescription?: string | null | undefined;
  shippingImages?: Array<{ url: string; filename?: string | undefined }> | undefined;
  deliveryAddress?: {
    fullName: string;
    city: string;
    state: string;
    postalCode: string;
  } | undefined;
  orderUrl: string;
  storeContact?: StoreContactInfo | undefined;
}

export function renderOrderShippedEmail(data: OrderShippedData): { html: string; text: string } {
  const {
    customerName,
    orderNumber,
    carrierName = "Direct Insured Courier",
    trackingNumber,
    shipmentDescription = "Dispatched in tamper-evident security packaging.",
    shippingImages = [],
    deliveryAddress,
    orderUrl,
    storeContact = DEFAULT_STORE_CONTACT,
  } = data;
  const firstName = customerName.trim().split(" ")[0] || "Client";

  // Gallery of admin packaging proof images
  const imagesHtml =
    shippingImages && shippingImages.length > 0
      ? `
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #111111;">
        Shipment & Packaging Evidence (${shippingImages.length} Image${shippingImages.length > 1 ? "s" : ""})
      </p>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            ${shippingImages
              .map(
                (img) => `
              <div style="display: inline-block; margin: 4px; vertical-align: top;">
                <a href="${img.url}" target="_blank">
                  <img src="${img.url}" alt="Packaging Proof" width="120" height="120" style="display: block; border-radius: 4px; object-fit: cover; border: 1px solid #C5A572;" />
                </a>
              </div>
            `
              )
              .join("")}
          </td>
        </tr>
      </table>
      <p style="margin: 8px 0 0; font-size: 11px; color: #777777;">
        Click images to expand packaging seals and dispatch labels.
      </p>
    </div>
  `
      : "";

  const contentHtml = `
    <div style="text-align: center; margin: 0 0 24px;">
      <span style="display: inline-block; background-color: #FAF8F5; border: 1px solid #C5A572; color: #111111; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 16px; border-radius: 20px;">
        DISPATCHED &middot; INSURED TRANSIT
      </span>
      <h2 style="margin: 16px 0 6px; font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #111111;">
        Your Order Has Been Shipped
      </h2>
      <p style="margin: 0; font-size: 13px; color: #777777;">
        Order #${orderNumber}
      </p>
    </div>

    <div style="width: 48px; height: 1px; background-color: #C5A572; margin: 0 auto 24px;"></div>

    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333333;">
      Dear ${firstName},
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #333333;">
      Your PERALAGAE jewellery has been securely sealed and dispatched with fully insured express delivery.
    </p>

    <!-- Courier Details Card -->
    <div style="background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; padding: 20px; margin: 0 0 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #777777;" width="130">Courier Carrier:</td>
          <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #111111;">${carrierName}</td>
        </tr>
        ${
          trackingNumber
            ? `
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #777777;">Tracking Number:</td>
          <td style="padding: 4px 0; font-size: 14px; font-family: 'Courier New', monospace; font-weight: 700; color: #C5A572;">
            ${trackingNumber}
          </td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 8px 0 0; font-size: 13px; color: #777777;" valign="top">Dispatch Note:</td>
          <td style="padding: 8px 0 0; font-size: 13px; line-height: 1.5; color: #333333;">${shipmentDescription}</td>
        </tr>
        ${
          deliveryAddress
            ? `
        <tr>
          <td style="padding: 8px 0 0; font-size: 13px; color: #777777;" valign="top">Destination:</td>
          <td style="padding: 8px 0 0; font-size: 13px; color: #333333;">
            ${deliveryAddress.fullName} &middot; ${deliveryAddress.city}, ${deliveryAddress.state} (${deliveryAddress.postalCode})
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <!-- Admin Uploaded Shipping Proof Gallery -->
    ${imagesHtml}

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 16px;">
      <tr>
        <td align="center">
          <a href="${orderUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; font-size: 13px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 36px; border-radius: 2px; text-decoration: none; border: 1px solid #111111;">
            TRACK ORDER &amp; VIEW PROOFS
          </a>
        </td>
      </tr>
    </table>
  `;

  const text = `PERALAGAE — Your Order Has Been Shipped! (#${orderNumber})

Dear ${firstName},

Your order has been securely sealed and handed over to ${carrierName}.
${trackingNumber ? `Tracking Number: ${trackingNumber}\n` : ""}
Dispatch Note: ${shipmentDescription}

Track your shipment and inspect packaging evidence: ${orderUrl}

Concierge: ${storeContact.email}`;

  return {
    html: wrapHtmlShell(`PERALAGAE — Your Order #${orderNumber} Has Shipped`, contentHtml, "", storeContact),
    text,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 7. Order Completed / Delivered Email
// ────────────────────────────────────────────────────────────────────────────

export interface OrderDeliveredData {
  customerName: string;
  orderNumber: string;
  items: Array<{ productName: string; productImageUrl?: string | null | undefined }>;
  shopUrl: string;
  storeContact?: StoreContactInfo | undefined;
}

export function renderOrderDeliveredEmail(data: OrderDeliveredData): { html: string; text: string } {
  const { customerName, orderNumber, items, shopUrl, storeContact = DEFAULT_STORE_CONTACT } = data;
  const firstName = customerName.trim().split(" ")[0] || "Valued Client";

  const itemsHtml = items
    .map(
      (item) => `
    <div style="display: inline-block; margin: 8px; vertical-align: top; text-align: center; width: 100px;">
      ${
        item.productImageUrl
          ? `<img src="${item.productImageUrl}" alt="${item.productName}" width="72" height="72" style="display: block; margin: 0 auto 6px; border-radius: 4px; object-fit: cover; border: 1px solid #EAE6DF;" />`
          : `<div style="width: 72px; height: 72px; margin: 0 auto 6px; background-color: #FAF8F5; border-radius: 4px; line-height: 72px; text-align: center; color: #999; font-size: 10px;">JEWELLERY</div>`
      }
      <div style="font-size: 11px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.productName}</div>
    </div>
  `
    )
    .join("");

  const contentHtml = `
    <div style="text-align: center; margin: 0 0 24px;">
      <span style="display: inline-block; background-color: #FAF8F5; border: 1px solid #C5A572; color: #111111; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 16px; border-radius: 20px;">
        COMPLETED &middot; DELIVERED
      </span>
      <h2 style="margin: 16px 0 6px; font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #111111;">
        Your Order Is Complete
      </h2>
      <p style="margin: 0; font-size: 13px; color: #777777;">
        Order #${orderNumber}
      </p>
    </div>

    <div style="width: 48px; height: 1px; background-color: #C5A572; margin: 0 auto 24px;"></div>

    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333333;">
      Dear ${firstName},
    </p>
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #333333;">
      Your PERALAGAE order has been successfully completed! Thank you for choosing PERALAGAE. We hope your jewellery brings you lasting joy, elegance, and timeless beauty.
    </p>

    <!-- Delivered Items Showcase -->
    <div style="background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; padding: 18px; text-align: center; margin: 0 0 24px;">
      <p style="margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #777777; font-weight: 600;">
        Delivered Pieces
      </p>
      ${itemsHtml}
    </div>

    <!-- Jewellery Care Reminder -->
    <div style="border-left: 3px solid #C5A572; background-color: #FFFDF9; padding: 14px 18px; margin: 0 0 28px;">
      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #111111;">
        Complimentary Care &amp; Warranty
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #555555;">
        Store your pieces in the provided moisture-free velvet pouch. Enjoy complimentary lifetime cleaning and hallmark assurance at any PERALAGAE boutique.
      </p>
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${shopUrl}" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; font-size: 13px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 36px; border-radius: 2px; text-decoration: none; border: 1px solid #111111;">
            EXPLORE MORE JEWELLERY
          </a>
        </td>
      </tr>
    </table>
  `;

  const text = `PERALAGAE — Your Order Is Complete. Thank You! (#${orderNumber})

Dear ${firstName},

Your PERALAGAE order has been successfully completed!

Thank you for choosing PERALAGAE. We hope your jewellery brings you lasting joy and elegance. We truly appreciate your trust in us.

Explore more collections: ${shopUrl}

Concierge: ${storeContact.email}`;

  return {
    html: wrapHtmlShell(`PERALAGAE — Your Order #${orderNumber} Is Complete`, contentHtml, "", storeContact),
    text,
  };
}
