import { createClient } from '@supabase/supabase-js';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function mask(value) {
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}…${value.slice(-3)}`;
}

const url = required('NEXT_PUBLIC_SUPABASE_URL');
const serviceRole = required('SUPABASE_SERVICE_ROLE_KEY');
const accountId = required('META_WHATSAPP_PHONE_NUMBER_ID');
const email = required('HSE_LINK_USER_EMAIL').toLowerCase();
const whatsappId = required('HSE_LINK_WHATSAPP_ID').replace(/[^0-9]/g, '');
const organizationRef = required('HSE_LINK_ORGANIZATION');
const siteName = process.env.HSE_LINK_SITE?.trim() || null;
const displayName = process.env.HSE_LINK_DISPLAY_NAME?.trim() || null;

if (!whatsappId) throw new Error('HSE_LINK_WHATSAPP_ID must contain a WhatsApp user id / phone digits');

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id,email,full_name')
  .eq('email', email)
  .maybeSingle();
if (profileError) throw profileError;
if (!profile) throw new Error(`No HSE profile found for ${email}`);

let organization = null;
const bySlug = await supabase.from('organizations').select('id,name,slug').eq('slug', organizationRef).maybeSingle();
if (bySlug.error) throw bySlug.error;
organization = bySlug.data;
if (!organization) {
  const byName = await supabase.from('organizations').select('id,name,slug').eq('name', organizationRef).maybeSingle();
  if (byName.error) throw byName.error;
  organization = byName.data;
}
if (!organization) throw new Error(`No organization found for ${organizationRef}`);

const { data: membership, error: membershipError } = await supabase
  .from('organization_members')
  .select('role')
  .eq('organization_id', organization.id)
  .eq('user_id', profile.id)
  .maybeSingle();
if (membershipError) throw membershipError;
if (!membership) throw new Error('User is not a member of the selected organization');

let siteId = null;
if (siteName) {
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id,name')
    .eq('organization_id', organization.id)
    .eq('name', siteName)
    .maybeSingle();
  if (siteError) throw siteError;
  if (!site) throw new Error(`No site named ${siteName} in ${organization.name}`);
  siteId = site.id;
}

const { data: identity, error: identityError } = await supabase
  .from('hse_channel_identities')
  .upsert({
    organization_id: organization.id,
    user_id: profile.id,
    site_id: siteId,
    provider: 'whatsapp',
    external_account_id: accountId,
    external_user_id: whatsappId,
    display_name: displayName || profile.full_name || null,
    active: true,
    metadata: { linked_by: 'link-hse-whatsapp-identity.mjs' },
  }, { onConflict: 'provider,external_account_id,external_user_id' })
  .select('id,organization_id,user_id,site_id,external_account_id,external_user_id,active')
  .single();
if (identityError) throw identityError;

console.log(JSON.stringify({
  ok: true,
  identity_id: identity.id,
  user: email,
  organization: organization.name,
  site: siteName,
  whatsapp_id: mask(whatsappId),
  account_id: mask(accountId),
  active: identity.active,
}, null, 2));
