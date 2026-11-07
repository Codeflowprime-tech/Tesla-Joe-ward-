import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const analyticsConsentKey = 'site-analytics-consent';
const analyticsRegionKey = 'site-analytics-region';
const referralCodeKey = 'site-referral-code';
const visitorSessionKey = 'site-visitor-session';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function getVisitorSessionId() {
  let sessionId = window.sessionStorage.getItem(visitorSessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.sessionStorage.setItem(visitorSessionKey, sessionId);
  }
  return sessionId;
}

export function getAnalyticsConsent() {
  return window.localStorage.getItem(analyticsConsentKey) === 'granted';
}

export async function trackAnalyticsEvent(eventName, { path, referralCode, eventId } = {}) {
  if (!supabase || !getAnalyticsConsent()) return;

  const { error } = await supabase.from('visitor_analytics').insert({
    event_id: eventId || crypto.randomUUID(),
    session_id: getVisitorSessionId(),
    event_name: eventName,
    page_path: (path || window.location.pathname).split('?')[0].slice(0, 300),
    region_bucket: window.localStorage.getItem(analyticsRegionKey) || null,
    referral_code: referralCode || null,
  });

  if (error && error.code !== '23505') throw error;
}

export function captureReferralCode() {
  const value = new URLSearchParams(window.location.search).get('ref');
  if (value && /^[A-Z0-9]{6,12}$/i.test(value)) {
    window.sessionStorage.setItem(referralCodeKey, value.toUpperCase());
    return value.toUpperCase();
  }
  return window.sessionStorage.getItem(referralCodeKey);
}

export async function createReferralInvite() {
  if (!supabase) throw new Error('Submission service is not configured.');
  let code = window.localStorage.getItem('site-referral-owner-code');
  const isNewCode = !code;
  if (!code) {
    code = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  }
  if (isNewCode) {
    const { error } = await supabase.from('referral_events').insert({ event_type: 'invite_created', referral_code: code });
    if (error) throw error;
    window.localStorage.setItem('site-referral-owner-code', code);
  }
  return { code, url: `${window.location.origin}/?ref=${code}` };
}

export async function recordReferralShare(code) {
  if (!supabase || !code) return;
  const { error } = await supabase.from('referral_events').insert({ event_type: 'invite_shared', referral_code: code });
  if (error) throw error;
  if (getAnalyticsConsent()) await trackAnalyticsEvent('referral_share', { referralCode: code });
}

export async function recordReferralConversion(code) {
  if (!supabase || !code) return;
  const { error } = await supabase.from('referral_events').insert({
    event_type: 'conversion',
    referral_code: code,
    session_id: getVisitorSessionId(),
  });
  if (error) throw error;
}

export async function saveSubmission({ type, name, email, vehicleModel, propertyArea, message, consented, referralOptIn }) {
  if (!supabase) {
    throw new Error('Submission service is not configured.');
  }
  if (!['Cyprus', 'United States', 'United Kingdom'].includes(propertyArea)) {
    throw new Error('A supported property area is required.');
  }

  const referralCode = referralOptIn ? captureReferralCode() : null;
  const { error } = await supabase.from('site_submissions').insert({
    submission_type: type,
    name: name.trim(),
    email: email.trim(),
    vehicle_model: vehicleModel || null,
    property_area: propertyArea,
    message: message.trim(),
    consented,
    referral_code: referralCode,
  });

  if (error) {
    throw error;
  }

  if (referralCode) await recordReferralConversion(referralCode).catch(() => {});
  if (getAnalyticsConsent()) await trackAnalyticsEvent('lead_submit', { referralCode }).catch(() => {});
}

export async function saveChatbotInquiry({ email, message, referralOptIn }) {
  if (!supabase) {
    throw new Error('Submission service is not configured.');
  }

  const { error } = await supabase.from('chatbot_inquiries').insert({
    email: email.trim(),
    message: message.trim(),
    referral_code: referralOptIn ? captureReferralCode() : null,
  });

  if (error) {
    throw error;
  }
  if (referralOptIn) await recordReferralConversion(captureReferralCode()).catch(() => {});
  if (getAnalyticsConsent()) await trackAnalyticsEvent('lead_submit').catch(() => {});
}

export async function loadPromotion() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('site_promotions').select('*').eq('promotion_key', 'primary').maybeSingle();
  if (error) throw error;
  return data;
}

export async function savePromotion(promotion) {
  if (!supabase) throw new Error('Submission service is not configured.');
  const { error } = await supabase.from('site_promotions').update({
    enabled: promotion.enabled,
    banner_enabled: promotion.banner_enabled,
    popup_enabled: promotion.popup_enabled,
    title: promotion.title.trim(),
    body: promotion.body.trim(),
    cta_label: promotion.cta_label.trim(),
    cta_href: promotion.cta_href.trim(),
    updated_at: new Date().toISOString(),
  }).eq('promotion_key', 'primary');
  if (error) throw error;
}

export async function loadAdminData() {
  if (!supabase) {
    throw new Error('Submission service is not configured.');
  }

  const [submissions, chatbot, testimonials, analytics, promotion] = await Promise.all([
    supabase.from('site_submissions').select('*').order('created_at', { ascending: false }),
    supabase.from('chatbot_inquiries').select('*').order('created_at', { ascending: false }),
    supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
    supabase.from('analytics_daily').select('*').order('day', { ascending: false }).limit(30),
    supabase.from('site_promotions').select('*').eq('promotion_key', 'primary').maybeSingle(),
  ]);

  const failure = submissions.error || chatbot.error || testimonials.error || analytics.error || promotion.error;
  if (failure) {
    throw failure;
  }

  return {
    submissions: submissions.data,
    chatbot: chatbot.data,
    testimonials: testimonials.data,
    analytics: analytics.data,
    promotion: promotion.data,
  };
}

export async function saveAdminReply({ table, id, reply, kind }) {
  if (!supabase || !['site_submissions', 'chatbot_inquiries'].includes(table)) {
    throw new Error('Invalid admin response target.');
  }

  const { error } = await supabase.from(table).update({
    reply_text: reply.trim(),
    reply_kind: kind,
    reply_approved_at: new Date().toISOString(),
    reply_status: 'approved',
  }).eq('id', id);

  if (error) {
    throw error;
  }
}

export async function saveTestimonialVerification({ id, isVerified, isPublished }) {
  if (!supabase) {
    throw new Error('Submission service is not configured.');
  }

  const { error } = await supabase.from('testimonials').update({
    is_verified: isVerified,
    is_published: isPublished,
  }).eq('id', id);

  if (error) {
    throw error;
  }
}