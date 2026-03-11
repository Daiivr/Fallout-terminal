const PROXY_BASE = "https://api.codetabs.com/v1/proxy/?quest=";
const SILO_API_URL = "/api/intel/silo";
const SILO_RESET_DAY_UTC = 4;
const SOURCE_URLS = {
  silo: [
    "https://r.jina.ai/http://nukacrypt.com/",
    "https://r.jina.ai/http://www.nukacrypt.com/",
    "https://nukacrypt.com/"
  ],
  minerva: [
    "https://r.jina.ai/http://www.whereisminerva.com/",
    "https://r.jina.ai/http://whereisminerva.com/"
  ],
  minervaInfoApi: [
    "https://whereisminerva.info/controller/controller.php"
  ]
};

const FALLBACK_MINERVA_ANCHOR_DATE_UTC = Date.UTC(2026, 1, 16);
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;
const CYCLE_WEEKS = 24;
const WIKI_BASE = "https://fallout.fandom.com";
const WIKI_API_BY_LANG = {
  en: `${WIKI_BASE}/api.php`,
  es: `${WIKI_BASE}/es/api.php`
};
const DETAIL_SECTION_TITLES = {
  en: {
    locations: ["Locations", "Location"],
    unlocks: ["Unlocks", "Unlock"]
  },
  es: {
    locations: ["Ubicaciones", "Ubicacion", "Lugares", "Lugar", "Locations", "Location"],
    unlocks: ["Desbloquea", "Desbloqueos", "Desbloqueo", "Unlocks", "Unlock"]
  }
};
const GOOGLE_TRANSLATE_BASE = "https://translate.googleapis.com/translate_a/single";
const MINERVA_DETAIL_FALLBACK_PATH = "data/minerva-detail-fallback.json";
const MINERVA_DETAIL_FALLBACK_IMAGE = "assets/images/minerva-plan-fallback.png";
const MINERVA_DETAIL_IMAGE_PRELOAD_LIMIT = 24;
const MINERVA_INFO_LOCAL_IMAGE_BASE = "assets/images/minerva-locations";
const MINERVA_INFO_REMOTE_IMAGE_BASE = "https://whereisminerva.info/assets/images";
const MINERVA_LOCATION_MAP_BY_LOCATION = {
  Foundation: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_foundation.png`,
  Crater: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_crater.png`,
  "Fort Atlas": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_atlas.png`,
  "The Whitespring": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_whitespring.jpg`
};
const MINERVA_STORE_IMAGE_BY_LOCATION = {
  Foundation: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_foundation.png`,
  Crater: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_crater.png`,
  "Fort Atlas": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_atlas.png`,
  "The Whitespring": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_whitespring.jpg`
};
const MINERVA_LOCATION_IMAGE_HINTS = [
  { token: "foundation", location: "Foundation" },
  { token: "crater", location: "Crater" },
  { token: "atlas", location: "Fort Atlas" },
  { token: "whitespring", location: "The Whitespring" }
];
const STATIC_SITE_IMAGE_PRELOAD_URLS = [
  "assets/images/appalachia-map-texture.svg",
  "assets/images/output-onlinegiftools.gif",
  "assets/images/StopVaultBoy.png",
  "assets/images/minerva-plan-fallback.png",
  "assets/images/where-is-minerva.png",
  "assets/images/minerva-route-map.svg",
  "assets/images/minerva-merchant.svg",
  "assets/images/image.png",
  ...Object.values(MINERVA_LOCATION_MAP_BY_LOCATION),
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_foundation.png`,
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_crater.png`,
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_atlas.png`,
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_whitespring.jpg`
];
const CYCLE_LOCATIONS = ["Foundation", "Crater", "Fort Atlas", "The Whitespring"];
const STORAGE_LANG_KEY = "pipboy_lang";
const STORAGE_FILES_DECISION_SEEN_PREFIX = "files_decision_seen_v1";
const PLAN_ITEM_GLYPH = "\uF246";
const GOLD_BULLION_GLYPH = "\uF400";
const SILO_SITE_GLYPHS = {
  Alpha: "\uF24B",
  Bravo: "\uF24C",
  Charlie: "\uF24D"
};
const HACK_TRIGGER_CLICKS = 1;
const HACK_TRIGGER_WINDOW_MS = 4200;
const HACK_ATTEMPTS_MAX = 4;
const HACK_COLUMN_LINE_COUNT = 16;
const HACK_DUMP_WIDTH = 12;
const HACK_WORD_COUNT = 12;
const HACK_PAIR_COUNT = 6;
const HACK_WORD_LENGTH_OPTIONS = [6, 7, 8];
const HACK_ADDRESS_LEFT_BASE = 0xf680;
const HACK_ADDRESS_RIGHT_BASE = 0xf760;
const HACK_LOG_TYPE_CHAR_MS = 6;
const HACK_LOG_TYPE_PUNCT_MS = 9;
const HACK_LOG_TYPE_GAP_MS = 4;
const TYPE_SOUND_MIN_INTERVAL_MS = 24;
const TYPE_SOUND_DURATION_SEC = 0.028;
const TYPE_SOUND_BASE_FREQ = 1180;
const TYPE_SOUND_GAIN = 0.015;
const HACK_WORD_BANK = [
  "OVERSEER",
  "VAULTTEC",
  "REACTORS",
  "PROTOCOL",
  "SECURITY",
  "CLASSIFY",
  "TERMLINK",
  "PIPELINE",
  "BUNKERED",
  "RADIANTS",
  "TRANSMIT",
  "SHELTERS",
  "FIREWALL",
  "PASSWORD",
  "WARHEADS",
  "BULLIONS",
  "INTRUDER",
  "ENCRYPTS",
  "ARCHIVES",
  "RELAYING",
  "SENTRIES",
  "RESEARCH",
  "RESPONSE",
  "VANGUARD",
  "COMMANDS",
  "TITANIUM"
];
const HACK_JUNK_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>/?";
const HACK_BRACKET_PAIRS = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["<", ">"]
];
const VIEW_HASHES = {
  intel: "#intel",
  files: "#files",
  classified: "#clasified"
};
const FILES_ACCESS_REQUEST_REASON_MAX = 1200;
const FILES_ACCESS_DECLINED_REAPPLY_MS = 7 * 24 * 60 * 60 * 1000;
const FILES_LIVE_IDENTITY_POLL_INTERVAL_MS = 5000;
const FILES_ADMIN_REQUESTS_FEEDBACK_AUTO_HIDE_MS = 5000;
const FILES_UPLOAD_FEEDBACK_AUTO_HIDE_MS = 5000;
const FILES_DISCLAIMER_ACCEPT_MIN_MS = 700;
const FILES_DISCLAIMER_ACCEPT_FADE_MS = 280;
const DISCORD_AUTH_POPUP_WINDOW_NAME = "fallout_codex_discord_auth";
const DISCORD_AUTH_POPUP_PATH = "/auth/discord?popup=1";
const DISCORD_AUTH_POPUP_WIDTH = 540;
const DISCORD_AUTH_POPUP_HEIGHT = 760;
const DISCORD_AUTH_POPUP_POLL_INTERVAL_MS = 450;
const DISCORD_AUTH_POST_MESSAGE_TYPE = "fallout-codex:discord-auth";

let filesLiveIdentityPollTimer = null;
let filesLiveIdentityPollInFlight = false;
let filesAdminRequestsFeedbackTimer = null;
let filesUploadFeedbackTimer = null;
let filesDisclaimerAcceptTransitionTimer = null;
let discordAuthPopupWindow = null;
let discordAuthPopupPollTimer = null;

const STRINGS = {
  en: {
    title_doc: "Fallout Codex | Pip-Boy Terminal",
    micro_text: "ROBCO INDUSTRIES (TM) TERMLINK V2.6",
    main_title: "PIP-BOY INTEL TERMINAL",
    tab_status: "FILES",
    tab_intel: "INTEL",
    tab_data: "DATA",
    discord_bot_invite_label: "DISCORD BOT",
    discord_bot_invite_hint: "ADD TO SERVER",
    discord_bot_invite_title: "Invite the Fallout Codex Discord bot to your server",
    discord_bot_modal_badge: "DISCORD BOT RELAY",
    discord_bot_modal_title: "DEPLOY BOT TO YOUR SERVER",
    discord_bot_modal_body: "Add the Fallout Codex bot to your Discord server to receive live silo code alerts, Minerva sale intel, and future broadcast updates.",
    discord_bot_modal_cancel: "CANCEL",
    discord_bot_modal_confirm: "OPEN DISCORD INVITE",
    files_main_title: "PIP-BOY FILE SYSTEM ACCESS",
    files_unauthorized_title: "UNAUTHORIZED ACCESS TO FILE SYSTEM",
    files_unauthorized_subtitle: "IDENTITY VERIFICATION REQUIRED",
    files_restricted_browser_title: "RESTRICTED ARCHIVE",
    files_restricted_badge: "RESTRICTED ACCOUNT",
    files_restricted_incident: "INCIDENT {code}",
    files_restricted_title: "ARCHIVE ACCESS IS CURRENTLY BLOCKED",
    files_restricted_subtitle: "This account is authenticated but not approved for file index access.",
    files_restricted_subtitle_declined_reason: "This account request was declined. Admin reason: {reason}",
    files_restricted_identity_label: "Callsign",
    files_restricted_discord_label: "Discord ID",
    files_restricted_clearance_label: "Clearance",
    files_restricted_status_label: "Gate status",
    files_restricted_time_label: "Checkpoint time",
    files_restricted_status_none: "No request submitted",
    files_restricted_status_pending: "Awaiting admin approval",
    files_restricted_status_approved: "Approved",
    files_restricted_status_declined: "Declined",
    files_restricted_status_value: "Awaiting admin approval",
    files_restricted_reason_label: "Why do you need access?",
    files_restricted_reason_placeholder: "Write why you need access to the file index...",
    files_restricted_reason_hint: "This reason is required and will be sent in the access request email.",
    files_restricted_directive_title: "Access directives",
    files_restricted_directive_line_1: "Request whitelist approval from terminal admin.",
    files_restricted_directive_line_2: "Keep this session open and re-run clearance check.",
    files_restricted_directive_line_3: "Or log out and sign in with an authorized account.",
    files_restricted_retry_button: "REQUEST ACCESS",
    files_restricted_request_button_pending: "REQUEST PENDING",
    files_restricted_request_button_busy: "SENDING REQUEST...",
    files_restricted_request_success: "Access request sent. An admin will review your account.",
    files_restricted_request_error: "Unable to send access request. Try again in a moment.",
    files_restricted_request_rate_limited: "Request already sent recently. Please wait before trying again.",
    files_restricted_request_pending_error: "Your request is already pending admin review.",
    files_restricted_request_login_required: "Login is required before requesting access.",
    files_restricted_request_unavailable: "Access request service is unavailable. Contact admin directly.",
    files_restricted_reason_required: "Write why you need access before sending the request.",
    files_restricted_reason_too_long: "Your reason is too long. Keep it under 1200 characters.",
    files_restricted_request_already_authorized: "This account already has access.",
    files_restricted_request_declined_cooldown: "Application was denied. You can submit a new request after the cooldown expires.",
    files_denied_badge: "APPLICATION DENIED",
    files_denied_title: "ACCESS REQUEST DECLINED",
    files_denied_subtitle: "This request was declined by an administrator.",
    files_denied_subtitle_with_reason: "This request was declined by an administrator. Reason: {reason}",
    files_denied_reason_label: "Decline reason",
    files_denied_countdown_label: "Reapply cooldown",
    files_denied_next_window_label: "Next request window",
    files_denied_status_label: "Application status",
    files_denied_status_value: "Denied",
    files_denied_countdown_ready: "Cooldown finished. You can apply again now.",
    files_denied_directive_title: "Next steps",
    files_denied_directive_line_1: "Wait until the cooldown reaches zero.",
    files_denied_directive_line_2: "Then reopen this panel and submit a new reason.",
    files_denied_directive_line_3: "Or log out and return later.",
    files_denied_directive_line_4: "Reapplying after cooldown does not guarantee approval. You may be declined again.",
    files_decision_badge_aria_label: "Application decision available",
    files_disclaimer_gate_browser_title: "DISCLAIMER REVIEW",
    files_disclaimer_gate_badge: "DISCLAIMER REQUIRED",
    files_disclaimer_gate_title: "YOUR REQUEST WAS APPROVED, BUT BEFORE ACCESSING THE FILE INDEX, REVIEW THIS DISCLAIMER",
    files_disclaimer_gate_intro: "If you do not agree, access to the file index will remain blocked.",
    files_disclaimer_gate_agree_button: "I AGREE",
    files_disclaimer_gate_decline_button: "I DO NOT AGREE",
    files_disclaimer_gate_agree_busy: "SAVING...",
    files_disclaimer_gate_decline_busy: "SAVING...",
    files_disclaimer_gate_declined_badge: "DISCLAIMER DECLINED",
    files_disclaimer_gate_declined_title: "FILE INDEX ACCESS BLOCKED",
    files_disclaimer_gate_declined_message: "You did not agree to the disclaimer, so access remains blocked. If you believe this was an error, contact us below and explain what happened so we can reevaluate your application.",
    files_disclaimer_gate_contact_button: "CONTACT US",
    files_disclaimer_gate_contact_title: "REQUEST REEVALUATION",
    files_disclaimer_gate_contact_hint: "Explain why this should be reviewed again. Your message will be sent to the admin team by email.",
    files_disclaimer_gate_contact_label: "Explanation",
    files_disclaimer_gate_contact_placeholder: "Describe what happened and why your application should be reevaluated...",
    files_disclaimer_gate_contact_send_button: "SEND REQUEST",
    files_disclaimer_gate_contact_cancel_button: "BACK",
    files_disclaimer_gate_contact_send_busy: "SENDING...",
    files_disclaimer_gate_contact_required: "Write an explanation before sending your request.",
    files_disclaimer_gate_contact_too_long: "Your explanation is too long. Keep it under 1200 characters.",
    files_disclaimer_gate_contact_pending: "A reevaluation request is already pending review.",
    files_disclaimer_gate_contact_success: "Your reevaluation request was sent. We will review it and contact you if needed.",
    files_disclaimer_gate_contact_error: "Unable to send your reevaluation request right now.",
    files_disclaimer_gate_contact_unavailable: "Reevaluation request service is unavailable. Please try again later.",
    files_disclaimer_gate_accept_loading: "Finalizing authorization. Loading file index...",
    files_disclaimer_gate_error: "Unable to save your disclaimer decision right now.",
    files_unauthorized_badge: "LOCKDOWN PROTOCOL",
    files_unauthorized_kicker: "Archive index remains sealed until terminal identity is validated.",
    files_unauthorized_state_label: "Identity state",
    files_unauthorized_state_value: "Unverified session",
    files_unauthorized_gate_label: "Gate control",
    files_unauthorized_gate_value: "Biometric handshake required",
    files_unauthorized_trace_label: "Intrusion trace",
    files_unauthorized_trace_value: "Active monitoring",
    files_unauthorized_directive_title: "Recovery directives",
    files_unauthorized_directive_line_1: "Log in with Discord and submit an access application.",
    files_unauthorized_directive_line_2: "Your request will be reviewed and approved or declined by an admin.",
    files_unauthorized_directive_line_3: "If declined, wait for cooldown expiry and apply again.",
    files_login_button: "LOGIN WITH DISCORD",
    files_logout_button: "LOGOUT",
    files_not_authorized_message: "Sorry, you are not authorized to view the file index.",
    files_server_required_message: "Server required: open via http://localhost:3000 (or your deployed URL), not file://.",
    files_upload_button: "UPLOAD FILE",
    files_download_button: "DOWNLOAD FILE",
    files_empty_state: "No files available.",
    files_back_to_index_button: "BACK TO INDEX",
    files_search_label: "Search File",
    files_search_placeholder: "Type file name...",
    files_search_hint: "Filter files by name, type, group, description, or uploader.",
    files_search_toggle_open: "SEARCH",
    files_search_toggle_close: "CLOSE",
    files_search_toggle_open_label: "Open file search",
    files_search_toggle_close_label: "Close file search",
    files_group_manager_toggle_open: "GROUPS",
    files_group_manager_toggle_close: "CLOSE",
    files_group_manager_toggle_open_label: "Open group manager",
    files_group_manager_toggle_close_label: "Close group manager",
    files_search_results_count: "Matches: {n}",
    files_search_prompt: "Enter a file name to search the index.",
    files_search_no_results: "No matching file found.",
    files_search_open_file: "OPEN FILE",
    files_profile_title: "SESSION PROFILE",
    files_session_user_label: "CALLSIGN",
    files_session_id_label: "DISCORD ID",
    files_session_clearance_label: "CLEARANCE",
    files_session_state_label: "SESSION STATE",
    files_session_state_online: "LINK ESTABLISHED",
    files_session_state_pending: "REQUEST PENDING",
    files_session_state_approved: "REQUEST APPROVED",
    files_session_state_declined: "REQUEST DECLINED",
    files_session_badge_authorized: "AUTHORIZED",
    files_session_badge_admin: "ADMIN",
    files_session_badge_unauthorized: "UNAUTHORIZED",
    files_session_clearance_authorized: "AUTHORIZED USER",
    files_session_clearance_admin: "ADMINISTRATOR",
    files_session_clearance_unauthorized: "UNAUTHORIZED USER",
    files_admin_tools_title: "ADMIN TOOLS",
    files_admin_modal_close: "CLOSE",
    files_admin_console_title: "ADMIN CONSOLE",
    files_admin_requests_title: "ACCESS CONTROL",
    files_admin_requests_pending_badge: "{n} pending",
    files_admin_requests_hint: "Search authorized users and pending requests. Approve, deny, or remove access in real time.",
    files_admin_requests_search_label: "Search",
    files_admin_requests_search_placeholder: "Search by nick, username, Discord ID, or email...",
    files_admin_requests_filter_label: "Filter",
    files_admin_requests_filter_pending: "Pending",
    files_admin_requests_filter_approved: "Approved",
    files_admin_requests_filter_declined: "Declined",
    files_admin_requests_filter_authorized: "Authorized",
    files_admin_requests_filter_all: "All",
    files_admin_requests_refresh_button: "REFRESH",
    files_admin_requests_loading: "Loading access requests...",
    files_admin_requests_empty: "No matching users found.",
    files_admin_requests_status_pending: "Pending",
    files_admin_requests_status_approved: "Approved",
    files_admin_requests_status_declined: "Declined",
    files_admin_requests_source_allowlist: "ALLOWLIST",
    files_admin_requests_source_request: "REQUEST",
    files_admin_requests_meta_requested: "Requested",
    files_admin_requests_meta_decided: "Decided",
    files_admin_requests_meta_reason: "Reason",
    files_admin_requests_meta_decline_reason: "Decline reason",
    files_admin_requests_meta_email: "Email",
    files_admin_requests_action_approve: "APPROVE",
    files_admin_requests_action_deny: "DENY",
    files_admin_requests_action_deny_confirm: "CONFIRM DENY",
    files_admin_requests_action_deny_cancel: "CANCEL",
    files_admin_requests_action_unauthorize: "UNAUTHORIZE",
    files_admin_requests_action_allow_reapply: "ALLOW REAPPLY",
    files_admin_requests_action_busy: "PROCESSING...",
    files_admin_requests_action_approve_success: "Request approved.",
    files_admin_requests_action_deny_success: "Request denied.",
    files_admin_requests_action_unauthorize_success: "User access removed.",
    files_admin_requests_action_allow_reapply_success: "User can apply again now.",
    files_admin_requests_action_decline_reason_label: "Decline reason (optional)",
    files_admin_requests_action_decline_reason_placeholder: "Why this request is being denied...",
    files_admin_requests_action_decline_reason_prompt: "Optional decline reason (shown to user). Leave blank for no reason.",
    files_admin_requests_action_decline_reason_too_long: "Decline reason is too long. Keep it under 1200 characters.",
    files_admin_requests_error_generic: "Unable to process this action right now.",
    files_admin_requests_error_allowlist: "This user is in ALLOWED_DISCORD_IDS and cannot be unauthorized here.",
    files_bot_admin_modal_title: "BOT CONTROL",
    files_bot_admin_modal_badge: "DISCORD BOT OPS",
    files_bot_admin_modal_hint: "Review live relay telemetry, inspect every Discord server the bot is in, and remove it from any server you do not want to support anymore.",
    files_bot_admin_fab_label: "BOT OPS",
    files_bot_admin_fab_hint: "MANAGE RELAY",
    files_bot_admin_refresh_button: "REFRESH DATA",
    files_bot_admin_refresh_button_busy: "REFRESHING...",
    files_bot_admin_sync_button: "SYNC COMMANDS",
    files_bot_admin_sync_button_busy: "SYNCING...",
    files_bot_admin_invite_button: "OPEN INVITE",
    files_bot_admin_meta_loading: "Awaiting live bot snapshot...",
    files_bot_admin_meta_offline: "Bot worker is offline. Waiting for it to come back online...",
    files_bot_admin_meta_starting: "Bot relay is starting. Snapshot updates will appear once Discord is ready.",
    files_bot_admin_meta_ready: "{tag} | Snapshot {time}",
    files_bot_admin_summary_status: "Status",
    files_bot_admin_summary_servers: "Servers",
    files_bot_admin_summary_users: "Users",
    files_bot_admin_summary_channels: "Relay channels",
    files_bot_admin_status_online: "ONLINE",
    files_bot_admin_status_starting: "STARTING",
    files_bot_admin_status_offline: "OFFLINE",
    files_bot_admin_search_label: "Server search",
    files_bot_admin_search_placeholder: "Search by server name, id, locale, or owner...",
    files_bot_admin_loading: "Loading live bot telemetry...",
    files_bot_admin_worker_offline: "Bot is currently offline. Waiting for the worker to come back online...",
    files_bot_admin_unavailable: "Bot control is unavailable. Configure the bot admin bridge on the server and try again.",
    files_bot_admin_empty: "No servers matched this search.",
    files_bot_admin_server_users: "Users",
    files_bot_admin_server_joined: "Joined",
    files_bot_admin_server_owner: "Owner",
    files_bot_admin_server_language: "Bot language",
    files_bot_admin_server_locale: "Locale",
    files_bot_admin_server_subscriptions: "Subscribed channels",
    files_bot_admin_server_no_subscriptions: "No relay channels are configured for this server yet.",
    files_bot_admin_server_channels_count: "{n} configured",
    files_bot_admin_server_back_to_list: "BACK TO LIST",
    files_bot_admin_server_action_welcome: "SEND WELCOME",
    files_bot_admin_server_action_leave: "REMOVE BOT",
    files_bot_admin_server_action_busy: "PROCESSING...",
    files_bot_admin_feed_both: "Silos + Minerva",
    files_bot_admin_feed_silos: "Silo Codes",
    files_bot_admin_feed_minerva: "Minerva",
    files_bot_admin_sync_success: "Slash commands synced.",
    files_bot_admin_welcome_success: "Welcome message sent to {server}.",
    files_bot_admin_leave_success: "Bot removed from {server}.",
    files_bot_admin_leave_confirm: "Remove the bot from {server}? This makes the bot leave that Discord server immediately.",
    files_bot_admin_leave_modal_badge: "BOT SAFEGUARD",
    files_bot_admin_leave_modal_title: "REMOVE BOT",
    files_bot_admin_leave_modal_cancel: "CANCEL",
    files_bot_admin_leave_modal_confirm: "REMOVE NOW",
    files_bot_admin_invite_unavailable: "Set BOT_INVITE_LINK to open the invite from this panel.",
    files_file_index_title: "FILE INDEX",
    files_upload_file_label: "File",
    files_upload_image_label: "Image",
    files_upload_group_label: "Group",
    files_upload_group_placeholder: "Optional group...",
    files_upload_description_label: "Description",
    files_upload_description_placeholder: "Optional dossier note...",
    files_upload_success: "Upload complete.",
    files_upload_error: "Upload failed.",
    files_upload_missing_file: "Select a file before upload.",
    files_edit_section_title: "EDIT FILE DETAILS",
    files_edit_description_label: "Description",
    files_edit_group_label: "Group",
    files_edit_image_label: "Description Image",
    files_edit_remove_image_label: "Remove existing image",
    files_edit_save_button: "SAVE CHANGES",
    files_edit_save_busy: "SAVING...",
    files_edit_success: "File details updated.",
    files_loading_state: "Loading file index...",
    files_delete_button: "DELETE FILE",
    files_delete_confirm: "Delete this file from storage?",
    files_delete_modal_title: "CONFIRM FILE PURGE",
    files_delete_modal_body: "Delete file \"{name}\" from secure storage? This action cannot be undone.",
    files_delete_modal_cancel: "CANCEL",
    files_delete_modal_confirm: "DELETE FILE",
    files_delete_success: "File deleted.",
    files_delete_error: "Unable to delete file.",
    files_name_label: "File Name",
    files_type_label: "Type",
    files_size_label: "Size",
    files_uploaded_label: "Uploaded",
    files_group_label: "Group",
    files_group_default: "UNGROUPED",
    files_group_count: "{n} file(s)",
    files_group_open_button: "OPEN GROUP",
    files_group_rename_button_label: "Rename group {group}",
    files_group_rename_modal_title: "RENAME GROUP",
    files_group_rename_modal_body: "Update this group label for all files in \"{group}\".",
    files_group_rename_modal_label: "Group name",
    files_group_rename_modal_placeholder: "New group name...",
    files_group_rename_modal_cancel: "CANCEL",
    files_group_rename_modal_confirm: "SAVE GROUP",
    files_group_rename_modal_confirm_busy: "SAVING...",
    files_group_rename_error_required: "Enter a new group name.",
    files_group_rename_success: "Group renamed to \"{group}\".",
    files_disclaimer_button: "DISCLAIMER",
    files_disclaimer_modal_title: "DISCLAIMER",
    files_disclaimer_modal_body_1: "By using any files or modifications available through this site, you acknowledge that mod use in online games may violate game policies and can result in account suspension or permanent bans.",
    files_disclaimer_modal_body_2: "You are solely responsible for all actions taken on your account. The website owner and team assume no liability for account penalties, losses, or any consequences related to the use of these files or mods.",
    files_disclaimer_modal_close: "CLOSE",
    files_groups_back_button: "ALL GROUPS",
    files_group_manager_title: "GROUP MANAGER",
    files_group_manager_active_group: "Group: {group}",
    files_group_manager_selected_count: "{n}/{total} selected",
    files_group_manager_placeholder: "Create or pick group...",
    files_group_manager_suggest_placeholder: "Select existing group...",
    files_group_manager_select_group_first: "Open a group first to assign files.",
    files_group_manager_assign_button: "SAVE GROUP",
    files_group_manager_assign_busy: "SAVING...",
    files_group_manager_remove_button: "REMOVE FROM GROUP",
    files_group_manager_remove_busy: "REMOVING...",
    files_group_manager_select_all_button: "SELECT ALL",
    files_group_manager_clear_button: "CLEAR",
    files_group_manager_select_file_label: "Select for group",
    files_group_manager_mode_hint: "Choose a target group, select files from the list, and save.",
    files_group_manager_no_files: "No files available to manage.",
    files_group_manager_status_current: "Current group: {group}",
    files_group_manager_status_in_target: "Already in selected group",
    files_group_manager_status_other: "In another group: {group}",
    files_group_manager_status_none: "No group assigned",
    files_group_manager_error_group_required: "Enter a group name first.",
    files_group_manager_error_select_files: "Select at least one file.",
    files_group_manager_error_update: "Unable to update selected files.",
    files_group_manager_success: "{n} file(s) moved to \"{group}\".",
    files_group_manager_remove_success: "{n} file(s) removed from group.",
    files_rename_button: "RENAME",
    files_rename_placeholder: "Display name...",
    files_rename_save_button: "SAVE NAME",
    files_rename_cancel_button: "CANCEL",
    files_rename_busy: "SAVING...",
    files_rename_success: "Display name updated.",
    files_description_label: "Description",
    files_uploader_label: "Uploaded By",
    files_unknown_value: "--",
    lang_label: "LANG",
    label_utc: "LOCAL TIME",
    label_last_sync: "LAST SYNC",
    label_data_link: "DATA LINK",
    refresh_button: "MANUAL SYNC",
    silo_title: "SILO CODES",
    silo_hint: "Weekly reset target: Thursday 00:00 UTC",
    silo_source_prefix: "Source:",
    silo_source_suffix: "via Fallout Codex relay",
    silo_dossier_eyebrow: "NUCLEAR COMMAND INTEL",
    silo_dossier_title: "APPALACHIAN SILO STATUS",
    silo_dossier_loading: "Loading silo command telemetry...",
    silo_dossier_summary_live: "Launch access keys are stable. Review each silo before authorizing a strike.",
    silo_dossier_summary_expired: "Current launch keys are flagged as expired. Await the next weekly refresh before using a silo.",
    silo_dossier_summary_error: "Live silo telemetry is unavailable. Review the last known reset window and try syncing again.",
    silo_dossier_reset_label: "RESET TARGET",
    silo_dossier_countdown_label: "COUNTDOWN",
    silo_dossier_status_label: "STATUS",
    silo_dossier_signal_label: "UPLINK",
    silo_dossier_status_live: "CODES VALID",
    silo_dossier_status_expired: "AWAITING REFRESH",
    silo_dossier_status_error: "SIGNAL LOST",
    silo_dossier_briefing_live: "All three silos are broadcasting valid launch key fragments. Cross-check the code you need, then return to terminal when ready.",
    silo_dossier_briefing_expired: "Upstream reports the current keyset has expired. Hold launch prep until fresh authorization data clears the relay.",
    silo_dossier_briefing_error: "The relay could not confirm silo telemetry. Use manual sync or verify upstream data from NukaCrypt.",
    silo_dossier_open_source: "OPEN NUKACRYPT",
    silo_dossier_close: "RETURN TO FALLOUT CODEX",
    silo_dossier_back: "GO BACK",
    minerva_title: "MINERVA INTEL",
    minerva_scanning: "Scanning trade routes...",
    minerva_location_label: "Location",
    minerva_list_label: "List",
    minerva_window_label: "Window",
    minerva_inventory_title: "Inventory + Price",
    table_item_header: "Plan / Item",
    table_price_header: "Gold Bullion",
    minerva_awaiting: "Awaiting response...",
    minerva_source_prefix: "Sources:",
    minerva_source_suffix: "+ local fallback list",
    minerva_location_view_title: "MINERVA LOCATION TRACKER",
    minerva_location_view_back: "RETURN TO INTEL",
    minerva_location_map_label: "Known Route Map",
    minerva_location_map_prev: "Previous image",
    minerva_location_map_next: "Next image",
    minerva_location_status_active: "Minerva is currently at {location}.",
    minerva_location_status_inactive: "Minerva will arrive at {location}.",
    minerva_location_status_unknown: "Location data unavailable.",
    minerva_location_arrives: "Arrives",
    minerva_location_leaves: "Leaves",
    minerva_location_countdown_arrives: "Arrives in",
    minerva_location_countdown_leaves: "Leaves in",
    minerva_location_countdown_now: "Now",
    minerva_detail_back: "RETURN TO LIST",
    minerva_detail_open_source: "OPEN SOURCE PAGE",
    minerva_detail_loading: "Loading plan intel...",
    minerva_detail_error: "Unable to load plan details right now.",
    minerva_detail_where_label: "Where Else To Get It",
    minerva_detail_unlocks_label: "What This Plan Unlocks",
    minerva_detail_no_other_sources: "No additional source found besides Minerva.",
    minerva_detail_no_unlocks: "Unlock information is unavailable.",
    footer_text: "Community data only. Not affiliated with Bethesda.",
    signal_booting: "BOOTING",
    signal_syncing: "SYNCING",
    signal_online: "ONLINE",
    signal_online_fallback: "ONLINE",
    signal_partial: "PARTIAL",
    signal_offline: "OFFLINE",
    reset_in: "Reset in: {d}d {h}h {m}m {s}s ({ts})",
    silo_expired: "Source reports these codes as expired and awaiting weekly refresh.",
    silo_error: "Unable to fetch silo codes right now.",
    minerva_error_summary: "Unable to fetch Minerva data right now.",
    minerva_error_items: "No Minerva data available.",
    minerva_no_items: "No Minerva items could be resolved.",
    minerva_active_at: "Minerva is currently active at {location}.",
    minerva_transit_to: "Minerva is in transit. Next stop: {location}.",
    next_change: "Next change: {time}",
    window_arrives: "Arrives: {time}",
    window_leaves: "Leaves: {time}",
    window_arrives_short: "ARRIVES",
    window_leaves_short: "LEAVES",
    window_unknown: "Window unavailable.",
    list_value: "List {n}",
    boot_title: "PIP-BOY 3000 MK IV",
    boot_subtitle: "VAULT-TEC PERSONAL INFORMATION PROCESSOR",
    boot_line_1: "Initializing transceiver link...",
    boot_line_2: "Loading Wasteland intelligence feed...",
    boot_line_3: "Calibrating radiation-resistant display...",
    boot_ready: "SYSTEM READY",
    boot_hint_initializing: "Initializing...",
    sync_title: "SYNCING FIELD DATA...",
    classified_loading_title: "LOADING CLASSIFIED ARCHIVES...",
    hack_title: "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
    hack_subtitle: "UNAUTHORIZED TERMINAL ACCESS",
    hack_attempts_label: "ATTEMPTS LEFT:",
    hack_enter_password: "ENTER PASSWORD NOW",
    hack_pick_password: "Pick a password.",
    hack_abort: "ABORT",
    hack_retry: "RETRY",
    hack_open_files: "OPEN FILES",
    hack_log_boot: "ROBCO SECURITY ONLINE.",
    hack_log_ready: "PASSWORD REQUIRED.",
    hack_entry_denied: "ENTRY DENIED.",
    hack_likeness: "LIKENESS={n}/{total}",
    hack_exact_match: "EXACT MATCH!",
    hack_dud_removed: "DUD REMOVED.",
    hack_allowance_replenished: "ALLOWANCE REPLENISHED.",
    hack_access_granted: "ACCESS GRANTED. CLASSIFIED ARCHIVE UNLOCKED.",
    hack_accessing_archive: "ACCESSING ARCHIVE...",
    hack_lockout: "TERMINAL LOCKED. RETRY INTRUSION.",
    classified_main_title: "PIP-BOY CLASSIFIED ARCHIVE",
    classified_title: "[CLASSIFIED] ENCLAVE RELAY ARCHIVE",
    classified_warning: "Unauthorized eyes detected. This archive is restricted to overseer-level clearances.",
    classified_back: "RETURN TO INTEL",
    classified_card1_title: "FILE: OPERATION CINDER TRACE",
    classified_card1_body: "Satellite telemetry indicates repeated launch prep drills near Appalachian silos. Civilian chatter appears unsuspicious.",
    classified_card2_title: "FILE: MINERVA CONTACT CHAIN",
    classified_card2_body: "Merchant route traffic intersects former responder relay nodes. Trade schedule may hide encrypted dead drops.",
    classified_card3_title: "FILE: VAULT-TEC BLACKLIST",
    classified_card3_body: "Access key fragments recovered from deprecated Pip-Boy firmware. Any complete key grants archive-level command injection.",
    classified_minerva_title: "FILE: MINERVA MASTER LISTS",
    classified_minerva_hint: "Decrypted vendor rotation archive. Includes every known list and bullion cost.",
    classified_minerva_empty: "Minerva list archive unavailable.",
    classified_search_label: "Search Item",
    classified_search_placeholder: "Type item name (e.g. gauss minigun)",
    classified_search_hint: "Find the next Minerva sale window for any known item.",
    classified_search_toggle_open: "SEARCH",
    classified_search_toggle_close: "CLOSE",
    classified_search_toggle_open_label: "Open search mode",
    classified_search_toggle_close_label: "Close search mode",
    classified_search_prompt: "Enter an item name to search the archive.",
    classified_search_no_results: "No matching item found in the archive.",
    classified_search_results_count: "Matches: {n}",
    classified_search_item: "Item",
    classified_search_price: "Price",
    classified_search_sale: "Sale",
    classified_search_available: "Available",
    classified_search_days: "Days",
    classified_search_now: "Now",
    classified_sale_standard: "Standard Sale",
    classified_sale_big: "Big Sale",
    classified_days_value: "{n}d"
  },
  es: {
    title_doc: "Fallout Codex | Terminal Pip-Boy",
    micro_text: "ROBCO INDUSTRIES (TM) TERMLINK V2.6",
    main_title: "TERMINAL DE INTEL PIP-BOY",
    tab_status: "ARCHIVOS",
    tab_intel: "INTEL",
    tab_data: "DATOS",
    discord_bot_invite_label: "DISCORD BOT",
    discord_bot_invite_hint: "INVITAR AL SERVIDOR",
    discord_bot_invite_title: "Invita el bot de Discord de Fallout Codex a tu servidor",
    discord_bot_modal_badge: "RELAY DEL BOT DISCORD",
    discord_bot_modal_title: "DESPLEGAR BOT EN TU SERVIDOR",
    discord_bot_modal_body: "Agrega el bot de Fallout Codex a tu servidor de Discord para recibir alertas en vivo de codigos de silo, intel de ventas de Minerva y futuros avisos del relay.",
    discord_bot_modal_cancel: "CANCELAR",
    discord_bot_modal_confirm: "ABRIR INVITACION",
    files_main_title: "ACCESO AL SISTEMA DE ARCHIVOS PIP-BOY",
    files_unauthorized_title: "ACCESO NO AUTORIZADO AL SISTEMA DE ARCHIVOS",
    files_unauthorized_subtitle: "SE REQUIERE VERIFICACION DE IDENTIDAD",
    files_restricted_browser_title: "ARCHIVO RESTRINGIDO",
    files_restricted_badge: "CUENTA RESTRINGIDA",
    files_restricted_incident: "INCIDENTE {code}",
    files_restricted_title: "EL ACCESO AL ARCHIVO ESTA BLOQUEADO",
    files_restricted_subtitle: "Esta cuenta esta autenticada pero no aprobada para el indice de archivos.",
    files_restricted_subtitle_declined_reason: "Esta solicitud fue rechazada. Motivo del admin: {reason}",
    files_restricted_identity_label: "Identidad",
    files_restricted_discord_label: "Discord ID",
    files_restricted_clearance_label: "Nivel",
    files_restricted_status_label: "Estado de compuerta",
    files_restricted_time_label: "Hora de revision",
    files_restricted_status_none: "Sin solicitud enviada",
    files_restricted_status_pending: "Esperando aprobacion de admin",
    files_restricted_status_approved: "Aprobada",
    files_restricted_status_declined: "Rechazada",
    files_restricted_status_value: "Esperando aprobacion de admin",
    files_restricted_reason_label: "Por que necesitas acceso?",
    files_restricted_reason_placeholder: "Escribe por que necesitas acceso al indice de archivos...",
    files_restricted_reason_hint: "Este motivo es obligatorio y se enviara en el email de solicitud.",
    files_restricted_directive_title: "Directivas de acceso",
    files_restricted_directive_line_1: "Solicita aprobacion de lista blanca al admin del terminal.",
    files_restricted_directive_line_2: "Manten esta sesion abierta y reintenta la verificacion.",
    files_restricted_directive_line_3: "O cierra sesion e inicia con una cuenta autorizada.",
    files_restricted_retry_button: "SOLICITAR ACCESO",
    files_restricted_request_button_pending: "SOLICITUD PENDIENTE",
    files_restricted_request_button_busy: "ENVIANDO SOLICITUD...",
    files_restricted_request_success: "Solicitud enviada. Un admin revisara tu cuenta.",
    files_restricted_request_error: "No se pudo enviar la solicitud. Intenta de nuevo en un momento.",
    files_restricted_request_rate_limited: "Ya enviaste una solicitud recientemente. Espera antes de reintentar.",
    files_restricted_request_pending_error: "Tu solicitud ya esta pendiente de revision del admin.",
    files_restricted_request_login_required: "Debes iniciar sesion para solicitar acceso.",
    files_restricted_request_unavailable: "El servicio de solicitud no esta disponible. Contacta al admin directamente.",
    files_restricted_reason_required: "Debes escribir por que quieres acceso antes de enviar la solicitud.",
    files_restricted_reason_too_long: "Tu motivo es demasiado largo. Debe tener menos de 1200 caracteres.",
    files_restricted_request_already_authorized: "Esta cuenta ya tiene acceso.",
    files_restricted_request_declined_cooldown: "La solicitud fue rechazada. Podras enviar una nueva cuando termine el cooldown.",
    files_denied_badge: "SOLICITUD DENEGADA",
    files_denied_title: "SOLICITUD DE ACCESO RECHAZADA",
    files_denied_subtitle: "Esta solicitud fue rechazada por un administrador.",
    files_denied_subtitle_with_reason: "Esta solicitud fue rechazada por un administrador. Motivo: {reason}",
    files_denied_reason_label: "Motivo del rechazo",
    files_denied_countdown_label: "Cooldown para reintentar",
    files_denied_next_window_label: "Proxima ventana de solicitud",
    files_denied_status_label: "Estado de solicitud",
    files_denied_status_value: "Rechazada",
    files_denied_countdown_ready: "El cooldown termino. Ya puedes solicitar acceso de nuevo.",
    files_denied_directive_title: "Siguientes pasos",
    files_denied_directive_line_1: "Espera hasta que el cooldown llegue a cero.",
    files_denied_directive_line_2: "Luego vuelve a este panel y envia un nuevo motivo.",
    files_denied_directive_line_3: "O cierra sesion y regresa mas tarde.",
    files_denied_directive_line_4: "Volver a solicitar tras el cooldown no garantiza aprobacion. Podrias ser rechazado otra vez.",
    files_decision_badge_aria_label: "Hay una decision de solicitud disponible",
    files_disclaimer_gate_browser_title: "REVISION DE AVISO",
    files_disclaimer_gate_badge: "AVISO OBLIGATORIO",
    files_disclaimer_gate_title: "TU SOLICITUD HA SIDO ACEPTADA, PERO ANTES DE ACCEDER AL INDICE, REVISA ESTE AVISO",
    files_disclaimer_gate_intro: "Si no aceptas, el acceso al indice de archivos seguira bloqueado.",
    files_disclaimer_gate_agree_button: "ACEPTO",
    files_disclaimer_gate_decline_button: "NO ACEPTO",
    files_disclaimer_gate_agree_busy: "GUARDANDO...",
    files_disclaimer_gate_decline_busy: "GUARDANDO...",
    files_disclaimer_gate_declined_badge: "AVISO RECHAZADO",
    files_disclaimer_gate_declined_title: "ACCESO AL INDICE BLOQUEADO",
    files_disclaimer_gate_declined_message: "No aceptaste el aviso, por lo que el acceso sigue bloqueado. Si crees que esto fue un error, contactanos abajo y explica lo ocurrido para reevaluar tu solicitud.",
    files_disclaimer_gate_contact_button: "CONTACTAR",
    files_disclaimer_gate_contact_title: "SOLICITAR REEVALUACION",
    files_disclaimer_gate_contact_hint: "Explica por que tu caso debe revisarse otra vez. Tu mensaje se enviara por email al equipo admin.",
    files_disclaimer_gate_contact_label: "Explicacion",
    files_disclaimer_gate_contact_placeholder: "Describe que paso y por que tu solicitud deberia reevaluarse...",
    files_disclaimer_gate_contact_send_button: "ENVIAR SOLICITUD",
    files_disclaimer_gate_contact_cancel_button: "VOLVER",
    files_disclaimer_gate_contact_send_busy: "ENVIANDO...",
    files_disclaimer_gate_contact_required: "Debes escribir una explicacion antes de enviar la solicitud.",
    files_disclaimer_gate_contact_too_long: "Tu explicacion es demasiado larga. Debe tener menos de 1200 caracteres.",
    files_disclaimer_gate_contact_pending: "Ya hay una solicitud de reevaluacion pendiente de revision.",
    files_disclaimer_gate_contact_success: "Tu solicitud de reevaluacion fue enviada. La revisaremos y te contactaremos si hace falta.",
    files_disclaimer_gate_contact_error: "No se pudo enviar tu solicitud de reevaluacion en este momento.",
    files_disclaimer_gate_contact_unavailable: "El servicio de reevaluacion no esta disponible. Intenta mas tarde.",
    files_disclaimer_gate_accept_loading: "Finalizando autorizacion. Cargando indice de archivos...",
    files_disclaimer_gate_error: "No se pudo guardar tu decision del aviso en este momento.",
    files_unauthorized_badge: "PROTOCOLO DE BLOQUEO",
    files_unauthorized_kicker: "El indice del archivo permanece sellado hasta validar la identidad del terminal.",
    files_unauthorized_state_label: "Estado de identidad",
    files_unauthorized_state_value: "Sesion sin verificar",
    files_unauthorized_gate_label: "Control de compuerta",
    files_unauthorized_gate_value: "Se requiere enlace biometrico",
    files_unauthorized_trace_label: "Rastro de intrusion",
    files_unauthorized_trace_value: "Monitoreo activo",
    files_unauthorized_directive_title: "Directivas de recuperacion",
    files_unauthorized_directive_line_1: "Inicia sesion con Discord y envia una solicitud de acceso.",
    files_unauthorized_directive_line_2: "Tu solicitud sera revisada por un admin y luego aprobada o rechazada.",
    files_unauthorized_directive_line_3: "Si es rechazada, espera el cooldown y vuelve a solicitar.",
    files_login_button: "INICIAR CON DISCORD",
    files_logout_button: "CERRAR SESION",
    files_not_authorized_message: "Lo sentimos, no estas autorizado para ver la lista de archivos.",
    files_server_required_message: "Se requiere servidor: abre via http://localhost:3000 (o tu URL desplegada), no file://.",
    files_upload_button: "SUBIR ARCHIVO",
    files_download_button: "DESCARGAR ARCHIVO",
    files_empty_state: "No hay archivos disponibles.",
    files_back_to_index_button: "VOLVER AL INDICE",
    files_search_label: "Buscar Archivo",
    files_search_placeholder: "Escribe nombre del archivo...",
    files_search_hint: "Filtra archivos por nombre, tipo, grupo, descripcion o autor.",
    files_search_toggle_open: "BUSCAR",
    files_search_toggle_close: "CERRAR",
    files_search_toggle_open_label: "Abrir busqueda de archivos",
    files_search_toggle_close_label: "Cerrar busqueda de archivos",
    files_group_manager_toggle_open: "GRUPOS",
    files_group_manager_toggle_close: "CERRAR",
    files_group_manager_toggle_open_label: "Abrir gestor de grupos",
    files_group_manager_toggle_close_label: "Cerrar gestor de grupos",
    files_search_results_count: "Coincidencias: {n}",
    files_search_prompt: "Escribe un nombre para buscar en el indice.",
    files_search_no_results: "No se encontro ningun archivo coincidente.",
    files_search_open_file: "ABRIR ARCHIVO",
    files_profile_title: "PERFIL DE SESION",
    files_session_user_label: "IDENTIDAD",
    files_session_id_label: "DISCORD ID",
    files_session_clearance_label: "NIVEL",
    files_session_state_label: "ESTADO DE SESION",
    files_session_state_online: "ENLACE ESTABLECIDO",
    files_session_state_pending: "SOLICITUD PENDIENTE",
    files_session_state_approved: "SOLICITUD APROBADA",
    files_session_state_declined: "SOLICITUD RECHAZADA",
    files_session_badge_authorized: "AUTORIZADO",
    files_session_badge_admin: "ADMIN",
    files_session_badge_unauthorized: "NO AUTORIZADO",
    files_session_clearance_authorized: "USUARIO AUTORIZADO",
    files_session_clearance_admin: "ADMINISTRADOR",
    files_session_clearance_unauthorized: "USUARIO NO AUTORIZADO",
    files_admin_tools_title: "HERRAMIENTAS ADMIN",
    files_admin_modal_close: "CERRAR",
    files_admin_console_title: "CONSOLA ADMIN",
    files_admin_requests_title: "CONTROL DE ACCESO",
    files_admin_requests_pending_badge: "{n} pendientes",
    files_admin_requests_hint: "Busca usuarios autorizados y solicitudes pendientes. Aprueba, rechaza o quita acceso en tiempo real.",
    files_admin_requests_search_label: "Buscar",
    files_admin_requests_search_placeholder: "Buscar por nick, usuario, Discord ID o email...",
    files_admin_requests_filter_label: "Filtro",
    files_admin_requests_filter_pending: "Pendientes",
    files_admin_requests_filter_approved: "Aprobadas",
    files_admin_requests_filter_declined: "Rechazadas",
    files_admin_requests_filter_authorized: "Autorizados",
    files_admin_requests_filter_all: "Todas",
    files_admin_requests_refresh_button: "ACTUALIZAR",
    files_admin_requests_loading: "Cargando solicitudes de acceso...",
    files_admin_requests_empty: "No se encontraron usuarios que coincidan.",
    files_admin_requests_status_pending: "Pendiente",
    files_admin_requests_status_approved: "Aprobada",
    files_admin_requests_status_declined: "Rechazada",
    files_admin_requests_source_allowlist: "ALLOWLIST",
    files_admin_requests_source_request: "SOLICITUD",
    files_admin_requests_meta_requested: "Solicitada",
    files_admin_requests_meta_decided: "Decidida",
    files_admin_requests_meta_reason: "Motivo",
    files_admin_requests_meta_decline_reason: "Motivo de rechazo",
    files_admin_requests_meta_email: "Email",
    files_admin_requests_action_approve: "APROBAR",
    files_admin_requests_action_deny: "RECHAZAR",
    files_admin_requests_action_deny_confirm: "CONFIRMAR RECHAZO",
    files_admin_requests_action_deny_cancel: "CANCELAR",
    files_admin_requests_action_unauthorize: "QUITAR ACCESO",
    files_admin_requests_action_allow_reapply: "PERMITIR REAPLICAR",
    files_admin_requests_action_busy: "PROCESANDO...",
    files_admin_requests_action_approve_success: "Solicitud aprobada.",
    files_admin_requests_action_deny_success: "Solicitud rechazada.",
    files_admin_requests_action_unauthorize_success: "Acceso removido al usuario.",
    files_admin_requests_action_allow_reapply_success: "El usuario ya puede solicitar de nuevo.",
    files_admin_requests_action_decline_reason_label: "Motivo de rechazo (opcional)",
    files_admin_requests_action_decline_reason_placeholder: "Por que se rechaza esta solicitud...",
    files_admin_requests_action_decline_reason_prompt: "Motivo opcional del rechazo (se muestra al usuario). Dejalo vacio si no aplica.",
    files_admin_requests_action_decline_reason_too_long: "El motivo del rechazo es demasiado largo. Debe tener menos de 1200 caracteres.",
    files_admin_requests_error_generic: "No se pudo procesar esta accion ahora mismo.",
    files_admin_requests_error_allowlist: "Este usuario esta en ALLOWED_DISCORD_IDS y no se puede desautorizar aqui.",
    files_bot_admin_modal_title: "CONTROL DEL BOT",
    files_bot_admin_modal_badge: "OPERACIONES DEL BOT",
    files_bot_admin_modal_hint: "Revisa la telemetria en vivo del relay, inspecciona cada servidor de Discord donde esta el bot y quitalo de cualquier servidor que ya no quieras soportar.",
    files_bot_admin_fab_label: "BOT OPS",
    files_bot_admin_fab_hint: "GESTIONAR RELAY",
    files_bot_admin_refresh_button: "ACTUALIZAR DATOS",
    files_bot_admin_refresh_button_busy: "ACTUALIZANDO...",
    files_bot_admin_sync_button: "SINCRONIZAR COMANDOS",
    files_bot_admin_sync_button_busy: "SINCRONIZANDO...",
    files_bot_admin_invite_button: "ABRIR INVITACION",
    files_bot_admin_meta_loading: "Esperando el snapshot en vivo del bot...",
    files_bot_admin_meta_offline: "El worker del bot esta fuera de linea. Esperando a que vuelva a conectarse...",
    files_bot_admin_meta_starting: "El relay del bot se esta iniciando. El snapshot aparecera cuando Discord termine de conectarse.",
    files_bot_admin_meta_ready: "{tag} | Snapshot {time}",
    files_bot_admin_summary_status: "Estado",
    files_bot_admin_summary_servers: "Servidores",
    files_bot_admin_summary_users: "Usuarios",
    files_bot_admin_summary_channels: "Canales relay",
    files_bot_admin_status_online: "EN LINEA",
    files_bot_admin_status_starting: "INICIANDO",
    files_bot_admin_status_offline: "FUERA DE LINEA",
    files_bot_admin_search_label: "Buscar servidor",
    files_bot_admin_search_placeholder: "Busca por nombre, id, locale o owner...",
    files_bot_admin_loading: "Cargando telemetria en vivo del bot...",
    files_bot_admin_worker_offline: "El bot esta fuera de linea. Esperando a que el worker vuelva a estar en linea...",
    files_bot_admin_unavailable: "El control del bot no esta disponible. Configura el bridge admin del bot en el servidor e intenta de nuevo.",
    files_bot_admin_empty: "Ningun servidor coincide con esta busqueda.",
    files_bot_admin_server_users: "Usuarios",
    files_bot_admin_server_joined: "Ingreso",
    files_bot_admin_server_owner: "Owner",
    files_bot_admin_server_language: "Idioma del bot",
    files_bot_admin_server_locale: "Locale",
    files_bot_admin_server_subscriptions: "Canales suscritos",
    files_bot_admin_server_no_subscriptions: "Todavia no hay canales relay configurados para este servidor.",
    files_bot_admin_server_channels_count: "{n} configurados",
    files_bot_admin_server_back_to_list: "VOLVER A LA LISTA",
    files_bot_admin_server_action_welcome: "ENVIAR BIENVENIDA",
    files_bot_admin_server_action_leave: "QUITAR BOT",
    files_bot_admin_server_action_busy: "PROCESANDO...",
    files_bot_admin_feed_both: "Silos + Minerva",
    files_bot_admin_feed_silos: "Codigos de silo",
    files_bot_admin_feed_minerva: "Minerva",
    files_bot_admin_sync_success: "Los comandos slash fueron sincronizados.",
    files_bot_admin_welcome_success: "Mensaje de bienvenida enviado a {server}.",
    files_bot_admin_leave_success: "El bot fue removido de {server}.",
    files_bot_admin_leave_confirm: "Quitar el bot de {server}? Esto hace que abandone ese servidor de Discord de inmediato.",
    files_bot_admin_leave_modal_badge: "PROTOCOLO DEL BOT",
    files_bot_admin_leave_modal_title: "QUITAR BOT",
    files_bot_admin_leave_modal_cancel: "CANCELAR",
    files_bot_admin_leave_modal_confirm: "QUITAR AHORA",
    files_bot_admin_invite_unavailable: "Configura BOT_INVITE_LINK para abrir la invitacion desde este panel.",
    files_file_index_title: "INDICE DE ARCHIVOS",
    files_upload_file_label: "Archivo",
    files_upload_image_label: "Imagen",
    files_upload_group_label: "Grupo",
    files_upload_group_placeholder: "Grupo opcional...",
    files_upload_description_label: "Descripcion",
    files_upload_description_placeholder: "Nota opcional del expediente...",
    files_upload_success: "Carga completada.",
    files_upload_error: "La carga fallo.",
    files_upload_missing_file: "Selecciona un archivo antes de subirlo.",
    files_edit_section_title: "EDITAR DETALLES DEL ARCHIVO",
    files_edit_description_label: "Descripcion",
    files_edit_group_label: "Grupo",
    files_edit_image_label: "Imagen de descripcion",
    files_edit_remove_image_label: "Quitar imagen actual",
    files_edit_save_button: "GUARDAR CAMBIOS",
    files_edit_save_busy: "GUARDANDO...",
    files_edit_success: "Detalles del archivo actualizados.",
    files_loading_state: "Cargando indice de archivos...",
    files_delete_button: "ELIMINAR ARCHIVO",
    files_delete_confirm: "Eliminar este archivo del almacenamiento?",
    files_delete_modal_title: "CONFIRMAR PURGA DE ARCHIVO",
    files_delete_modal_body: "Eliminar el archivo \"{name}\" del almacenamiento seguro? Esta accion no se puede deshacer.",
    files_delete_modal_cancel: "CANCELAR",
    files_delete_modal_confirm: "ELIMINAR ARCHIVO",
    files_delete_success: "Archivo eliminado.",
    files_delete_error: "No se pudo eliminar el archivo.",
    files_name_label: "Nombre",
    files_type_label: "Tipo",
    files_size_label: "Tamano",
    files_uploaded_label: "Subido",
    files_group_label: "Grupo",
    files_group_default: "SIN GRUPO",
    files_group_count: "{n} archivo(s)",
    files_group_open_button: "ABRIR GRUPO",
    files_group_rename_button_label: "Renombrar grupo {group}",
    files_group_rename_modal_title: "RENOMBRAR GRUPO",
    files_group_rename_modal_body: "Actualiza esta etiqueta para todos los archivos en \"{group}\".",
    files_group_rename_modal_label: "Nombre del grupo",
    files_group_rename_modal_placeholder: "Nuevo nombre de grupo...",
    files_group_rename_modal_cancel: "CANCELAR",
    files_group_rename_modal_confirm: "GUARDAR GRUPO",
    files_group_rename_modal_confirm_busy: "GUARDANDO...",
    files_group_rename_error_required: "Escribe un nuevo nombre de grupo.",
    files_group_rename_success: "Grupo renombrado a \"{group}\".",
    files_disclaimer_button: "AVISO",
    files_disclaimer_modal_title: "DESCARGO DE RESPONSABILIDAD",
    files_disclaimer_modal_body_1: "Al usar cualquier archivo o modificacion disponible en este sitio, reconoces que el uso de mods en juegos en linea puede infringir politicas del juego y puede causar suspension o baneo permanente de la cuenta.",
    files_disclaimer_modal_body_2: "Eres el unico responsable de las acciones realizadas en tu cuenta. El propietario del sitio y su equipo no asumen responsabilidad por sanciones, perdidas o cualquier consecuencia relacionada con el uso de estos archivos o mods.",
    files_disclaimer_modal_close: "CERRAR",
    files_groups_back_button: "TODOS LOS GRUPOS",
    files_group_manager_title: "GESTOR DE GRUPOS",
    files_group_manager_active_group: "Grupo: {group}",
    files_group_manager_selected_count: "{n}/{total} seleccionados",
    files_group_manager_placeholder: "Crear o elegir grupo...",
    files_group_manager_suggest_placeholder: "Elegir grupo existente...",
    files_group_manager_select_group_first: "Abre un grupo primero para asignar archivos.",
    files_group_manager_assign_button: "GUARDAR GRUPO",
    files_group_manager_assign_busy: "GUARDANDO...",
    files_group_manager_remove_button: "QUITAR DEL GRUPO",
    files_group_manager_remove_busy: "QUITANDO...",
    files_group_manager_select_all_button: "SELECCIONAR TODO",
    files_group_manager_clear_button: "LIMPIAR",
    files_group_manager_select_file_label: "Seleccionar para grupo",
    files_group_manager_mode_hint: "Elige un grupo destino, selecciona archivos de la lista y guarda.",
    files_group_manager_no_files: "No hay archivos para gestionar.",
    files_group_manager_status_current: "Grupo actual: {group}",
    files_group_manager_status_in_target: "Ya esta en el grupo seleccionado",
    files_group_manager_status_other: "En otro grupo: {group}",
    files_group_manager_status_none: "Sin grupo asignado",
    files_group_manager_error_group_required: "Escribe un nombre de grupo.",
    files_group_manager_error_select_files: "Selecciona al menos un archivo.",
    files_group_manager_error_update: "No se pudieron actualizar los archivos seleccionados.",
    files_group_manager_success: "{n} archivo(s) movidos a \"{group}\".",
    files_group_manager_remove_success: "{n} archivo(s) quitados del grupo.",
    files_rename_button: "RENOMBRAR",
    files_rename_placeholder: "Nombre visible...",
    files_rename_save_button: "GUARDAR NOMBRE",
    files_rename_cancel_button: "CANCELAR",
    files_rename_busy: "GUARDANDO...",
    files_rename_success: "Nombre visible actualizado.",
    files_description_label: "Descripcion",
    files_uploader_label: "Subido Por",
    files_unknown_value: "--",
    lang_label: "IDIOMA",
    label_utc: "HORA LOCAL",
    label_last_sync: "ULTIMA SINCRONIZACION",
    label_data_link: "ENLACE DE DATOS",
    refresh_button: "SINCRONIZAR",
    silo_title: "CODIGOS DE SILO",
    silo_hint: "Reinicio semanal objetivo: jueves 00:00 UTC",
    silo_source_prefix: "Fuente:",
    silo_source_suffix: "por relay de Fallout Codex",
    silo_dossier_eyebrow: "INTEL DE COMANDO NUCLEAR",
    silo_dossier_title: "ESTADO DE LOS SILOS DE APPALACHIA",
    silo_dossier_loading: "Cargando telemetria de comando de los silos...",
    silo_dossier_summary_live: "Las claves de lanzamiento estan estables. Revisa cada silo antes de autorizar un ataque.",
    silo_dossier_summary_expired: "Las claves de lanzamiento actuales estan marcadas como vencidas. Espera el proximo reinicio semanal antes de usar un silo.",
    silo_dossier_summary_error: "La telemetria en vivo de los silos no esta disponible. Revisa la ultima ventana conocida y sincroniza otra vez.",
    silo_dossier_reset_label: "OBJETIVO DE REINICIO",
    silo_dossier_countdown_label: "CUENTA REGRESIVA",
    silo_dossier_status_label: "ESTADO",
    silo_dossier_signal_label: "ENLACE",
    silo_dossier_status_live: "CODIGOS VALIDOS",
    silo_dossier_status_expired: "ESPERANDO REINICIO",
    silo_dossier_status_error: "SENAL PERDIDA",
    silo_dossier_briefing_live: "Los tres silos estan transmitiendo fragmentos validos de claves de lanzamiento. Verifica el codigo que necesitas y luego vuelve a la terminal.",
    silo_dossier_briefing_expired: "La fuente indica que el set actual de claves ha vencido. Deten la preparacion del lanzamiento hasta que lleguen datos nuevos.",
    silo_dossier_briefing_error: "El relay no pudo confirmar la telemetria del silo. Usa sincronizacion manual o verifica la fuente en NukaCrypt.",
    silo_dossier_open_source: "ABRIR NUKACRYPT",
    silo_dossier_close: "VOLVER A FALLOUT CODEX",
    silo_dossier_back: "REGRESAR",
    minerva_title: "INTEL DE MINERVA",
    minerva_scanning: "Escaneando rutas comerciales...",
    minerva_location_label: "Ubicacion",
    minerva_list_label: "Lista",
    minerva_window_label: "Ventana",
    minerva_inventory_title: "Inventario + Precio",
    table_item_header: "Plano / Item",
    table_price_header: "Oro en lingotes",
    minerva_awaiting: "Esperando respuesta...",
    minerva_source_prefix: "Fuentes:",
    minerva_source_suffix: "+ lista local de respaldo",
    minerva_location_view_title: "RASTREADOR DE UBICACION DE MINERVA",
    minerva_location_view_back: "VOLVER A INTEL",
    minerva_location_map_label: "MAPA DE RUTA CONOCIDA",
    minerva_location_map_prev: "Imagen anterior",
    minerva_location_map_next: "Imagen siguiente",
    minerva_location_status_active: "Minerva esta actualmente en {location}.",
    minerva_location_status_inactive: "Minerva llegara a {location}.",
    minerva_location_status_unknown: "No hay datos de ubicacion disponibles.",
    minerva_location_arrives: "Llega",
    minerva_location_leaves: "Se va",
    minerva_location_countdown_arrives: "Llega en",
    minerva_location_countdown_leaves: "Se va en",
    minerva_location_countdown_now: "Ahora",
    minerva_detail_back: "VOLVER A LISTA",
    minerva_detail_open_source: "ABRIR FUENTE",
    minerva_detail_loading: "Cargando intel del plano...",
    minerva_detail_error: "No se pudieron cargar los detalles del plano.",
    minerva_detail_where_label: "Donde Conseguirlo Ademas",
    minerva_detail_unlocks_label: "Que Desbloquea Este Plano",
    minerva_detail_no_other_sources: "No hay otra fuente ademas de Minerva.",
    minerva_detail_no_unlocks: "No hay informacion de desbloqueo disponible.",
    footer_text: "Solo datos de la comunidad. No afiliado con Bethesda.",
    signal_booting: "INICIANDO",
    signal_syncing: "SINCRONIZANDO",
    signal_online: "EN LINEA",
    signal_online_fallback: "EN LINEA",
    signal_partial: "PARCIAL",
    signal_offline: "SIN CONEXION",
    reset_in: "Reinicio en: {d}d {h}h {m}m {s}s ({ts})",
    silo_expired: "La fuente indica que estos codigos estan vencidos y esperando reinicio semanal.",
    silo_error: "No se pudieron cargar los codigos del silo.",
    minerva_error_summary: "No se pudieron cargar los datos de Minerva.",
    minerva_error_items: "No hay datos de Minerva disponibles.",
    minerva_no_items: "No se pudieron resolver items de Minerva.",
    minerva_active_at: "Minerva esta activa en {location}.",
    minerva_transit_to: "Minerva esta en traslado. Proxima parada: {location}.",
    next_change: "Proximo cambio: {time}",
    window_arrives: "Llega: {time}",
    window_leaves: "Se va: {time}",
    window_arrives_short: "LLEGA",
    window_leaves_short: "SE VA",
    window_unknown: "Ventana no disponible.",
    list_value: "Lista {n}",
    boot_title: "PIP-BOY 3000 MK IV",
    boot_subtitle: "PROCESADOR DE INFORMACION PERSONAL VAULT-TEC",
    boot_line_1: "Inicializando enlace de radio...",
    boot_line_2: "Cargando inteligencia del Yermo...",
    boot_line_3: "Calibrando pantalla resistente a radiacion...",
    boot_ready: "SISTEMA LISTO",
    boot_hint_initializing: "Inicializando...",
    sync_title: "SINCRONIZANDO DATOS...",
    classified_loading_title: "CARGANDO ARCHIVOS CLASIFICADOS...",
    hack_title: "ROBCO INDUSTRIES (TM) PROTOCOLO TERMLINK",
    hack_subtitle: "ACCESO NO AUTORIZADO AL TERMINAL",
    hack_attempts_label: "INTENTOS RESTANTES:",
    hack_enter_password: "INTRODUCE CONTRASENA AHORA",
    hack_pick_password: "Elige una contrasena.",
    hack_abort: "ABORTAR",
    hack_retry: "REINTENTAR",
    hack_open_files: "ABRIR ARCHIVOS",
    hack_log_boot: "SEGURIDAD ROBCO EN LINEA.",
    hack_log_ready: "SE REQUIERE CONTRASENA.",
    hack_entry_denied: "ENTRADA DENEGADA.",
    hack_likeness: "COINCIDENCIA={n}/{total}",
    hack_exact_match: "COINCIDENCIA EXACTA!",
    hack_dud_removed: "DUD ELIMINADO.",
    hack_allowance_replenished: "INTENTOS REESTABLECIDOS.",
    hack_access_granted: "ACCESO CONCEDIDO. ARCHIVO CLASIFICADO DESBLOQUEADO.",
    hack_accessing_archive: "ABRIENDO ARCHIVO...",
    hack_lockout: "TERMINAL BLOQUEADO. REINTENTA LA INTRUSION.",
    classified_main_title: "ARCHIVO CLASIFICADO PIP-BOY",
    classified_title: "[CLASIFICADO] ARCHIVO DE RELE ENCLAVE",
    classified_warning: "Ojos no autorizados detectados. Este archivo es solo para nivel de clearance overseer.",
    classified_back: "VOLVER A INTEL",
    classified_card1_title: "ARCHIVO: OPERACION CINDER TRACE",
    classified_card1_body: "La telemetria satelital indica ensayos repetidos de lanzamiento cerca de los silos de Appalachia. El chatter civil parece normal.",
    classified_card2_title: "ARCHIVO: CADENA DE CONTACTO MINERVA",
    classified_card2_body: "El trafico de rutas mercantes cruza nodos ex-responders. El horario comercial puede ocultar dead drops cifrados.",
    classified_card3_title: "ARCHIVO: LISTA NEGRA VAULT-TEC",
    classified_card3_body: "Fragmentos de llave recuperados de firmware Pip-Boy obsoleto. Una llave completa permite inyeccion de comandos de nivel archivo.",
    classified_minerva_title: "ARCHIVO: LISTAS MAESTRAS DE MINERVA",
    classified_minerva_hint: "Archivo descifrado de rotaciones del vendedor. Incluye todas las listas conocidas y su costo en lingotes.",
    classified_minerva_empty: "Archivo de listas de Minerva no disponible.",
    classified_search_label: "Buscar item",
    classified_search_placeholder: "Escribe el nombre del item (ej. gauss minigun)",
    classified_search_hint: "Encuentra la proxima ventana de venta de Minerva para cualquier item.",
    classified_search_toggle_open: "BUSCAR",
    classified_search_toggle_close: "CERRAR",
    classified_search_toggle_open_label: "Abrir modo de busqueda",
    classified_search_toggle_close_label: "Cerrar modo de busqueda",
    classified_search_prompt: "Escribe un nombre para buscar en el archivo.",
    classified_search_no_results: "No se encontro ningun item coincidente en el archivo.",
    classified_search_results_count: "Coincidencias: {n}",
    classified_search_item: "Item",
    classified_search_price: "Precio",
    classified_search_sale: "Venta",
    classified_search_available: "Disponible",
    classified_search_days: "Dias",
    classified_search_now: "Ahora",
    classified_sale_standard: "Venta estandar",
    classified_sale_big: "Gran venta",
    classified_days_value: "{n}d"
  }
};

const state = {
  lang: "en",
  signalKey: "booting",
  view: "intel",
  publicConfig: {
    botInviteLink: ""
  },
  intelBotInvite: {
    open: false
  },
  minervaLists: null,
  silo: {
    error: false,
    codes: null,
    isExpired: false,
    resetTargetUtc: null,
    source: ""
  },
  siloDossier: {
    open: false
  },
  minerva: {
    error: false,
    data: null
  },
  minervaDetail: {
    open: false,
    loading: false,
    error: "",
    item: null,
    data: null,
    requestId: 0,
    cache: {},
    translationCache: {},
    fallbackByKey: null,
    fallbackPromise: null,
    fallbackImageUrl: MINERVA_DETAIL_FALLBACK_IMAGE
  },
  minervaLocation: {
    open: false,
    countdownTargetMs: null,
    countdownMode: "",
    slides: [],
    slideIndex: 0,
    slideKey: "",
    transitionToken: 0
  },
  classifiedSearch: {
    query: "",
    entries: [],
    open: false,
    baseArchiveWidth: 0
  },
  classifiedDetail: {
    open: false,
    loading: false,
    error: "",
    item: null,
    data: null,
    requestId: 0
  },
  files: {
    me: null,
    list: [],
    loadingMe: false,
    loadingList: false,
    meError: "",
    listError: "",
    selectedId: "",
    detailOrigin: "",
    transition: "",
    groupTransition: "",
    uploadBusy: false,
    uploadMessage: "",
    uploadMessageKind: "",
    accessRequestBusy: false,
    accessRequestMessage: "",
    accessRequestMessageKind: "",
    disclaimerGate: {
      busy: false,
      pendingDecision: "",
      message: "",
      messageKind: "",
      acceptTransitionActive: false,
      acceptTransitionExiting: false,
      acceptTransitionStartedAt: 0,
      contactOpen: false,
      contactBusy: false,
      contactText: ""
    },
    decisionNotice: {
      visible: false,
      token: ""
    },
    adminRequests: {
      loading: false,
      list: [],
      query: "",
      filter: "pending",
      busyActionKey: "",
      declineComposerRequestId: "",
      declineComposerValue: "",
      message: "",
      messageKind: ""
    },
    uploadFieldInvalid: false,
    uploadMissingFileError: false,
    activeGroupKey: "",
    rename: {
      fileId: "",
      value: "",
      busy: false
    },
    groupManager: {
      open: false,
      targetGroup: "",
      selectedIds: [],
      busy: false
    },
    groupRename: {
      busy: false,
      key: "",
      open: false,
      label: "",
      value: "",
      message: "",
      messageKind: ""
    },
    search: {
      open: false,
      query: ""
    },
    deleteModal: {
      open: false,
      fileId: "",
      fileName: "",
      deleting: false
    },
    botAdmin: {
      loading: false,
      overview: null,
      query: "",
      selectedGuildId: "",
      message: "",
      messageKind: "",
      busyActionKey: "",
      lastLoadedAt: 0,
      leaveConfirm: {
        open: false,
        guildId: "",
        guildName: "",
        actionKey: ""
      }
    },
    adminModal: {
      active: ""
    },
    disclaimerModal: {
      open: false
    }
  },
  easterEgg: {
    unlocked: false,
    triggerClicks: 0,
    triggerWindowStart: 0,
    hack: null,
    logAnimation: {
      requestId: 0,
      timer: null,
      displayedText: ""
    }
  },
  audio: {
    context: null,
    lastTypeSoundAt: 0
  }
};

const FILES_BOT_ADMIN_POLL_INTERVAL_MS = 15000;
let filesBotAdminPollTimer = 0;

const elements = {
  bootOverlay: document.getElementById("bootOverlay"),
  bootTitle: document.getElementById("bootTitle"),
  bootSubtitle: document.getElementById("bootSubtitle"),
  bootLog: document.getElementById("bootLog"),
  bootBar: document.getElementById("bootBar"),
  bootPercent: document.getElementById("bootPercent"),
  bootHint: document.getElementById("bootHint"),
  bootLine1: document.getElementById("bootLine1"),
  bootLine2: document.getElementById("bootLine2"),
  bootLine3: document.getElementById("bootLine3"),
  bootReady: document.getElementById("bootReady"),
  hackOverlay: document.getElementById("hackOverlay"),
  hackTitle: document.getElementById("hackTitle"),
  hackSubtitle: document.getElementById("hackSubtitle"),
  hackAttemptsLabel: document.getElementById("hackAttemptsLabel"),
  hackAttempts: document.getElementById("hackAttempts"),
  hackMemory: document.getElementById("hackMemory"),
  hackLog: document.getElementById("hackLog"),
  hackAbortBtn: document.getElementById("hackAbortBtn"),
  hackRetryBtn: document.getElementById("hackRetryBtn"),
  hackOpenClassifiedBtn: document.getElementById("hackOpenClassifiedBtn"),
  filesDeleteOverlay: document.getElementById("filesDeleteOverlay"),
  filesDeleteTitle: document.getElementById("filesDeleteTitle"),
  filesDeleteMessage: document.getElementById("filesDeleteMessage"),
  filesDeleteCancelBtn: document.getElementById("filesDeleteCancelBtn"),
  filesDeleteConfirmBtn: document.getElementById("filesDeleteConfirmBtn"),
  filesBotAdminLeaveOverlay: document.getElementById("filesBotAdminLeaveOverlay"),
  filesBotAdminLeaveBadge: document.getElementById("filesBotAdminLeaveBadge"),
  filesBotAdminLeaveTitle: document.getElementById("filesBotAdminLeaveTitle"),
  filesBotAdminLeaveMessage: document.getElementById("filesBotAdminLeaveMessage"),
  filesBotAdminLeaveCancelBtn: document.getElementById("filesBotAdminLeaveCancelBtn"),
  filesBotAdminLeaveConfirmBtn: document.getElementById("filesBotAdminLeaveConfirmBtn"),
  filesDisclaimerOverlay: document.getElementById("filesDisclaimerOverlay"),
  filesDisclaimerTitle: document.getElementById("filesDisclaimerTitle"),
  filesDisclaimerBody1: document.getElementById("filesDisclaimerBody1"),
  filesDisclaimerBody2: document.getElementById("filesDisclaimerBody2"),
  filesDisclaimerCloseBtn: document.getElementById("filesDisclaimerCloseBtn"),
  filesGroupRenameOverlay: document.getElementById("filesGroupRenameOverlay"),
  filesGroupRenameTitle: document.getElementById("filesGroupRenameTitle"),
  filesGroupRenameMessage: document.getElementById("filesGroupRenameMessage"),
  filesGroupRenameForm: document.getElementById("filesGroupRenameForm"),
  filesGroupRenameLabel: document.getElementById("filesGroupRenameLabel"),
  filesGroupRenameInput: document.getElementById("filesGroupRenameInput"),
  filesGroupRenameFeedback: document.getElementById("filesGroupRenameFeedback"),
  filesGroupRenameCancelBtn: document.getElementById("filesGroupRenameCancelBtn"),
  filesGroupRenameConfirmBtn: document.getElementById("filesGroupRenameConfirmBtn"),
  filesUploadOverlay: document.getElementById("filesUploadOverlay"),
  filesUploadModalCloseBtn: document.getElementById("filesUploadModalCloseBtn"),
  filesAdminRequestsOverlay: document.getElementById("filesAdminRequestsOverlay"),
  filesAdminRequestsModalCloseBtn: document.getElementById("filesAdminRequestsModalCloseBtn"),
  filesBotAdminOverlay: document.getElementById("filesBotAdminOverlay"),
  filesBotAdminModalCloseBtn: document.getElementById("filesBotAdminModalCloseBtn"),
  syncOverlay: document.getElementById("syncOverlay"),
  syncTitle: document.getElementById("syncTitle"),
  classifiedLoadOverlay: document.getElementById("classifiedLoadOverlay"),
  classifiedLoadTitle: document.getElementById("classifiedLoadTitle"),
  intelBotInviteOverlay: document.getElementById("intelBotInviteOverlay"),
  intelBotInviteCore: document.getElementById("intelBotInviteCore"),
  intelBotInviteBadge: document.getElementById("intelBotInviteBadge"),
  intelBotInviteTitle: document.getElementById("intelBotInviteTitle"),
  intelBotInviteBody: document.getElementById("intelBotInviteBody"),
  intelBotInviteCancelBtn: document.getElementById("intelBotInviteCancelBtn"),
  intelBotInviteConfirmBtn: document.getElementById("intelBotInviteConfirmBtn"),
  microText: document.getElementById("microText"),
  mainTitle: document.getElementById("mainTitle"),
  tabStatus: document.getElementById("tabStatus"),
  tabStatusText: document.getElementById("tabStatusText"),
  tabStatusDecisionBadge: document.getElementById("tabStatusDecisionBadge"),
  tabIntel: document.getElementById("tabIntel"),
  tabData: document.getElementById("tabData"),
  discordBotInviteBtn: document.getElementById("discordBotInviteBtn"),
  discordBotInviteLabel: document.getElementById("discordBotInviteLabel"),
  discordBotInviteHint: document.getElementById("discordBotInviteHint"),
  langLabel: document.getElementById("langLabel"),
  langDropdown: document.getElementById("langDropdown"),
  langToggleBtn: document.getElementById("langToggleBtn"),
  langMenu: document.getElementById("langMenu"),
  langCurrent: document.getElementById("langCurrent"),
  langOptions: Array.from(document.querySelectorAll(".lang-option")),
  langSelect: document.getElementById("langSelect"),
  labelUtc: document.getElementById("labelUtc"),
  labelLastSync: document.getElementById("labelLastSync"),
  labelDataLink: document.getElementById("labelDataLink"),
  statusStrip: document.getElementById("statusStrip"),
  utcTime: document.getElementById("utcTime"),
  lastRefresh: document.getElementById("lastRefresh"),
  dataSignal: document.getElementById("dataSignal"),
  refreshBtn: document.getElementById("refreshBtn"),
  intelGrid: document.getElementById("intelGrid"),
  filesPage: document.getElementById("filesPage"),
  filesUnauthorizedPanel: document.getElementById("filesUnauthorizedPanel"),
  filesUnauthorizedBadge: document.getElementById("filesUnauthorizedBadge"),
  filesUnauthorizedTitle: document.getElementById("filesUnauthorizedTitle"),
  filesUnauthorizedSubtitle: document.getElementById("filesUnauthorizedSubtitle"),
  filesUnauthorizedKicker: document.getElementById("filesUnauthorizedKicker"),
  filesUnauthorizedStateLabel: document.getElementById("filesUnauthorizedStateLabel"),
  filesUnauthorizedStateValue: document.getElementById("filesUnauthorizedStateValue"),
  filesUnauthorizedGateLabel: document.getElementById("filesUnauthorizedGateLabel"),
  filesUnauthorizedGateValue: document.getElementById("filesUnauthorizedGateValue"),
  filesUnauthorizedTraceLabel: document.getElementById("filesUnauthorizedTraceLabel"),
  filesUnauthorizedTraceValue: document.getElementById("filesUnauthorizedTraceValue"),
  filesUnauthorizedDirectiveTitle: document.getElementById("filesUnauthorizedDirectiveTitle"),
  filesUnauthorizedDirectiveLine1: document.getElementById("filesUnauthorizedDirectiveLine1"),
  filesUnauthorizedDirectiveLine2: document.getElementById("filesUnauthorizedDirectiveLine2"),
  filesUnauthorizedDirectiveLine3: document.getElementById("filesUnauthorizedDirectiveLine3"),
  filesNotAuthorizedMessage: document.getElementById("filesNotAuthorizedMessage"),
  filesLoginForm: document.getElementById("filesLoginForm"),
  filesLoginBtn: document.getElementById("filesLoginBtn"),
  filesLogoutBtn: document.getElementById("filesLogoutBtn"),
  filesAuthorizedView: document.getElementById("filesAuthorizedView"),
  filesRestrictedView: document.getElementById("filesRestrictedView"),
  filesRestrictedBadge: document.getElementById("filesRestrictedBadge"),
  filesRestrictedIncident: document.getElementById("filesRestrictedIncident"),
  filesRestrictedTitle: document.getElementById("filesRestrictedTitle"),
  filesRestrictedSubtitle: document.getElementById("filesRestrictedSubtitle"),
  filesRestrictedIdentityLabel: document.getElementById("filesRestrictedIdentityLabel"),
  filesRestrictedIdentityValue: document.getElementById("filesRestrictedIdentityValue"),
  filesRestrictedDiscordLabel: document.getElementById("filesRestrictedDiscordLabel"),
  filesRestrictedDiscordValue: document.getElementById("filesRestrictedDiscordValue"),
  filesRestrictedClearanceLabel: document.getElementById("filesRestrictedClearanceLabel"),
  filesRestrictedClearanceValue: document.getElementById("filesRestrictedClearanceValue"),
  filesRestrictedStatusLabel: document.getElementById("filesRestrictedStatusLabel"),
  filesRestrictedStatusValue: document.getElementById("filesRestrictedStatusValue"),
  filesRestrictedTimeLabel: document.getElementById("filesRestrictedTimeLabel"),
  filesRestrictedTimeValue: document.getElementById("filesRestrictedTimeValue"),
  filesRestrictedDirectiveTitle: document.getElementById("filesRestrictedDirectiveTitle"),
  filesRestrictedDirectiveLine1: document.getElementById("filesRestrictedDirectiveLine1"),
  filesRestrictedDirectiveLine2: document.getElementById("filesRestrictedDirectiveLine2"),
  filesRestrictedDirectiveLine3: document.getElementById("filesRestrictedDirectiveLine3"),
  filesRestrictedReasonSection: document.getElementById("filesRestrictedReasonSection"),
  filesRestrictedReasonLabel: document.getElementById("filesRestrictedReasonLabel"),
  filesRestrictedReasonInput: document.getElementById("filesRestrictedReasonInput"),
  filesRestrictedReasonHint: document.getElementById("filesRestrictedReasonHint"),
  filesRestrictedRetryBtn: document.getElementById("filesRestrictedRetryBtn"),
  filesRestrictedLogoutBtn: document.getElementById("filesRestrictedLogoutBtn"),
  filesRestrictedRequestFeedback: document.getElementById("filesRestrictedRequestFeedback"),
  filesDeniedView: document.getElementById("filesDeniedView"),
  filesDeniedBadge: document.getElementById("filesDeniedBadge"),
  filesDeniedTitle: document.getElementById("filesDeniedTitle"),
  filesDeniedSubtitle: document.getElementById("filesDeniedSubtitle"),
  filesDeniedReasonSection: document.getElementById("filesDeniedReasonSection"),
  filesDeniedReasonLabel: document.getElementById("filesDeniedReasonLabel"),
  filesDeniedReasonValue: document.getElementById("filesDeniedReasonValue"),
  filesDeniedStatusLabel: document.getElementById("filesDeniedStatusLabel"),
  filesDeniedStatusValue: document.getElementById("filesDeniedStatusValue"),
  filesDeniedNextWindowLabel: document.getElementById("filesDeniedNextWindowLabel"),
  filesDeniedNextWindowValue: document.getElementById("filesDeniedNextWindowValue"),
  filesDeniedCountdownLabel: document.getElementById("filesDeniedCountdownLabel"),
  filesDeniedCountdownValue: document.getElementById("filesDeniedCountdownValue"),
  filesDeniedDirectiveTitle: document.getElementById("filesDeniedDirectiveTitle"),
  filesDeniedDirectiveLine1: document.getElementById("filesDeniedDirectiveLine1"),
  filesDeniedDirectiveLine2: document.getElementById("filesDeniedDirectiveLine2"),
  filesDeniedDirectiveLine3: document.getElementById("filesDeniedDirectiveLine3"),
  filesDeniedDirectiveLine4: document.getElementById("filesDeniedDirectiveLine4"),
  filesDeniedLogoutBtn: document.getElementById("filesDeniedLogoutBtn"),
  filesDisclaimerGateView: document.getElementById("filesDisclaimerGateView"),
  filesDisclaimerGateBadge: document.getElementById("filesDisclaimerGateBadge"),
  filesDisclaimerGateTitle: document.getElementById("filesDisclaimerGateTitle"),
  filesDisclaimerGateIntro: document.getElementById("filesDisclaimerGateIntro"),
  filesDisclaimerGateBody1: document.getElementById("filesDisclaimerGateBody1"),
  filesDisclaimerGateBody2: document.getElementById("filesDisclaimerGateBody2"),
  filesDisclaimerGateActions: document.getElementById("filesDisclaimerGateActions"),
  filesDisclaimerAgreeBtn: document.getElementById("filesDisclaimerAgreeBtn"),
  filesDisclaimerDeclineBtn: document.getElementById("filesDisclaimerDeclineBtn"),
  filesDisclaimerDeclinedPanel: document.getElementById("filesDisclaimerDeclinedPanel"),
  filesDisclaimerDeclinedTitle: document.getElementById("filesDisclaimerDeclinedTitle"),
  filesDisclaimerDeclinedMessage: document.getElementById("filesDisclaimerDeclinedMessage"),
  filesDisclaimerContactBtn: document.getElementById("filesDisclaimerContactBtn"),
  filesDisclaimerContactView: document.getElementById("filesDisclaimerContactView"),
  filesDisclaimerContactTitle: document.getElementById("filesDisclaimerContactTitle"),
  filesDisclaimerContactHint: document.getElementById("filesDisclaimerContactHint"),
  filesDisclaimerContactLabel: document.getElementById("filesDisclaimerContactLabel"),
  filesDisclaimerContactInput: document.getElementById("filesDisclaimerContactInput"),
  filesDisclaimerContactCancelBtn: document.getElementById("filesDisclaimerContactCancelBtn"),
  filesDisclaimerContactSendBtn: document.getElementById("filesDisclaimerContactSendBtn"),
  filesDisclaimerGateFeedback: document.getElementById("filesDisclaimerGateFeedback"),
  filesDisclaimerAcceptLoader: document.getElementById("filesDisclaimerAcceptLoader"),
  filesDisclaimerAcceptLoaderText: document.getElementById("filesDisclaimerAcceptLoaderText"),
  filesSessionTitle: document.getElementById("filesSessionTitle"),
  filesSessionBadge: document.getElementById("filesSessionBadge"),
  filesSessionIdentity: document.getElementById("filesSessionIdentity"),
  filesSessionUserLabel: document.getElementById("filesSessionUserLabel"),
  filesSessionUser: document.getElementById("filesSessionUser"),
  filesSessionIdLabel: document.getElementById("filesSessionIdLabel"),
  filesSessionId: document.getElementById("filesSessionId"),
  filesSessionClearanceLabel: document.getElementById("filesSessionClearanceLabel"),
  filesSessionClearance: document.getElementById("filesSessionClearance"),
  filesSessionStateLabel: document.getElementById("filesSessionStateLabel"),
  filesSessionState: document.getElementById("filesSessionState"),
  filesSessionLogoutBtn: document.getElementById("filesSessionLogoutBtn"),
  filesBotAdminFloatingBtn: document.getElementById("filesBotAdminFloatingBtn"),
  filesBotAdminFloatingBtnLabel: document.getElementById("filesBotAdminFloatingBtnLabel"),
  filesBotAdminFloatingBtnHint: document.getElementById("filesBotAdminFloatingBtnHint"),
  filesAdminToolsPanel: document.getElementById("filesAdminToolsPanel"),
  filesAdminToolsTitle: document.getElementById("filesAdminToolsTitle"),
  filesAdminConsoleModalBtn: document.getElementById("filesAdminConsoleModalBtn"),
  filesAdminConsoleModalBtnText: document.getElementById("filesAdminConsoleModalBtnText"),
  filesAccessControlModalBtn: document.getElementById("filesAccessControlModalBtn"),
  filesAccessControlModalBtnText: document.getElementById("filesAccessControlModalBtnText"),
  filesAccessControlPendingBadge: document.getElementById("filesAccessControlPendingBadge"),
  filesBotAdminModalBtn: document.getElementById("filesBotAdminModalBtn"),
  filesBotAdminModalBtnText: document.getElementById("filesBotAdminModalBtnText"),
  filesUploadPanel: document.getElementById("filesUploadPanel"),
  filesUploadTitle: document.getElementById("filesUploadTitle"),
  filesUploadForm: document.getElementById("filesUploadForm"),
  filesUploadFileLabel: document.getElementById("filesUploadFileLabel"),
  filesUploadInput: document.getElementById("filesUploadInput"),
  filesUploadImageLabel: document.getElementById("filesUploadImageLabel"),
  filesImageInput: document.getElementById("filesImageInput"),
  filesUploadGroupLabel: document.getElementById("filesUploadGroupLabel"),
  filesGroupInput: document.getElementById("filesGroupInput"),
  filesGroupSuggestDropdown: document.getElementById("filesGroupSuggestDropdown"),
  filesGroupSuggestBtn: document.getElementById("filesGroupSuggestBtn"),
  filesGroupSuggestCurrent: document.getElementById("filesGroupSuggestCurrent"),
  filesGroupSuggestMenu: document.getElementById("filesGroupSuggestMenu"),
  filesUploadDescLabel: document.getElementById("filesUploadDescLabel"),
  filesDescriptionInput: document.getElementById("filesDescriptionInput"),
  filesUploadBtn: document.getElementById("filesUploadBtn"),
  filesUploadFeedback: document.getElementById("filesUploadFeedback"),
  filesAdminRequestsPanel: document.getElementById("filesAdminRequestsPanel"),
  filesAdminRequestsTitle: document.getElementById("filesAdminRequestsTitle"),
  filesAdminRequestsHint: document.getElementById("filesAdminRequestsHint"),
  filesAdminRequestsSearchLabel: document.getElementById("filesAdminRequestsSearchLabel"),
  filesAdminRequestsSearchInput: document.getElementById("filesAdminRequestsSearchInput"),
  filesAdminRequestsFilterLabel: document.getElementById("filesAdminRequestsFilterLabel"),
  filesAdminRequestsFilterDropdown: document.getElementById("filesAdminRequestsFilterDropdown"),
  filesAdminRequestsFilterBtn: document.getElementById("filesAdminRequestsFilterBtn"),
  filesAdminRequestsFilterCurrent: document.getElementById("filesAdminRequestsFilterCurrent"),
  filesAdminRequestsFilterMenu: document.getElementById("filesAdminRequestsFilterMenu"),
  filesAdminRequestsFilter: document.getElementById("filesAdminRequestsFilter"),
  filesAdminRequestsFilterPending: document.getElementById("filesAdminRequestsFilterPending"),
  filesAdminRequestsFilterApproved: document.getElementById("filesAdminRequestsFilterApproved"),
  filesAdminRequestsFilterDeclined: document.getElementById("filesAdminRequestsFilterDeclined"),
  filesAdminRequestsFilterAuthorized: document.getElementById("filesAdminRequestsFilterAuthorized"),
  filesAdminRequestsFilterAll: document.getElementById("filesAdminRequestsFilterAll"),
  filesAdminRequestsFilterOptions: Array.from(document.querySelectorAll(".files-admin-requests-filter-option")),
  filesAdminRequestsRefreshBtn: document.getElementById("filesAdminRequestsRefreshBtn"),
  filesAdminRequestsFeedback: document.getElementById("filesAdminRequestsFeedback"),
  filesAdminRequestsList: document.getElementById("filesAdminRequestsList"),
  filesBotAdminPanel: document.getElementById("filesBotAdminPanel"),
  filesBotAdminBadge: document.getElementById("filesBotAdminBadge"),
  filesBotAdminTitle: document.getElementById("filesBotAdminTitle"),
  filesBotAdminHint: document.getElementById("filesBotAdminHint"),
  filesBotAdminMeta: document.getElementById("filesBotAdminMeta"),
  filesBotAdminFeedback: document.getElementById("filesBotAdminFeedback"),
  filesBotAdminRefreshBtn: document.getElementById("filesBotAdminRefreshBtn"),
  filesBotAdminSyncBtn: document.getElementById("filesBotAdminSyncBtn"),
  filesBotAdminInviteLink: document.getElementById("filesBotAdminInviteLink"),
  filesBotAdminStatusLabel: document.getElementById("filesBotAdminStatusLabel"),
  filesBotAdminStatusValue: document.getElementById("filesBotAdminStatusValue"),
  filesBotAdminServersLabel: document.getElementById("filesBotAdminServersLabel"),
  filesBotAdminServersValue: document.getElementById("filesBotAdminServersValue"),
  filesBotAdminUsersLabel: document.getElementById("filesBotAdminUsersLabel"),
  filesBotAdminUsersValue: document.getElementById("filesBotAdminUsersValue"),
  filesBotAdminChannelsLabel: document.getElementById("filesBotAdminChannelsLabel"),
  filesBotAdminChannelsValue: document.getElementById("filesBotAdminChannelsValue"),
  filesBotAdminOverview: document.getElementById("filesBotAdminOverview"),
  filesBotAdminToolbar: document.getElementById("filesBotAdminToolbar"),
  filesBotAdminSearchLabel: document.getElementById("filesBotAdminSearchLabel"),
  filesBotAdminSearchInput: document.getElementById("filesBotAdminSearchInput"),
  filesBotAdminServerList: document.getElementById("filesBotAdminServerList"),
  filesBrowserPanel: document.querySelector("#filesAuthorizedView .files-browser-panel"),
  filesBrowserTitle: document.getElementById("filesBrowserTitle"),
  filesSearchToggleBtn: document.getElementById("filesSearchToggleBtn"),
  filesSearchToggleText: document.getElementById("filesSearchToggleText"),
  filesGroupManagerToggleBtn: document.getElementById("filesGroupManagerToggleBtn"),
  filesGroupManagerToggleText: document.getElementById("filesGroupManagerToggleText"),
  filesDisclaimerBtn: document.getElementById("filesDisclaimerBtn"),
  filesDisclaimerBtnText: document.getElementById("filesDisclaimerBtnText"),
  filesSearchWrap: document.getElementById("filesSearchWrap"),
  filesGroupManagerWrap: document.getElementById("filesGroupManagerWrap"),
  filesSearchLabel: document.getElementById("filesSearchLabel"),
  filesSearchCount: document.getElementById("filesSearchCount"),
  filesSearchInput: document.getElementById("filesSearchInput"),
  filesSearchHint: document.getElementById("filesSearchHint"),
  filesSearchResults: document.getElementById("filesSearchResults"),
  filesEmptyState: document.getElementById("filesEmptyState"),
  filesList: document.getElementById("filesList"),
  siloTitle: document.getElementById("siloTitle"),
  siloHint: document.getElementById("siloHint"),
  siloExpiry: document.getElementById("siloExpiry"),
  siloCodes: document.getElementById("siloCodes"),
  siloSourcePrefix: document.getElementById("siloSourcePrefix"),
  siloSourceSuffix: document.getElementById("siloSourceSuffix"),
  siloDossierOverlay: document.getElementById("siloDossierOverlay"),
  siloDossierEyebrow: document.getElementById("siloDossierEyebrow"),
  siloDossierTitle: document.getElementById("siloDossierTitle"),
  siloDossierSummary: document.getElementById("siloDossierSummary"),
  siloDossierSourceLink: document.getElementById("siloDossierSourceLink"),
  siloDossierCloseBtn: document.getElementById("siloDossierCloseBtn"),
  siloDossierCodes: document.getElementById("siloDossierCodes"),
  siloDossierResetLabel: document.getElementById("siloDossierResetLabel"),
  siloDossierResetValue: document.getElementById("siloDossierResetValue"),
  siloDossierCountdownLabel: document.getElementById("siloDossierCountdownLabel"),
  siloDossierCountdownValue: document.getElementById("siloDossierCountdownValue"),
  siloDossierStatusLabel: document.getElementById("siloDossierStatusLabel"),
  siloDossierStatusValue: document.getElementById("siloDossierStatusValue"),
  siloDossierSignalLabel: document.getElementById("siloDossierSignalLabel"),
  siloDossierSignalValue: document.getElementById("siloDossierSignalValue"),
  siloDossierBriefing: document.getElementById("siloDossierBriefing"),
  siloDossierBackBtn: document.getElementById("siloDossierBackBtn"),
  minervaTitle: document.getElementById("minervaTitle"),
  minervaSummary: document.getElementById("minervaSummary"),
  minervaLocationLabel: document.getElementById("minervaLocationLabel"),
  minervaListLabel: document.getElementById("minervaListLabel"),
  minervaWindowLabel: document.getElementById("minervaWindowLabel"),
  minervaLocationCardBtn: document.getElementById("minervaLocationCardBtn"),
  minervaLocation: document.getElementById("minervaLocation"),
  minervaList: document.getElementById("minervaList"),
  minervaWindow: document.getElementById("minervaWindow"),
  minervaInventoryTitle: document.getElementById("minervaInventoryTitle"),
  tableItemHeader: document.getElementById("tableItemHeader"),
  tablePriceHeader: document.getElementById("tablePriceHeader"),
  minervaItems: document.getElementById("minervaItems"),
  minervaAwaiting: document.getElementById("minervaAwaiting"),
  minervaSourcePrefix: document.getElementById("minervaSourcePrefix"),
  minervaSourceSuffix: document.getElementById("minervaSourceSuffix"),
  minervaPanel: document.getElementById("minervaPanel"),
  minervaDetailView: document.getElementById("minervaDetailView"),
  minervaDetailBackBtn: document.getElementById("minervaDetailBackBtn"),
  minervaDetailWikiLink: document.getElementById("minervaDetailWikiLink"),
  minervaDetailName: document.getElementById("minervaDetailName"),
  minervaDetailStatus: document.getElementById("minervaDetailStatus"),
  minervaDetailContent: document.getElementById("minervaDetailContent"),
  minervaDetailImage: document.getElementById("minervaDetailImage"),
  minervaDetailWhereLabel: document.getElementById("minervaDetailWhereLabel"),
  minervaDetailWhereList: document.getElementById("minervaDetailWhereList"),
  minervaDetailUnlocksLabel: document.getElementById("minervaDetailUnlocksLabel"),
  minervaDetailUnlocks: document.getElementById("minervaDetailUnlocks"),
  minervaLocationView: document.getElementById("minervaLocationView"),
  minervaLocationBackBtn: document.getElementById("minervaLocationBackBtn"),
  minervaLocationTitle: document.getElementById("minervaLocationTitle"),
  minervaLocationStatus: document.getElementById("minervaLocationStatus"),
  minervaLocationMapLabel: document.getElementById("minervaLocationMapLabel"),
  minervaLocationMapImage: document.getElementById("minervaLocationMapImage"),
  minervaLocationMapPrevBtn: document.getElementById("minervaLocationMapPrevBtn"),
  minervaLocationMapNextBtn: document.getElementById("minervaLocationMapNextBtn"),
  minervaLocationPinsWrap: document.getElementById("minervaLocationPins"),
  minervaLocationMapName: document.getElementById("minervaLocationMapName"),
  minervaLocationArrivesLabel: document.getElementById("minervaLocationArrivesLabel"),
  minervaLocationArrives: document.getElementById("minervaLocationArrives"),
  minervaLocationLeavesLabel: document.getElementById("minervaLocationLeavesLabel"),
  minervaLocationLeaves: document.getElementById("minervaLocationLeaves"),
  minervaLocationCountdownLabel: document.getElementById("minervaLocationCountdownLabel"),
  minervaLocationCountdown: document.getElementById("minervaLocationCountdown"),
  minervaLocationPins: Array.from(document.querySelectorAll(".minerva-loc-pin")),
  classifiedPage: document.getElementById("classifiedPage"),
  classifiedTitle: document.getElementById("classifiedTitle"),
  classifiedWarning: document.getElementById("classifiedWarning"),
  classifiedBackBtn: document.getElementById("classifiedBackBtn"),
  classifiedCard1Title: document.getElementById("classifiedCard1Title"),
  classifiedCard1Body: document.getElementById("classifiedCard1Body"),
  classifiedCard2Title: document.getElementById("classifiedCard2Title"),
  classifiedCard2Body: document.getElementById("classifiedCard2Body"),
  classifiedCard3Title: document.getElementById("classifiedCard3Title"),
  classifiedCard3Body: document.getElementById("classifiedCard3Body"),
  classifiedMinervaTitle: document.getElementById("classifiedMinervaTitle"),
  classifiedMinervaHint: document.getElementById("classifiedMinervaHint"),
  classifiedSearchToggleBtn: document.getElementById("classifiedSearchToggleBtn"),
  classifiedSearchToggleText: document.getElementById("classifiedSearchToggleText"),
  classifiedSearchWrap: document.getElementById("classifiedSearchWrap"),
  classifiedArchiveCard: document.querySelector(".classified-card-archive"),
  classifiedSearchLabel: document.getElementById("classifiedSearchLabel"),
  classifiedSearchCount: document.getElementById("classifiedSearchCount"),
  classifiedSearchInput: document.getElementById("classifiedSearchInput"),
  classifiedSearchHint: document.getElementById("classifiedSearchHint"),
  classifiedSearchResults: document.getElementById("classifiedSearchResults"),
  classifiedMinervaLists: document.getElementById("classifiedMinervaLists"),
  classifiedInlineDetail: document.getElementById("classifiedInlineDetail"),
  classifiedInlineName: document.getElementById("classifiedInlineName"),
  classifiedInlineWikiLink: document.getElementById("classifiedInlineWikiLink"),
  classifiedInlineCloseBtn: document.getElementById("classifiedInlineCloseBtn"),
  classifiedInlineStatus: document.getElementById("classifiedInlineStatus"),
  classifiedInlineContent: document.getElementById("classifiedInlineContent"),
  classifiedInlineImage: document.getElementById("classifiedInlineImage"),
  classifiedInlineWhereLabel: document.getElementById("classifiedInlineWhereLabel"),
  classifiedInlineWhereList: document.getElementById("classifiedInlineWhereList"),
  classifiedInlineUnlocksLabel: document.getElementById("classifiedInlineUnlocksLabel"),
  classifiedInlineUnlocks: document.getElementById("classifiedInlineUnlocks"),
  footerText: document.getElementById("footerText")
};

const minervaImagePreloadCache = new Map();

function t(key, vars = {}) {
  const dictionary = STRINGS[state.lang] || STRINGS.en;
  const template = dictionary[key] || STRINGS.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

function isSiloDossierHash(hashValue = window.location.hash) {
  void hashValue;
  return false;
}

function getHashView() {
  const hash = String(window.location.hash || "").trim().toLowerCase();
  if (hash === VIEW_HASHES.files) {
    return "files";
  }
  if (hash === VIEW_HASHES.classified || hash === "#classified" || hash === "#data") {
    return "classified";
  }
  if (!hash || hash === VIEW_HASHES.intel) {
    return "intel";
  }
  return "";
}

function setHashView(view, { replace = false } = {}) {
  const targetHash = view === "files"
    ? VIEW_HASHES.files
    : view === "classified"
      ? VIEW_HASHES.classified
      : VIEW_HASHES.intel;
  const currentHash = String(window.location.hash || "").trim().toLowerCase();
  if (currentHash === targetHash) {
    return;
  }

  if (replace && window.history?.replaceState) {
    const nextUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
    window.history.replaceState(null, "", nextUrl);
    return;
  }

  window.location.hash = targetHash;
}

function setTopTabActive(view) {
  elements.tabIntel?.classList.toggle("active", view === "intel");
  elements.tabStatus?.classList.toggle("active", view === "files");
  elements.tabData?.classList.toggle("active", view === "data");
}

function normalizePublicConfig(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      botInviteLink: ""
    };
  }

  return {
    botInviteLink: String(payload.botInviteLink || "").trim()
  };
}

function syncDiscordBotInviteButton() {
  if (!elements.discordBotInviteBtn) {
    return;
  }

  const canUseInviteButton = canUseFilesBotAdmin(state.files.me);
  const inviteLink = String(state.publicConfig?.botInviteLink || "").trim();
  const shouldShow = state.view === "intel" && canUseInviteButton && Boolean(inviteLink);
  elements.discordBotInviteBtn.hidden = !shouldShow;
  elements.discordBotInviteBtn.href = shouldShow ? inviteLink : "#";
  elements.discordBotInviteBtn.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  if (!shouldShow && state.intelBotInvite.open) {
    closeIntelBotInviteModal();
  }
}

function renderIntelBotInviteModal() {
  if (!elements.intelBotInviteOverlay || !elements.intelBotInviteConfirmBtn) {
    return;
  }

  const inviteLink = String(state.publicConfig?.botInviteLink || "").trim();
  elements.intelBotInviteConfirmBtn.href = inviteLink || "#";
  elements.intelBotInviteConfirmBtn.setAttribute("aria-disabled", inviteLink ? "false" : "true");
  elements.intelBotInviteConfirmBtn.classList.toggle("is-disabled", !inviteLink);
}

function openIntelBotInviteModal() {
  if (!elements.intelBotInviteOverlay) {
    return;
  }
  if (!canUseFilesBotAdmin(state.files.me)) {
    return;
  }
  if (!String(state.publicConfig?.botInviteLink || "").trim()) {
    return;
  }

  state.intelBotInvite.open = true;
  renderIntelBotInviteModal();
  elements.intelBotInviteOverlay.classList.add("is-active");
  elements.intelBotInviteOverlay.setAttribute("aria-hidden", "false");
}

function closeIntelBotInviteModal() {
  if (!elements.intelBotInviteOverlay) {
    return;
  }

  state.intelBotInvite.open = false;
  elements.intelBotInviteOverlay.classList.remove("is-active");
  elements.intelBotInviteOverlay.setAttribute("aria-hidden", "true");
}

function syncTopTabForCurrentView() {
  if (state.view === "classified") {
    setTopTabActive("data");
    syncDiscordBotInviteButton();
    return;
  }
  if (state.view === "files") {
    setTopTabActive("files");
    syncDiscordBotInviteButton();
    return;
  }
  setTopTabActive("intel");
  syncDiscordBotInviteButton();
}

async function loadPublicConfig() {
  try {
    const response = await fetch("/api/public-config", {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    state.publicConfig = normalizePublicConfig(payload);
  } catch (_error) {
    state.publicConfig = {
      botInviteLink: ""
    };
  }

  syncDiscordBotInviteButton();
  renderFilesBotAdminPanel();
}

function getActiveSiloResetTargetMs(nowMs = Date.now()) {
  const fallbackTarget = nextResetUtc().getTime();
  return Number.isFinite(state.silo.resetTargetUtc) && state.silo.resetTargetUtc > nowMs
    ? state.silo.resetTargetUtc
    : fallbackTarget;
}

function formatSiloCountdownValue(totalSeconds) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

function renderSiloDossier() {
  if (!elements.siloDossierOverlay || !elements.siloDossierCodes) {
    return;
  }

  elements.siloDossierEyebrow.textContent = t("silo_dossier_eyebrow");
  elements.siloDossierTitle.textContent = t("silo_dossier_title");
  elements.siloDossierResetLabel.textContent = t("silo_dossier_reset_label");
  elements.siloDossierCountdownLabel.textContent = t("silo_dossier_countdown_label");
  elements.siloDossierStatusLabel.textContent = t("silo_dossier_status_label");
  elements.siloDossierSignalLabel.textContent = t("silo_dossier_signal_label");
  elements.siloDossierSourceLink.textContent = t("silo_dossier_open_source");
  elements.siloDossierCloseBtn.textContent = t("silo_dossier_close");
  elements.siloDossierBackBtn.textContent = t("silo_dossier_back");

  const rawSourceUrl = String(state.silo.source || "").trim();
  const sourceUrl = /nukacrypt/i.test(rawSourceUrl)
    ? "https://nukacrypt.com/"
    : (rawSourceUrl || "https://nukacrypt.com/");
  elements.siloDossierSourceLink.href = sourceUrl;

  const cardsFragment = document.createDocumentFragment();
  const codes = state.silo.codes || {
    Alpha: null,
    Bravo: null,
    Charlie: null
  };
  const hasCodes = Object.values(codes).some(Boolean);

  for (const site of ["Alpha", "Bravo", "Charlie"]) {
    const card = document.createElement("article");
    card.className = "silo-dossier-code-card";

    const label = document.createElement("div");
    label.className = "silo-dossier-code-label";
    label.appendChild(createIconTag(SILO_SITE_GLYPHS[site] || ""));
    label.append(`SITE ${site.toUpperCase()}`);

    const value = document.createElement("div");
    value.className = "silo-dossier-code-value";
    value.textContent = formatSiloCodeForDisplay(codes[site]);

    card.appendChild(label);
    card.appendChild(value);
    cardsFragment.appendChild(card);
  }

  elements.siloDossierCodes.innerHTML = "";
  elements.siloDossierCodes.appendChild(cardsFragment);

  const nowMs = Date.now();
  const targetUtc = getActiveSiloResetTargetMs(nowMs);
  const totalSeconds = Math.max(0, Math.floor((targetUtc - nowMs) / 1000));
  elements.siloDossierResetValue.textContent = formatReadableDateTime(new Date(targetUtc), {
    includeSeconds: false,
    timeZone: "UTC",
    includeWeekday: true,
    includeYear: false,
    zoneLabel: "UTC"
  });
  elements.siloDossierCountdownValue.textContent = formatSiloCountdownValue(totalSeconds);

  if (!hasCodes && !state.silo.error) {
    elements.siloDossierSummary.textContent = t("silo_dossier_loading");
    elements.siloDossierStatusValue.textContent = t("signal_syncing");
    elements.siloDossierBriefing.textContent = t("silo_dossier_loading");
  } else if (state.silo.error) {
    elements.siloDossierSummary.textContent = t("silo_dossier_summary_error");
    elements.siloDossierStatusValue.textContent = t("silo_dossier_status_error");
    elements.siloDossierBriefing.textContent = t("silo_dossier_briefing_error");
  } else if (state.silo.isExpired) {
    elements.siloDossierSummary.textContent = t("silo_dossier_summary_expired");
    elements.siloDossierStatusValue.textContent = t("silo_dossier_status_expired");
    elements.siloDossierBriefing.textContent = t("silo_dossier_briefing_expired");
  } else {
    elements.siloDossierSummary.textContent = t("silo_dossier_summary_live");
    elements.siloDossierStatusValue.textContent = t("silo_dossier_status_live");
    elements.siloDossierBriefing.textContent = t("silo_dossier_briefing_live");
  }

  elements.siloDossierSignalValue.textContent = t(`signal_${state.signalKey}`);
}

function showSiloDossier({ updateHash = true } = {}) {
  if (!elements.siloDossierOverlay) {
    return;
  }

  if (state.view !== "intel") {
    showIntelPage({ updateHash: false });
  }

  state.siloDossier.open = true;
  document.body.classList.add("is-silo-dossier-open");
  elements.siloDossierOverlay.classList.add("is-active");
  elements.siloDossierOverlay.setAttribute("aria-hidden", "false");
  renderSiloDossier();
  renderFilesBotAdminPanel();

  if (updateHash) {
    setHashView("silo");
  }
}

function hideSiloDossier({ updateHash = true } = {}) {
  if (!elements.siloDossierOverlay) {
    return;
  }

  state.siloDossier.open = false;
  document.body.classList.remove("is-silo-dossier-open");
  elements.siloDossierOverlay.classList.remove("is-active");
  elements.siloDossierOverlay.setAttribute("aria-hidden", "true");
  renderFilesBotAdminPanel();

  if (updateHash && isSiloDossierHash()) {
    setHashView("intel");
  }
}

function hideFilesPage() {
  closeIntelBotInviteModal();
  stopFilesLiveIdentityPolling();
  document.body.classList.remove("is-files");
  document.body.classList.remove("is-files-unauthorized", "is-files-guest");
  closeFilesDeleteModal({ force: true });
  closeFilesDisclaimerModal();
  closeFilesGroupRenameModal({ force: true });
  closeFilesAdminModal();
  if (state.files.search.open || state.files.search.query) {
    setFilesSearchOpen(false, { clearQuery: true });
  }
  if (elements.filesPage) {
    elements.filesPage.classList.remove("is-entering");
    elements.filesPage.hidden = true;
  }
  renderFilesBotAdminPanel();
}

function closeClassifiedPageForNavigation() {
  showClassifiedLoadOverlay(false);
  document.body.classList.remove("is-classified");
  setClassifiedSearchOpen(false, { clearQuery: true });
  if (elements.classifiedPage) {
    elements.classifiedPage.classList.remove("is-entering");
    elements.classifiedPage.hidden = true;
  }
}

function showIntelPage({ updateHash = true } = {}) {
  closeClassifiedPageForNavigation();
  hideFilesPage();
  state.view = "intel";
  elements.mainTitle.textContent = t("main_title");
  syncTopTabForCurrentView();
  renderFilesBotAdminPanel();
  if (updateHash) {
    setHashView("intel");
  }
}

function showFilesPage({ updateHash = true } = {}) {
  closeIntelBotInviteModal();
  hideSiloDossier({ updateHash: false });
  closeClassifiedPageForNavigation();
  markFilesDecisionNoticeSeen();
  startFilesLiveIdentityPolling();
  document.body.classList.add("is-files");
  if (elements.filesPage) {
    elements.filesPage.hidden = false;
    elements.filesPage.classList.remove("is-entering");
    void elements.filesPage.offsetWidth;
    elements.filesPage.classList.add("is-entering");
    setTimeout(() => {
      elements.filesPage?.classList.remove("is-entering");
    }, 540);
  }

  state.view = "files";
  elements.mainTitle.textContent = t("files_main_title");
  syncTopTabForCurrentView();
  renderFilesBotAdminPanel();
  renderFilesAccessView();
  void refreshFilesIdentity();
  if (updateHash) {
    setHashView("files");
  }
}

function applyViewFromHash() {
  const hashView = getHashView();
  if (!hashView) {
    setHashView("intel", { replace: true });
    showIntelPage({ updateHash: false });
    hideSiloDossier({ updateHash: false });
    return;
  }

  if (hashView === "files") {
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      return;
    }
    showFilesPage({ updateHash: false });
    return;
  }

  if (hashView === "classified") {
    hideSiloDossier({ updateHash: false });
    if (!state.easterEgg.unlocked && !state.easterEgg.hack?.solved) {
      setHashView("intel", { replace: true });
      showIntelPage({ updateHash: false });
      return;
    }

    if (state.view === "classified" && document.body.classList.contains("is-classified")) {
      return;
    }
    showClassifiedPage({ updateHash: false });
    return;
  }

  if (
    state.view === "intel"
    && !document.body.classList.contains("is-classified")
    && !document.body.classList.contains("is-files")
    && !state.siloDossier.open
  ) {
    return;
  }
  showIntelPage({ updateHash: false });
  hideSiloDossier({ updateHash: false });
}

function buildGuestFilesProfile() {
  return {
    loggedIn: false,
    discordId: "",
    username: "",
    isAdmin: false,
    isAuthorized: false,
    accessRequestStatus: "none",
    accessRequestRequestedAt: "",
    accessRequestDecidedAt: "",
    accessRequestReapplyAt: "",
    accessRequestDeclineReason: "",
    accessDisclaimerDecision: "none",
    accessDisclaimerDecidedAt: "",
    accessDisclaimerReevaluationRequestedAt: "",
    disclaimerRequired: false
  };
}

function normalizeFilesProfile(payload) {
  const fallback = buildGuestFilesProfile();
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return {
    loggedIn: Boolean(payload.loggedIn),
    discordId: String(payload.discordId || ""),
    username: String(payload.username || ""),
    isAdmin: Boolean(payload.isAdmin),
    isAuthorized: Boolean(payload.isAuthorized),
    accessRequestStatus: String(payload.accessRequestStatus || "none").trim().toLowerCase() || "none",
    accessRequestRequestedAt: String(payload.accessRequestRequestedAt || ""),
    accessRequestDecidedAt: String(payload.accessRequestDecidedAt || ""),
    accessRequestReapplyAt: String(payload.accessRequestReapplyAt || ""),
    accessRequestDeclineReason: String(payload.accessRequestDeclineReason || ""),
    accessDisclaimerDecision: String(payload.accessDisclaimerDecision || "none").trim().toLowerCase() || "none",
    accessDisclaimerDecidedAt: String(payload.accessDisclaimerDecidedAt || ""),
    accessDisclaimerReevaluationRequestedAt: String(payload.accessDisclaimerReevaluationRequestedAt || ""),
    disclaimerRequired: Boolean(payload.disclaimerRequired)
  };
}

function normalizeFilesAccessRequestStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "pending" || normalized === "approved" || normalized === "declined") {
    return normalized;
  }
  return "none";
}

function normalizeFilesDisclaimerDecision(decision) {
  const normalized = String(decision || "").trim().toLowerCase();
  if (normalized === "accepted" || normalized === "declined") {
    return normalized;
  }
  return "none";
}

function normalizeFilesBotAdminSubscriptionEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const channelId = String(payload.channelId || "").trim();
  if (!channelId) {
    return null;
  }

  const feeds = Array.isArray(payload.feeds)
    ? payload.feeds.map((feed) => String(feed || "").trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    channelId,
    channelName: String(payload.channelName || "").trim(),
    feeds: feeds.filter((feed) => feed === "silos" || feed === "minerva")
  };
}

function normalizeFilesBotAdminGuildEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const guildId = String(payload.id || "").trim();
  if (!guildId) {
    return null;
  }

  const subscriptions = Array.isArray(payload.subscriptions)
    ? payload.subscriptions.map((entry) => normalizeFilesBotAdminSubscriptionEntry(entry)).filter(Boolean)
    : [];
  const memberCount = Number(payload.memberCount);

  return {
    id: guildId,
    name: String(payload.name || "").trim() || t("files_unknown_value"),
    iconUrl: String(payload.iconUrl || "").trim(),
    ownerId: String(payload.ownerId || "").trim(),
    ownerName: String(payload.ownerName || "").trim(),
    preferredLocale: String(payload.preferredLocale || "").trim(),
    joinedAt: String(payload.joinedAt || "").trim(),
    memberCount: Number.isFinite(memberCount) ? memberCount : null,
    language: String(payload.language || "").trim().toLowerCase() || "",
    subscriptionCount: Number.isFinite(Number(payload.subscriptionCount))
      ? Number(payload.subscriptionCount)
      : subscriptions.length,
    subscriptions
  };
}

function normalizeFilesBotAdminOverview(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const guilds = Array.isArray(payload.guilds)
    ? payload.guilds.map((entry) => normalizeFilesBotAdminGuildEntry(entry)).filter(Boolean)
    : [];

  return {
    enabled: payload.enabled !== false,
    ready: Boolean(payload.ready),
    generatedAt: String(payload.generatedAt || "").trim(),
    inviteLink: String(payload.inviteLink || "").trim(),
    bot: {
      applicationId: String(payload.bot?.applicationId || "").trim(),
      userId: String(payload.bot?.userId || "").trim(),
      username: String(payload.bot?.username || "").trim(),
      tag: String(payload.bot?.tag || "").trim(),
      avatarUrl: String(payload.bot?.avatarUrl || "").trim(),
      defaultLanguage: String(payload.bot?.defaultLanguage || "").trim().toLowerCase() || "",
      pollIntervalMs: Number.isFinite(Number(payload.bot?.pollIntervalMs)) ? Number(payload.bot.pollIntervalMs) : 0,
      postOnStartup: Boolean(payload.bot?.postOnStartup),
      startedAt: String(payload.bot?.startedAt || "").trim(),
      readyAt: String(payload.bot?.readyAt || "").trim(),
      uptimeMs: Number.isFinite(Number(payload.bot?.uptimeMs)) ? Number(payload.bot.uptimeMs) : 0,
      publicBaseUrl: String(payload.bot?.publicBaseUrl || "").trim()
    },
    stats: {
      guildCount: Number.isFinite(Number(payload.stats?.guildCount)) ? Number(payload.stats.guildCount) : guilds.length,
      userCount: Number.isFinite(Number(payload.stats?.userCount)) ? Number(payload.stats.userCount) : 0,
      subscriptionCount: Number.isFinite(Number(payload.stats?.subscriptionCount)) ? Number(payload.stats.subscriptionCount) : 0,
      orphanSubscriptionCount: Number.isFinite(Number(payload.stats?.orphanSubscriptionCount))
        ? Number(payload.stats.orphanSubscriptionCount)
        : 0,
      latencyMs: Number.isFinite(Number(payload.stats?.latencyMs)) ? Number(payload.stats.latencyMs) : null
    },
    state: {
      updatedAt: String(payload.state?.updatedAt || "").trim()
    },
    guilds
  };
}

function clearFilesBotAdminState({ preserveQuery = false } = {}) {
  stopFilesBotAdminLivePolling();
  state.files.botAdmin.loading = false;
  state.files.botAdmin.overview = null;
  if (!preserveQuery) {
    state.files.botAdmin.query = "";
  }
  state.files.botAdmin.selectedGuildId = "";
  state.files.botAdmin.message = "";
  state.files.botAdmin.messageKind = "";
  state.files.botAdmin.busyActionKey = "";
  state.files.botAdmin.lastLoadedAt = 0;
}

function setFilesBotAdminFeedback(message = "", kind = "") {
  state.files.botAdmin.message = String(message || "");
  state.files.botAdmin.messageKind = kind === "success" || kind === "error" ? kind : "";
}

function getFilesBotAdminErrorMessage(error) {
  const status = Number(error?.status);
  if (status === 502) {
    return t("files_bot_admin_worker_offline");
  }

  const message = String(error?.message || "").trim();
  if (status === 503 && message.toLowerCase().includes("not configured")) {
    return t("files_bot_admin_unavailable");
  }

  return message || t("files_bot_admin_unavailable");
}

function formatFilesBotAdminNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return t("files_unknown_value");
  }

  try {
    const locale = state.lang === "es" ? "es-ES" : "en-US";
    return new Intl.NumberFormat(locale).format(numericValue);
  } catch {
    return String(numericValue);
  }
}

function getFilesBotAdminStatusLabel(overview = null) {
  if (!overview?.enabled) {
    return t("files_bot_admin_status_offline");
  }
  if (!overview.ready) {
    return t("files_bot_admin_status_starting");
  }
  return t("files_bot_admin_status_online");
}

function getFilesBotAdminMetaText(overview = null) {
  if (!overview) {
    return state.files.botAdmin.messageKind === "error"
      ? t("files_bot_admin_meta_offline")
      : t("files_bot_admin_meta_loading");
  }
  if (!overview.enabled || !overview.ready) {
    return t("files_bot_admin_meta_starting");
  }

  const tag = overview.bot.tag || overview.bot.username || t("files_unknown_value");
  const snapshotTime = formatFileDateTime(overview.generatedAt || overview.state.updatedAt || overview.bot.readyAt || "");
  return t("files_bot_admin_meta_ready", {
    tag,
    time: snapshotTime
  });
}

function stopFilesBotAdminLivePolling() {
  if (filesBotAdminPollTimer) {
    window.clearInterval(filesBotAdminPollTimer);
    filesBotAdminPollTimer = 0;
  }
}

function startFilesBotAdminLivePolling() {
  stopFilesBotAdminLivePolling();

  const me = normalizeFilesProfile(state.files.me);
  if (!me.isAuthorized || !me.isAdmin) {
    return;
  }
  if (normalizeFilesAdminModalType(state.files.adminModal.active) !== "bot") {
    return;
  }

  filesBotAdminPollTimer = window.setInterval(() => {
    if (document.hidden) {
      return;
    }
    if (normalizeFilesAdminModalType(state.files.adminModal.active) !== "bot") {
      stopFilesBotAdminLivePolling();
      return;
    }
    if (state.files.botAdmin.loading || state.files.botAdmin.busyActionKey) {
      return;
    }
    void refreshFilesBotAdminOverview({ silent: true });
  }, FILES_BOT_ADMIN_POLL_INTERVAL_MS);
}

function getFilesBotAdminFeedLabel(feeds = []) {
  const uniqueFeeds = [...new Set(Array.isArray(feeds) ? feeds.filter(Boolean) : [])];
  if (uniqueFeeds.includes("silos") && uniqueFeeds.includes("minerva")) {
    return t("files_bot_admin_feed_both");
  }
  if (uniqueFeeds.includes("silos")) {
    return t("files_bot_admin_feed_silos");
  }
  if (uniqueFeeds.includes("minerva")) {
    return t("files_bot_admin_feed_minerva");
  }
  return t("files_unknown_value");
}

function getFilteredFilesBotAdminGuilds() {
  const overview = normalizeFilesBotAdminOverview(state.files.botAdmin.overview);
  if (!overview) {
    return [];
  }

  const query = normalizeSearchText(state.files.botAdmin.query || "");
  const tokens = query ? query.split(" ").filter(Boolean) : [];
  if (!tokens.length) {
    return overview.guilds;
  }

  return overview.guilds.filter((guild) => {
    const subscriptionSearch = guild.subscriptions.map((entry) => {
      return [entry.channelId, entry.channelName, getFilesBotAdminFeedLabel(entry.feeds)].join(" ");
    }).join(" ");
    const haystack = normalizeSearchText([
      guild.name,
      guild.id,
      guild.ownerId,
      guild.preferredLocale,
      guild.language,
      subscriptionSearch
    ].join(" "));
    return tokens.every((token) => haystack.includes(token));
  });
}

function setFilesBotAdminSelectedGuildId(guildId, { scrollIntoView = false } = {}) {
  state.files.botAdmin.selectedGuildId = String(guildId || "").trim();
  renderFilesBotAdminPanel();

  if (!scrollIntoView || !state.files.botAdmin.selectedGuildId) {
    return;
  }

  requestAnimationFrame(() => {
    const selector = `[data-files-bot-guild-card="${getFilesBotAdminGuildSelectorValue(state.files.botAdmin.selectedGuildId)}"]`;
    const card = elements.filesBotAdminServerList?.querySelector(selector);
    if (card instanceof HTMLElement) {
      card.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    }
  });
}

function getFilesBotAdminGuildSelectorValue(guildId) {
  const value = String(guildId || "").trim();
  if (!value) {
    return "";
  }
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function hasPendingFilesDisclaimerReevaluation(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  return Boolean(String(me.accessDisclaimerReevaluationRequestedAt || "").trim());
}

function getFilesDecisionSeenStorageKey(discordId) {
  const normalizedId = String(discordId || "").trim();
  if (!normalizedId) {
    return "";
  }
  return `${STORAGE_FILES_DECISION_SEEN_PREFIX}:${normalizedId}`;
}

function getFilesDecisionToken(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  if (!me.loggedIn || !me.discordId) {
    return "";
  }

  const status = normalizeFilesAccessRequestStatus(me.accessRequestStatus);
  if (status !== "approved" && status !== "declined") {
    return "";
  }

  const decidedAt = String(me.accessRequestDecidedAt || "").trim();
  if (!decidedAt) {
    return "";
  }

  return `${me.discordId}:${status}:${decidedAt}`;
}

function readFilesSeenDecisionToken(discordId) {
  const storageKey = getFilesDecisionSeenStorageKey(discordId);
  if (!storageKey) {
    return "";
  }

  try {
    return String(localStorage.getItem(storageKey) || "");
  } catch {
    return "";
  }
}

function writeFilesSeenDecisionToken(discordId, token) {
  const storageKey = getFilesDecisionSeenStorageKey(discordId);
  if (!storageKey) {
    return;
  }

  try {
    localStorage.setItem(storageKey, String(token || ""));
  } catch {
    // no-op
  }
}

function renderFilesDecisionTabBadge() {
  if (!elements.tabStatusDecisionBadge) {
    return;
  }

  const showBadge = Boolean(state.files.decisionNotice.visible);
  elements.tabStatusDecisionBadge.hidden = !showBadge;
  elements.tabStatusDecisionBadge.textContent = showBadge ? "1" : "";
  elements.tabStatusDecisionBadge.setAttribute("aria-label", t("files_decision_badge_aria_label"));
  elements.tabStatusDecisionBadge.title = t("files_decision_badge_aria_label");
}

function syncFilesDecisionNoticeFromProfile(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  const nextToken = getFilesDecisionToken(me);

  if (!nextToken) {
    state.files.decisionNotice.visible = false;
    state.files.decisionNotice.token = "";
    renderFilesDecisionTabBadge();
    return;
  }

  const seenToken = readFilesSeenDecisionToken(me.discordId);
  const alreadySeen = Boolean(seenToken && seenToken === nextToken);
  const currentlyInFilesView = state.view === "files" && document.body.classList.contains("is-files");

  if (currentlyInFilesView || alreadySeen) {
    state.files.decisionNotice.visible = false;
    state.files.decisionNotice.token = nextToken;
    if (currentlyInFilesView && seenToken !== nextToken) {
      writeFilesSeenDecisionToken(me.discordId, nextToken);
    }
    renderFilesDecisionTabBadge();
    return;
  }

  state.files.decisionNotice.visible = true;
  state.files.decisionNotice.token = nextToken;
  renderFilesDecisionTabBadge();
}

function markFilesDecisionNoticeSeen() {
  const me = normalizeFilesProfile(state.files.me);
  const token = getFilesDecisionToken(me);
  if (token && me.discordId) {
    writeFilesSeenDecisionToken(me.discordId, token);
  }
  state.files.decisionNotice.visible = false;
  state.files.decisionNotice.token = token || "";
  renderFilesDecisionTabBadge();
}

function shouldShowFilesDisclaimerGate(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  if (!me.loggedIn) {
    return false;
  }

  if (normalizeFilesAccessRequestStatus(me.accessRequestStatus) !== "approved") {
    return false;
  }

  if (me.isAuthorized) {
    return false;
  }

  const decision = normalizeFilesDisclaimerDecision(me.accessDisclaimerDecision);
  if (me.disclaimerRequired) {
    return decision !== "accepted";
  }

  return decision === "none" || decision === "declined";
}

function getFilesAccessRequestStatusLabel(status) {
  const resolvedStatus = normalizeFilesAccessRequestStatus(status);
  if (resolvedStatus === "approved") {
    return t("files_restricted_status_approved");
  }
  if (resolvedStatus === "declined") {
    return t("files_restricted_status_declined");
  }
  if (resolvedStatus === "pending") {
    return t("files_restricted_status_pending");
  }
  return t("files_restricted_status_none");
}

function resolveFilesReapplyAtMs({ accessRequestStatus, accessRequestDecidedAt, accessRequestReapplyAt } = {}) {
  const explicitMs = Date.parse(String(accessRequestReapplyAt || "").trim());
  if (Number.isFinite(explicitMs) && explicitMs > 0) {
    return explicitMs;
  }

  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  if (resolvedStatus !== "declined") {
    return 0;
  }

  const decidedAtMs = Date.parse(String(accessRequestDecidedAt || "").trim());
  if (!Number.isFinite(decidedAtMs) || decidedAtMs <= 0) {
    return 0;
  }
  return decidedAtMs + FILES_ACCESS_DECLINED_REAPPLY_MS;
}

function getFilesDeclinedCooldownRemainingMs(profile = {}, nowMs = Date.now()) {
  const reapplyAtMs = resolveFilesReapplyAtMs(profile);
  if (!Number.isFinite(reapplyAtMs) || reapplyAtMs <= 0) {
    return 0;
  }
  return Math.max(0, reapplyAtMs - nowMs);
}

function isFilesDeclinedCooldownActive(profile = {}, nowMs = Date.now()) {
  const status = normalizeFilesAccessRequestStatus(profile.accessRequestStatus);
  if (status !== "declined") {
    return false;
  }
  return getFilesDeclinedCooldownRemainingMs(profile, nowMs) > 0;
}

function getFilesSessionStateLabel({ loggedIn, accessRequestStatus }) {
  if (!loggedIn) {
    return t("files_unknown_value");
  }
  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  if (resolvedStatus === "approved") {
    return t("files_session_state_approved");
  }
  if (resolvedStatus === "declined") {
    return t("files_session_state_declined");
  }
  if (resolvedStatus === "pending") {
    return t("files_session_state_pending");
  }
  return t("files_session_state_online");
}

function formatFileSize(byteValue) {
  const bytes = Number(byteValue);
  if (!Number.isFinite(bytes) || bytes < 0) {
    return t("files_unknown_value");
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function formatFileDateTime(value) {
  if (!value) {
    return t("files_unknown_value");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("files_unknown_value");
  }

  try {
    const locale = state.lang === "es" ? "es-ES" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function resolveFileTypeLabel(file) {
  const fileName = String(file.name || file.originalName || "");
  const extensionMatch = /\.([A-Za-z0-9]+)$/.exec(fileName);
  const extension = extensionMatch ? extensionMatch[1].toUpperCase() : "";
  const mimeType = String(file.mimeType || file.type || "").trim();

  if (extension && mimeType) {
    return `${extension} / ${mimeType}`;
  }
  if (extension) {
    return extension;
  }
  if (mimeType) {
    return mimeType;
  }
  return t("files_unknown_value");
}

function getFilesTypeBadgeLabel(file) {
  const fileName = String(file?.name || file?.originalName || "");
  const extensionMatch = /\.([A-Za-z0-9]+)$/.exec(fileName);
  if (extensionMatch && extensionMatch[1]) {
    return extensionMatch[1].toUpperCase();
  }

  const mimeType = String(file?.mimeType || file?.type || "").trim();
  if (!mimeType) {
    return "FILE";
  }

  const mimeToken = mimeType.includes("/") ? mimeType.split("/").pop() : mimeType;
  const compactToken = String(mimeToken || "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)[0]
    .slice(0, 12)
    .toUpperCase();
  return compactToken || "FILE";
}

function normalizeFilesGroup(value) {
  return String(value || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function getFilesGroupKey(groupValue) {
  const normalizedGroup = normalizeFilesGroup(groupValue);
  if (!normalizedGroup) {
    return "__ungrouped__";
  }
  return `group:${normalizeSearchText(normalizedGroup)}`;
}

function getFilesGroupItemCount(groupKey, files = state.files.list) {
  const targetKey = String(groupKey || "").trim();
  if (!targetKey) {
    return 0;
  }
  const source = Array.isArray(files) ? files : [];
  let count = 0;
  for (const file of source) {
    const entryKey = getFilesGroupKey(normalizeFilesGroup(file?.group || ""));
    if (entryKey === targetKey) {
      count += 1;
    }
  }
  return count;
}

function getFilesDisplayName(file) {
  const displayName = String(file?.displayName || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (displayName) {
    return displayName;
  }

  const fallbackName = String(file?.name || file?.originalName || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .trim();
  if (fallbackName) {
    return fallbackName;
  }

  return t("files_unknown_value");
}

function getFilesGroupDisplayLabel(file) {
  const group = normalizeFilesGroup(file?.group || "");
  return group || t("files_group_default");
}

function formatFilesGroupCount(count) {
  const normalizedCount = Math.max(0, Number(count) || 0);
  return t("files_group_count", { n: String(normalizedCount) });
}

function getKnownFileGroups() {
  const groups = new Set();
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  for (const file of baseFiles) {
    const group = normalizeFilesGroup(file?.group || "");
    if (group) {
      groups.add(group);
    }
  }

  return Array.from(groups).sort((left, right) => left.localeCompare(right, state.lang === "es" ? "es" : "en"));
}

function getFilesGroupSuggestionOptions(selectedValue = "") {
  const groups = getKnownFileGroups();
  const normalizedSelected = normalizeFilesGroup(selectedValue);
  const options = [
    {
      value: "",
      label: t("files_group_manager_suggest_placeholder")
    }
  ];

  let hasSelectedOption = !normalizedSelected;
  for (const group of groups) {
    options.push({
      value: group,
      label: group
    });
    if (!hasSelectedOption && group === normalizedSelected) {
      hasSelectedOption = true;
    }
  }

  if (normalizedSelected && !hasSelectedOption) {
    options.push({
      value: normalizedSelected,
      label: normalizedSelected
    });
  }

  return {
    options,
    selectedValue: normalizedSelected
  };
}

function getFilesGroupSuggestTargetInput(dropdownElement) {
  if (!(dropdownElement instanceof HTMLElement)) {
    return null;
  }
  const targetId = String(dropdownElement.getAttribute("data-files-group-suggest-target") || "").trim();
  if (!targetId) {
    return null;
  }
  const targetInput = document.getElementById(targetId);
  return targetInput instanceof HTMLInputElement ? targetInput : null;
}

function setFilesGroupSuggestMenuOpen(dropdownElement, active) {
  if (!(dropdownElement instanceof HTMLElement)) {
    return;
  }
  const toggleBtn = dropdownElement.querySelector("[data-files-group-suggest-toggle]");
  const menu = dropdownElement.querySelector("[data-files-group-suggest-menu]");
  if (!(toggleBtn instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) {
    return;
  }

  const shouldOpen = Boolean(active);
  dropdownElement.classList.toggle("is-open", shouldOpen);
  toggleBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  menu.hidden = !shouldOpen;
}

function closeAllFilesGroupSuggestMenus({ except = null } = {}) {
  const dropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-dropdown]"));
  for (const node of dropdowns) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (except && node === except) {
      continue;
    }
    setFilesGroupSuggestMenuOpen(node, false);
  }
}

function syncFilesGroupSuggestDropdown(dropdownElement, selectedValue = null) {
  if (!(dropdownElement instanceof HTMLElement)) {
    return;
  }

  const currentEl = dropdownElement.querySelector("[data-files-group-suggest-current]");
  const menu = dropdownElement.querySelector("[data-files-group-suggest-menu]");
  const toggleBtn = dropdownElement.querySelector("[data-files-group-suggest-toggle]");
  if (!(menu instanceof HTMLElement)) {
    return;
  }

  const linkedInput = getFilesGroupSuggestTargetInput(dropdownElement);
  const effectiveValue = selectedValue === null
    ? normalizeFilesGroup(linkedInput?.value || "")
    : normalizeFilesGroup(selectedValue);
  const optionState = getFilesGroupSuggestionOptions(effectiveValue);
  const selectedValueKey = optionState.selectedValue || "";
  let selectedLabel = t("files_group_manager_suggest_placeholder");
  const fragment = document.createDocumentFragment();

  for (const option of optionState.options) {
    const row = document.createElement("li");

    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "files-admin-requests-filter-option files-group-suggest-option";
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("data-files-action", "select-group-suggest-option");
    optionButton.setAttribute("data-group-value", option.value);
    optionButton.textContent = option.label;

    const isSelected = option.value === selectedValueKey;
    if (isSelected) {
      selectedLabel = option.label;
      optionButton.classList.add("is-selected");
    }
    optionButton.setAttribute("aria-selected", isSelected ? "true" : "false");

    row.appendChild(optionButton);
    fragment.appendChild(row);
  }

  menu.replaceChildren(fragment);
  if (currentEl instanceof HTMLElement) {
    currentEl.textContent = selectedLabel;
  }
  if (toggleBtn instanceof HTMLButtonElement) {
    toggleBtn.setAttribute("aria-label", selectedLabel || t("files_group_manager_suggest_placeholder"));
    toggleBtn.title = selectedLabel || t("files_group_manager_suggest_placeholder");
  }
}

function createFilesGroupSuggestionDropdown(targetInputId, selectedValue = "") {
  const dropdown = document.createElement("div");
  dropdown.className = "files-admin-requests-filter-dropdown files-group-suggest-dropdown";
  dropdown.setAttribute("data-files-group-suggest-dropdown", "true");
  dropdown.setAttribute("data-files-group-suggest-target", targetInputId);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "files-admin-requests-filter-trigger files-group-suggest-trigger";
  toggleBtn.setAttribute("data-files-action", "toggle-group-suggest-menu");
  toggleBtn.setAttribute("data-files-group-suggest-toggle", "true");
  toggleBtn.setAttribute("aria-haspopup", "listbox");
  toggleBtn.setAttribute("aria-expanded", "false");

  const current = document.createElement("span");
  current.setAttribute("data-files-group-suggest-current", "true");
  current.textContent = t("files_group_manager_suggest_placeholder");
  toggleBtn.appendChild(current);

  const caret = document.createElement("span");
  caret.className = "files-admin-requests-filter-caret";
  caret.setAttribute("aria-hidden", "true");
  caret.textContent = "▾";
  toggleBtn.appendChild(caret);

  const menu = document.createElement("ul");
  menu.className = "files-admin-requests-filter-menu files-group-suggest-menu";
  menu.setAttribute("data-files-group-suggest-menu", "true");
  menu.setAttribute("role", "listbox");
  menu.hidden = true;

  dropdown.appendChild(toggleBtn);
  dropdown.appendChild(menu);
  syncFilesGroupSuggestDropdown(dropdown, selectedValue);
  return dropdown;
}

function syncFilesGroupSuggestions() {
  const dropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-dropdown]"));
  for (const node of dropdowns) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    syncFilesGroupSuggestDropdown(node);
  }
}

function getFilesGroupManagerVisibleFileIds() {
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  const filteredFiles = getFilteredFilesList(baseFiles);
  const ids = [];
  for (const file of filteredFiles) {
    const fileId = String(file?.id || "").trim();
    if (fileId) {
      ids.push(fileId);
    }
  }
  return ids;
}

function getFilesActiveGroupFileIds() {
  const activeGroupKey = String(state.files.activeGroupKey || "").trim();
  if (!activeGroupKey) {
    return [];
  }

  const ids = [];
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  for (const file of baseFiles) {
    if (getFilesGroupKey(file?.group || "") !== activeGroupKey) {
      continue;
    }
    const fileId = String(file?.id || "").trim();
    if (fileId) {
      ids.push(fileId);
    }
  }
  return ids;
}

function getFilesActiveGroupContext() {
  const activeGroupKey = String(state.files.activeGroupKey || "").trim();
  if (!activeGroupKey) {
    return null;
  }

  const files = [];
  let groupLabel = "";
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  for (const file of baseFiles) {
    if (getFilesGroupKey(file?.group || "") !== activeGroupKey) {
      continue;
    }
    files.push(file);
    if (!groupLabel) {
      groupLabel = getFilesGroupDisplayLabel(file);
    }
  }

  if (!files.length) {
    return null;
  }

  return {
    key: activeGroupKey,
    label: groupLabel || t("files_group_default"),
    files
  };
}

function resolveFilesGroupManagerFileStatus(file, targetGroup = "") {
  const currentGroup = normalizeFilesGroup(file?.group || "");
  const currentGroupLabel = currentGroup || t("files_group_default");
  const normalizedTarget = normalizeFilesGroup(targetGroup);

  if (!normalizedTarget) {
    return {
      kind: currentGroup ? "other" : "none",
      text: t("files_group_manager_status_current", { group: currentGroupLabel })
    };
  }

  if (getFilesGroupKey(currentGroup) === getFilesGroupKey(normalizedTarget)) {
    return {
      kind: "match",
      text: t("files_group_manager_status_in_target")
    };
  }

  if (currentGroup) {
    return {
      kind: "other",
      text: t("files_group_manager_status_other", { group: currentGroupLabel })
    };
  }

  return {
    kind: "none",
    text: t("files_group_manager_status_none")
  };
}

function clearFilesGroupManagerState({ clearTargetGroup = true } = {}) {
  state.files.groupManager.selectedIds = [];
  state.files.groupManager.busy = false;
  if (clearTargetGroup) {
    state.files.groupManager.targetGroup = "";
  }
}

function clearFilesGroupRenameState({ closeModal = true } = {}) {
  state.files.groupRename.busy = false;
  state.files.groupRename.key = "";
  if (closeModal) {
    state.files.groupRename.open = false;
  }
  state.files.groupRename.label = "";
  state.files.groupRename.value = "";
  state.files.groupRename.message = "";
  state.files.groupRename.messageKind = "";
}

function setFilesGroupRenameFeedback(message = "", kind = "") {
  state.files.groupRename.message = String(message || "");
  state.files.groupRename.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";
}

function getFilesGroupEntriesByKey(groupKey) {
  const targetKey = String(groupKey || "").trim();
  if (!targetKey) {
    return [];
  }

  const source = Array.isArray(state.files.list) ? state.files.list : [];
  return source.filter((file) => getFilesGroupKey(file?.group || "") === targetKey);
}

function renderFilesGroupRenameModal() {
  const modalState = state.files.groupRename;
  const isOpen = Boolean(modalState.open);
  const groupLabel = normalizeFilesGroup(modalState.label || "") || t("files_group_default");

  document.body.classList.toggle("is-files-group-rename-open", isOpen);

  if (elements.filesGroupRenameTitle) {
    elements.filesGroupRenameTitle.textContent = t("files_group_rename_modal_title");
  }
  if (elements.filesGroupRenameMessage) {
    elements.filesGroupRenameMessage.textContent = t("files_group_rename_modal_body", { group: groupLabel });
  }
  if (elements.filesGroupRenameLabel) {
    elements.filesGroupRenameLabel.textContent = t("files_group_rename_modal_label");
  }
  if (elements.filesGroupRenameInput) {
    elements.filesGroupRenameInput.placeholder = t("files_group_rename_modal_placeholder");
    if (elements.filesGroupRenameInput.value !== String(modalState.value || "")) {
      elements.filesGroupRenameInput.value = String(modalState.value || "");
    }
    elements.filesGroupRenameInput.disabled = Boolean(modalState.busy);
  }
  if (elements.filesGroupRenameCancelBtn) {
    elements.filesGroupRenameCancelBtn.textContent = t("files_group_rename_modal_cancel");
    elements.filesGroupRenameCancelBtn.disabled = Boolean(modalState.busy);
  }
  if (elements.filesGroupRenameConfirmBtn) {
    elements.filesGroupRenameConfirmBtn.textContent = modalState.busy
      ? t("files_group_rename_modal_confirm_busy")
      : t("files_group_rename_modal_confirm");
    elements.filesGroupRenameConfirmBtn.disabled = Boolean(modalState.busy);
  }
  if (elements.filesGroupRenameFeedback) {
    const message = String(modalState.message || "");
    const hasMessage = Boolean(message);
    elements.filesGroupRenameFeedback.hidden = !hasMessage;
    elements.filesGroupRenameFeedback.textContent = message;
    elements.filesGroupRenameFeedback.classList.toggle("is-error", modalState.messageKind === "error");
    elements.filesGroupRenameFeedback.classList.toggle("is-success", modalState.messageKind === "success");
  }
  if (elements.filesGroupRenameOverlay) {
    elements.filesGroupRenameOverlay.classList.toggle("is-active", isOpen);
    elements.filesGroupRenameOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function openFilesGroupRenameModal(groupKey, fallbackGroupLabel = "") {
  if (!state.files.me?.isAdmin || state.files.groupRename.busy) {
    return;
  }

  const targetGroupKey = String(groupKey || "").trim();
  if (!targetGroupKey || targetGroupKey === "__ungrouped__") {
    return;
  }

  const filesInGroup = getFilesGroupEntriesByKey(targetGroupKey);
  if (!filesInGroup.length) {
    return;
  }

  const resolvedLabel = normalizeFilesGroup(filesInGroup[0]?.group || "") || normalizeFilesGroup(fallbackGroupLabel || "");
  if (!resolvedLabel) {
    return;
  }

  state.files.groupRename.open = true;
  state.files.groupRename.key = targetGroupKey;
  state.files.groupRename.label = resolvedLabel;
  state.files.groupRename.value = resolvedLabel;
  setFilesGroupRenameFeedback("", "");
  renderFilesGroupRenameModal();

  if (elements.filesGroupRenameInput instanceof HTMLInputElement) {
    focusFilesOpenTarget(elements.filesGroupRenameInput, {
      fallback: elements.filesGroupRenameCancelBtn,
      selectText: true
    });
  }
}

function closeFilesGroupRenameModal({ force = false } = {}) {
  if (state.files.groupRename.busy && !force) {
    return;
  }

  clearFilesGroupRenameState({ closeModal: true });
  renderFilesGroupRenameModal();
}

function isDesktopModalViewport() {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(min-width: 1025px)").matches;
  }
  return (Number(window.innerWidth) || 0) >= 1025;
}

function isFilesBotAdminMobileViewport() {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(max-width: 860px)").matches;
  }
  return (Number(window.innerWidth) || 0) <= 860;
}

function canUseFilesBotAdmin(profile, { requireDesktop = false } = {}) {
  const me = normalizeFilesProfile(profile);
  const canUseBotAdmin = Boolean(me.loggedIn && me.isAuthorized && me.isAdmin);
  if (!canUseBotAdmin) {
    return false;
  }
  return !requireDesktop || !isFilesBotAdminMobileViewport();
}

function shouldAvoidTextInputFocusOnOpen() {
  if (typeof window.matchMedia === "function") {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches) {
      return true;
    }
  }
  return !isDesktopModalViewport();
}

function focusFilesOpenTarget(inputTarget, { fallback = null, selectText = false } = {}) {
  const preferredTarget = shouldAvoidTextInputFocusOnOpen() && fallback instanceof HTMLElement
    ? fallback
    : inputTarget instanceof HTMLElement
      ? inputTarget
      : fallback instanceof HTMLElement
        ? fallback
        : null;

  if (!(preferredTarget instanceof HTMLElement)) {
    return;
  }

  try {
    preferredTarget.focus({ preventScroll: true });
  } catch {
    preferredTarget.focus();
  }

  if (preferredTarget === inputTarget && selectText && typeof inputTarget?.select === "function") {
    inputTarget.select();
  }
}

function scheduleFilesListPostMutationRefresh() {
  if (!shouldAvoidTextInputFocusOnOpen() || typeof window.requestAnimationFrame !== "function") {
    return;
  }

  const currentScrollTop = elements.filesList instanceof HTMLElement
    ? elements.filesList.scrollTop
    : 0;

  requestAnimationFrame(() => {
    renderFilesList();
    renderFilesGroupManagerPanel();
    if (elements.filesList instanceof HTMLElement) {
      elements.filesList.scrollTop = currentScrollTop;
      void elements.filesList.offsetHeight;
    }
  });
}

function renderFilesDisclaimerModal() {
  const me = normalizeFilesProfile(state.files.me);
  const canShowDisclaimer = Boolean(me.isAuthorized);
  const isOpen = canShowDisclaimer && Boolean(state.files.disclaimerModal.open);
  state.files.disclaimerModal.open = isOpen;
  document.body.classList.toggle("is-files-disclaimer-open", isOpen);

  if (elements.filesDisclaimerBtn) {
    elements.filesDisclaimerBtn.hidden = !canShowDisclaimer;
    elements.filesDisclaimerBtn.classList.toggle("is-active", isOpen);
    elements.filesDisclaimerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    elements.filesDisclaimerBtn.setAttribute("aria-label", t("files_disclaimer_button"));
  }
  if (elements.filesDisclaimerOverlay) {
    elements.filesDisclaimerOverlay.classList.toggle("is-active", isOpen);
    elements.filesDisclaimerOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function openFilesDisclaimerModal() {
  const me = normalizeFilesProfile(state.files.me);
  if (!me.isAuthorized) {
    return;
  }
  state.files.disclaimerModal.open = true;
  renderFilesDisclaimerModal();
}

function closeFilesDisclaimerModal() {
  state.files.disclaimerModal.open = false;
  renderFilesDisclaimerModal();
}

function normalizeFilesEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const id = String(payload.id || "").trim();
  if (!id) {
    return null;
  }

  return {
    id,
    name: String(payload.name || payload.originalName || "").trim(),
    displayName: String(payload.displayName || "").trim(),
    mimeType: String(payload.mimeType || payload.type || "").trim(),
    size: Math.max(0, Number(payload.size) || 0),
    uploadedAt: String(payload.uploadedAt || payload.uploaded_at || "").trim(),
    updatedAt: String(payload.updatedAt || payload.updated_at || payload.uploadedAt || "").trim(),
    description: String(payload.description || ""),
    group: normalizeFilesGroup(payload.group),
    uploader: String(payload.uploader || payload.uploaderDiscordId || "").trim(),
    imageUrl: String(payload.imageUrl || "").trim(),
    imageName: String(payload.imageName || "").trim(),
    hasImage: Boolean(payload.hasImage || payload.imageUrl)
  };
}

function setFilesUploadFeedback(message = "", kind = "") {
  if (filesUploadFeedbackTimer) {
    clearTimeout(filesUploadFeedbackTimer);
    filesUploadFeedbackTimer = null;
  }

  state.files.uploadMessage = String(message || "");
  state.files.uploadMessageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";

  if (!state.files.uploadMessage) {
    return;
  }

  filesUploadFeedbackTimer = setTimeout(() => {
    filesUploadFeedbackTimer = null;
    state.files.uploadMessage = "";
    state.files.uploadMessageKind = "";
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      renderFilesAccessView();
    }
  }, FILES_UPLOAD_FEEDBACK_AUTO_HIDE_MS);
}

function setFilesRestrictedRequestFeedback(message = "", kind = "") {
  state.files.accessRequestMessage = String(message || "");
  state.files.accessRequestMessageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";
}

function setFilesAdminRequestsFeedback(message = "", kind = "") {
  if (filesAdminRequestsFeedbackTimer) {
    clearTimeout(filesAdminRequestsFeedbackTimer);
    filesAdminRequestsFeedbackTimer = null;
  }

  state.files.adminRequests.message = String(message || "");
  state.files.adminRequests.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";

  if (!state.files.adminRequests.message) {
    return;
  }

  filesAdminRequestsFeedbackTimer = setTimeout(() => {
    filesAdminRequestsFeedbackTimer = null;
    state.files.adminRequests.message = "";
    state.files.adminRequests.messageKind = "";
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      renderFilesAccessView();
    }
  }, FILES_ADMIN_REQUESTS_FEEDBACK_AUTO_HIDE_MS);
}

function normalizeFilesAdminRequestsFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "pending"
    || normalized === "approved"
    || normalized === "declined"
    || normalized === "authorized"
    || normalized === "all"
  ) {
    return normalized;
  }
  return "pending";
}

function getFilesAdminRequestsFilterLabel(filter) {
  const resolvedFilter = normalizeFilesAdminRequestsFilter(filter);
  if (resolvedFilter === "approved") {
    return t("files_admin_requests_filter_approved");
  }
  if (resolvedFilter === "declined") {
    return t("files_admin_requests_filter_declined");
  }
  if (resolvedFilter === "authorized") {
    return t("files_admin_requests_filter_authorized");
  }
  if (resolvedFilter === "all") {
    return t("files_admin_requests_filter_all");
  }
  return t("files_admin_requests_filter_pending");
}

function setFilesAdminRequestsFilterMenuOpen(active) {
  if (!elements.filesAdminRequestsFilterDropdown || !elements.filesAdminRequestsFilterBtn || !elements.filesAdminRequestsFilterMenu) {
    return;
  }

  const shouldOpen = Boolean(active);
  elements.filesAdminRequestsFilterDropdown.classList.toggle("is-open", shouldOpen);
  elements.filesAdminRequestsFilterBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  elements.filesAdminRequestsFilterMenu.hidden = !shouldOpen;
}

function syncFilesAdminRequestsFilterMenu() {
  const resolvedFilter = normalizeFilesAdminRequestsFilter(state.files.adminRequests.filter);
  state.files.adminRequests.filter = resolvedFilter;

  if (elements.filesAdminRequestsFilter) {
    elements.filesAdminRequestsFilter.value = resolvedFilter;
  }
  if (elements.filesAdminRequestsFilterCurrent) {
    elements.filesAdminRequestsFilterCurrent.textContent = getFilesAdminRequestsFilterLabel(resolvedFilter);
  }
  if (!Array.isArray(elements.filesAdminRequestsFilterOptions)) {
    return;
  }

  elements.filesAdminRequestsFilterOptions.forEach((option) => {
    const selected = normalizeFilesAdminRequestsFilter(option.dataset.filter || "") === resolvedFilter;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function setFilesAdminRequestsFilterValue(nextFilter, { render = true, closeMenu = true } = {}) {
  state.files.adminRequests.filter = normalizeFilesAdminRequestsFilter(nextFilter);
  syncFilesAdminRequestsFilterMenu();
  if (closeMenu) {
    setFilesAdminRequestsFilterMenuOpen(false);
  }
  if (render) {
    renderFilesAdminRequestsPanel();
  }
}

function normalizeFilesAdminRequestSource(source) {
  const normalized = String(source || "").trim().toLowerCase();
  if (normalized === "allowlist") {
    return "allowlist";
  }
  return "request";
}

function normalizeFilesAdminRequestEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const discordId = String(payload.discordId || "").trim();
  const requestId = String(payload.requestId || "").trim();
  if (!discordId) {
    return null;
  }

  return {
    requestId,
    discordId,
    nick: String(payload.nick || "").trim(),
    username: String(payload.username || "").trim(),
    email: String(payload.email || "").trim(),
    reason: String(payload.reason || "").trim(),
    declineReason: String(payload.declineReason || "").trim(),
    status: normalizeFilesAccessRequestStatus(payload.status),
    requestedAt: String(payload.requestedAt || "").trim(),
    decidedAt: String(payload.decidedAt || "").trim(),
    source: normalizeFilesAdminRequestSource(payload.source),
    canApprove: Boolean(payload.canApprove),
    canDecline: Boolean(payload.canDecline),
    canUnauthorize: Boolean(payload.canUnauthorize),
    canAllowReapply: Boolean(payload.canAllowReapply)
  };
}

function openFilesAdminRequestsDeclineComposer(requestId, { focus = true } = {}) {
  const normalizedRequestId = String(requestId || "").trim();
  if (!normalizedRequestId) {
    return;
  }

  const alreadyOpen = state.files.adminRequests.declineComposerRequestId === normalizedRequestId;
  state.files.adminRequests.declineComposerRequestId = alreadyOpen ? "" : normalizedRequestId;
  if (alreadyOpen) {
    state.files.adminRequests.declineComposerValue = "";
    renderFilesAccessView();
    return;
  }

  state.files.adminRequests.declineComposerValue = "";
  renderFilesAccessView();
  if (!focus || !elements.filesAdminRequestsList) {
    return;
  }

  requestAnimationFrame(() => {
    const textareaList = elements.filesAdminRequestsList.querySelectorAll("textarea[data-files-admin-decline-input=\"true\"]");
    const targetTextarea = Array.from(textareaList).find((node) => {
      return String(node.getAttribute("data-request-id") || "").trim() === normalizedRequestId;
    });
    if (targetTextarea instanceof HTMLTextAreaElement) {
      targetTextarea.focus();
      targetTextarea.selectionStart = targetTextarea.value.length;
      targetTextarea.selectionEnd = targetTextarea.value.length;
    }
  });
}

function closeFilesAdminRequestsDeclineComposer({ render = true } = {}) {
  state.files.adminRequests.declineComposerRequestId = "";
  state.files.adminRequests.declineComposerValue = "";
  if (render) {
    renderFilesAccessView();
  }
}

function clearFilesAdminRequestsState() {
  if (filesAdminRequestsFeedbackTimer) {
    clearTimeout(filesAdminRequestsFeedbackTimer);
    filesAdminRequestsFeedbackTimer = null;
  }
  state.files.adminRequests.loading = false;
  state.files.adminRequests.list = [];
  state.files.adminRequests.declineComposerRequestId = "";
  state.files.adminRequests.declineComposerValue = "";
  state.files.adminRequests.busyActionKey = "";
  state.files.adminRequests.message = "";
  state.files.adminRequests.messageKind = "";
}

function normalizeFilesAdminModalType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "upload" || normalized === "requests" || normalized === "bot") {
    return normalized;
  }
  return "";
}

function getFilesPendingAdminRequestCount() {
  const entries = Array.isArray(state.files.adminRequests.list) ? state.files.adminRequests.list : [];
  let pendingCount = 0;
  for (const entry of entries) {
    if (normalizeFilesAccessRequestStatus(entry?.status) === "pending") {
      pendingCount += 1;
    }
  }
  return pendingCount;
}

function renderFilesAdminModals() {
  const me = normalizeFilesProfile(state.files.me);
  const canUseAdminTools = Boolean(me.isAuthorized && me.isAdmin);
  const canUseBotAdmin = canUseFilesBotAdmin(me, { requireDesktop: true });
  let activeModal = canUseAdminTools
    ? normalizeFilesAdminModalType(state.files.adminModal.active)
    : "";
  if (activeModal === "bot" && !canUseBotAdmin) {
    activeModal = "";
  }
  state.files.adminModal.active = activeModal;

  const uploadOpen = activeModal === "upload";
  const requestsOpen = activeModal === "requests";
  const botOpen = canUseBotAdmin && activeModal === "bot";
  const modalOpen = uploadOpen || requestsOpen || botOpen;
  const pendingCount = getFilesPendingAdminRequestCount();
  const pendingBadgeText = pendingCount > 99 ? "99+" : String(pendingCount);

  document.body.classList.toggle("is-files-admin-modal-open", modalOpen);

  if (elements.filesAdminToolsPanel) {
    elements.filesAdminToolsPanel.hidden = !canUseAdminTools;
  }
  if (elements.filesAdminConsoleModalBtn) {
    elements.filesAdminConsoleModalBtn.classList.toggle("is-active", uploadOpen);
    elements.filesAdminConsoleModalBtn.setAttribute("aria-expanded", uploadOpen ? "true" : "false");
  }
  if (elements.filesAccessControlModalBtn) {
    elements.filesAccessControlModalBtn.classList.toggle("is-active", requestsOpen);
    elements.filesAccessControlModalBtn.setAttribute("aria-expanded", requestsOpen ? "true" : "false");
    const showBadge = canUseAdminTools && pendingCount > 0;
    elements.filesAccessControlModalBtn.classList.toggle("has-pending-badge", showBadge);
    const baseLabel = t("files_admin_requests_title");
    const fullLabel = pendingCount > 0
      ? `${baseLabel}. ${t("files_admin_requests_pending_badge", { n: pendingCount })}`
      : baseLabel;
    elements.filesAccessControlModalBtn.setAttribute("aria-label", fullLabel);
  }
  if (elements.filesAccessControlPendingBadge) {
    const showBadge = canUseAdminTools && pendingCount > 0;
    elements.filesAccessControlPendingBadge.hidden = !showBadge;
    elements.filesAccessControlPendingBadge.textContent = showBadge ? pendingBadgeText : "0";
    const badgeLabel = t("files_admin_requests_pending_badge", { n: pendingCount });
    elements.filesAccessControlPendingBadge.setAttribute("aria-label", badgeLabel);
    elements.filesAccessControlPendingBadge.title = badgeLabel;
  }
  if (elements.filesBotAdminModalBtn) {
    elements.filesBotAdminModalBtn.classList.toggle("is-active", botOpen);
    elements.filesBotAdminModalBtn.setAttribute("aria-expanded", botOpen ? "true" : "false");
  }
  if (elements.filesBotAdminFloatingBtn) {
    elements.filesBotAdminFloatingBtn.classList.toggle("is-active", botOpen);
    elements.filesBotAdminFloatingBtn.setAttribute("aria-expanded", botOpen ? "true" : "false");
  }
  if (elements.filesUploadOverlay) {
    elements.filesUploadOverlay.classList.toggle("is-active", uploadOpen);
    elements.filesUploadOverlay.setAttribute("aria-hidden", uploadOpen ? "false" : "true");
  }
  if (elements.filesAdminRequestsOverlay) {
    elements.filesAdminRequestsOverlay.classList.toggle("is-active", requestsOpen);
    elements.filesAdminRequestsOverlay.setAttribute("aria-hidden", requestsOpen ? "false" : "true");
  }
  if (elements.filesBotAdminOverlay) {
    elements.filesBotAdminOverlay.classList.toggle("is-active", botOpen);
    elements.filesBotAdminOverlay.setAttribute("aria-hidden", botOpen ? "false" : "true");
  }
  if (!requestsOpen) {
    setFilesAdminRequestsFilterMenuOpen(false);
  }
  if (!uploadOpen) {
    closeAllFilesGroupSuggestMenus();
  }
  renderFilesBotAdminPanel();
}

function setFilesAdminModalOpen(nextModal, { focus = true } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  const canUseAdminTools = Boolean(me.isAuthorized && me.isAdmin);
  let normalizedModal = canUseAdminTools ? normalizeFilesAdminModalType(nextModal) : "";
  if (normalizedModal === "bot" && !canUseFilesBotAdmin(me, { requireDesktop: true })) {
    normalizedModal = "";
  }
  state.files.adminModal.active = normalizedModal;
  if (normalizedModal === "bot") {
    startFilesBotAdminLivePolling();
  } else {
    stopFilesBotAdminLivePolling();
  }
  renderFilesAdminModals();

  if (!normalizedModal || !focus) {
    return;
  }

  if (normalizedModal === "upload") {
    if (elements.filesUploadInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(elements.filesUploadInput, {
        fallback: elements.filesUploadModalCloseBtn
      });
    }
    return;
  }

  if (normalizedModal === "requests") {
    if (!state.files.adminRequests.loading) {
      void refreshFilesAdminRequests({ silent: true });
    }
    if (elements.filesAdminRequestsSearchInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(elements.filesAdminRequestsSearchInput, {
        fallback: elements.filesAdminRequestsModalCloseBtn,
        selectText: true
      });
    }
    return;
  }

  if (normalizedModal === "bot") {
    const shouldRefresh = !state.files.botAdmin.overview
      || (Date.now() - Number(state.files.botAdmin.lastLoadedAt || 0)) > 60 * 1000;
    if (!state.files.botAdmin.loading && shouldRefresh) {
      void refreshFilesBotAdminOverview({ silent: true });
    }
    if (elements.filesBotAdminSearchInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(elements.filesBotAdminSearchInput, {
        fallback: elements.filesBotAdminModalCloseBtn,
        selectText: true
      });
    }
  }
}

function closeFilesAdminModal() {
  closeFilesBotAdminLeaveModal({ force: true });
  setFilesAdminModalOpen("", { focus: false });
}

function getFilesAdminRequestStatusLabel(status) {
  const normalized = normalizeFilesAccessRequestStatus(status);
  if (normalized === "approved") {
    return t("files_admin_requests_status_approved");
  }
  if (normalized === "declined") {
    return t("files_admin_requests_status_declined");
  }
  if (normalized === "pending") {
    return t("files_admin_requests_status_pending");
  }
  return t("files_unknown_value");
}

function getFilesAdminRequestSearchText(entry) {
  return normalizeSearchText([
    entry.nick,
    entry.username,
    entry.discordId,
    entry.email,
    entry.reason,
    entry.declineReason
  ].join(" "));
}

function getFilteredFilesAdminRequestsList() {
  const source = Array.isArray(state.files.adminRequests.list) ? state.files.adminRequests.list : [];
  const filter = normalizeFilesAdminRequestsFilter(state.files.adminRequests.filter);
  const query = normalizeSearchText(state.files.adminRequests.query || "");
  const tokens = query ? query.split(" ").filter(Boolean) : [];

  return source.filter((entry) => {
    if (filter === "pending" && entry.status !== "pending") {
      return false;
    }
    if (filter === "approved" && entry.status !== "approved") {
      return false;
    }
    if (filter === "declined" && entry.status !== "declined") {
      return false;
    }
    if (filter === "authorized" && entry.status !== "approved") {
      return false;
    }
    if (!tokens.length) {
      return true;
    }

    const haystack = getFilesAdminRequestSearchText(entry);
    return tokens.every((token) => haystack.includes(token));
  });
}

function renderFilesAdminRequestsPanel() {
  if (!elements.filesAdminRequestsPanel) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const showPanel = Boolean(me.isAuthorized && me.isAdmin);
  elements.filesAdminRequestsPanel.hidden = !showPanel;
  if (!showPanel) {
    setFilesAdminRequestsFilterMenuOpen(false);
    return;
  }

  if (state.files.adminRequests.declineComposerRequestId) {
    const hasComposerEntry = state.files.adminRequests.list.some((entry) => {
      return String(entry?.requestId || "").trim() === state.files.adminRequests.declineComposerRequestId;
    });
    if (!hasComposerEntry) {
      state.files.adminRequests.declineComposerRequestId = "";
      state.files.adminRequests.declineComposerValue = "";
    }
  }

  syncFilesAdminRequestsFilterMenu();

  if (elements.filesAdminRequestsSearchInput) {
    const nextQuery = String(state.files.adminRequests.query || "");
    if (elements.filesAdminRequestsSearchInput.value !== nextQuery) {
      elements.filesAdminRequestsSearchInput.value = nextQuery;
    }
  }

  if (elements.filesAdminRequestsRefreshBtn) {
    elements.filesAdminRequestsRefreshBtn.disabled = state.files.adminRequests.loading;
  }

  if (elements.filesAdminRequestsFeedback) {
    const message = String(state.files.adminRequests.message || "");
    const hasMessage = Boolean(message);
    elements.filesAdminRequestsFeedback.hidden = !hasMessage;
    elements.filesAdminRequestsFeedback.textContent = message;
    elements.filesAdminRequestsFeedback.classList.toggle("is-success", state.files.adminRequests.messageKind === "success");
    elements.filesAdminRequestsFeedback.classList.toggle("is-error", state.files.adminRequests.messageKind === "error");
  }

  if (!elements.filesAdminRequestsList) {
    return;
  }

  if (state.files.adminRequests.loading) {
    elements.filesAdminRequestsList.innerHTML = `<p class="files-admin-requests-empty">${t("files_admin_requests_loading")}</p>`;
    return;
  }

  const visibleEntries = getFilteredFilesAdminRequestsList();
  if (!visibleEntries.length) {
    elements.filesAdminRequestsList.innerHTML = `<p class="files-admin-requests-empty">${t("files_admin_requests_empty")}</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < visibleEntries.length; index += 1) {
    const entry = visibleEntries[index];
    const identity = entry.nick || entry.username || entry.discordId || t("files_unknown_value");
    const statusLabel = getFilesAdminRequestStatusLabel(entry.status);
    const sourceLabel = entry.source === "allowlist"
      ? t("files_admin_requests_source_allowlist")
      : t("files_admin_requests_source_request");
    const requestedAt = formatFileDateTime(entry.requestedAt);
    const decidedAt = entry.decidedAt ? formatFileDateTime(entry.decidedAt) : t("files_unknown_value");
    const emailText = entry.email || t("files_unknown_value");
    const reasonText = entry.reason || t("files_unknown_value");
    const declineReasonText = String(entry.declineReason || "").trim();
    const itemKey = entry.requestId || entry.discordId;
    const rowBusy = Boolean(state.files.adminRequests.busyActionKey) && state.files.adminRequests.busyActionKey === itemKey;
    const isDeclineComposerOpen = Boolean(entry.requestId)
      && state.files.adminRequests.declineComposerRequestId === entry.requestId;

    const card = document.createElement("article");
    card.className = "files-admin-request-item";
    card.style.setProperty("--files-admin-request-index", String(Math.min(index, 11)));

    const top = document.createElement("div");
    top.className = "files-admin-request-top";
    const name = document.createElement("p");
    name.className = "files-admin-request-name";
    name.textContent = identity;
    const badges = document.createElement("div");
    badges.className = "files-admin-request-badges";
    const statusBadge = document.createElement("span");
    statusBadge.className = `files-admin-request-badge is-${entry.status}`;
    statusBadge.textContent = statusLabel;
    const sourceBadge = document.createElement("span");
    sourceBadge.className = "files-admin-request-badge is-source";
    sourceBadge.textContent = sourceLabel;
    badges.appendChild(statusBadge);
    badges.appendChild(sourceBadge);
    top.appendChild(name);
    top.appendChild(badges);

    const meta = document.createElement("div");
    meta.className = "files-admin-request-meta";
    const metaRows = [
      [t("files_session_id_label"), entry.discordId || t("files_unknown_value")],
      [t("files_admin_requests_meta_email"), emailText],
      [t("files_admin_requests_meta_requested"), requestedAt],
      [t("files_admin_requests_meta_decided"), decidedAt]
    ];
    for (const [label, value] of metaRows) {
      const row = document.createElement("div");
      const key = document.createElement("span");
      key.textContent = label;
      const val = document.createElement("strong");
      val.textContent = value;
      row.appendChild(key);
      row.appendChild(val);
      meta.appendChild(row);
    }

    const reason = document.createElement("p");
    reason.className = "files-admin-request-reason";
    const reasonLabel = document.createElement("span");
    reasonLabel.textContent = t("files_admin_requests_meta_reason");
    reason.appendChild(reasonLabel);
    reason.appendChild(document.createTextNode(reasonText));

    let declineReason = null;
    if (declineReasonText && declineReasonText !== reasonText) {
      declineReason = document.createElement("p");
      declineReason.className = "files-admin-request-reason";
      const declineReasonLabel = document.createElement("span");
      declineReasonLabel.textContent = t("files_admin_requests_meta_decline_reason");
      declineReason.appendChild(declineReasonLabel);
      declineReason.appendChild(document.createTextNode(declineReasonText));
    }

    const actions = document.createElement("div");
    actions.className = "files-admin-request-actions";

    if (entry.canApprove && entry.requestId) {
      const approveBtn = document.createElement("button");
      approveBtn.type = "button";
      approveBtn.className = "files-card-action files-admin-request-action";
      approveBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_approve");
      approveBtn.dataset.filesAdminAction = "approve";
      approveBtn.dataset.requestId = entry.requestId;
      approveBtn.dataset.actionKey = itemKey;
      approveBtn.disabled = rowBusy || state.files.adminRequests.loading;
      actions.appendChild(approveBtn);
    }

    if (entry.canDecline && entry.requestId) {
      if (!isDeclineComposerOpen) {
        const denyBtn = document.createElement("button");
        denyBtn.type = "button";
        denyBtn.className = "files-card-action files-admin-request-action is-delete";
        denyBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_deny");
        denyBtn.dataset.filesAdminAction = "deny-open";
        denyBtn.dataset.requestId = entry.requestId;
        denyBtn.dataset.actionKey = itemKey;
        denyBtn.disabled = rowBusy || state.files.adminRequests.loading;
        actions.appendChild(denyBtn);
      }
    }

    if (entry.canUnauthorize) {
      const unauthorizeBtn = document.createElement("button");
      unauthorizeBtn.type = "button";
      unauthorizeBtn.className = "files-card-action files-admin-request-action is-delete";
      unauthorizeBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_unauthorize");
      unauthorizeBtn.dataset.filesAdminAction = "unauthorize";
      unauthorizeBtn.dataset.discordId = entry.discordId;
      unauthorizeBtn.dataset.actionKey = itemKey;
      unauthorizeBtn.disabled = rowBusy || state.files.adminRequests.loading;
      actions.appendChild(unauthorizeBtn);
    }

    if (entry.canAllowReapply) {
      const allowReapplyBtn = document.createElement("button");
      allowReapplyBtn.type = "button";
      allowReapplyBtn.className = "files-card-action files-admin-request-action";
      allowReapplyBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_allow_reapply");
      allowReapplyBtn.dataset.filesAdminAction = "allow-reapply";
      allowReapplyBtn.dataset.discordId = entry.discordId;
      allowReapplyBtn.dataset.actionKey = itemKey;
      allowReapplyBtn.disabled = rowBusy || state.files.adminRequests.loading;
      actions.appendChild(allowReapplyBtn);
    }

    if (!actions.children.length && entry.source === "allowlist") {
      const locked = document.createElement("p");
      locked.className = "files-admin-request-locked";
      locked.textContent = t("files_admin_requests_error_allowlist");
      actions.appendChild(locked);
    }

    card.appendChild(top);
    card.appendChild(meta);
    card.appendChild(reason);
    if (declineReason) {
      card.appendChild(declineReason);
    }
    card.appendChild(actions);
    if (isDeclineComposerOpen && entry.requestId) {
      const declineEditor = document.createElement("div");
      declineEditor.className = "files-admin-request-decline-editor";

      const declineLabel = document.createElement("label");
      declineLabel.className = "files-admin-request-decline-label";
      declineLabel.textContent = t("files_admin_requests_action_decline_reason_label");

      const declineInput = document.createElement("textarea");
      declineInput.className = "files-admin-request-decline-input";
      declineInput.rows = 3;
      declineInput.maxLength = FILES_ACCESS_REQUEST_REASON_MAX;
      declineInput.placeholder = t("files_admin_requests_action_decline_reason_placeholder");
      declineInput.value = String(state.files.adminRequests.declineComposerValue || "");
      declineInput.setAttribute("data-files-admin-decline-input", "true");
      declineInput.setAttribute("data-request-id", entry.requestId);
      declineInput.disabled = rowBusy || state.files.adminRequests.loading;

      const declineEditorActions = document.createElement("div");
      declineEditorActions.className = "files-admin-request-decline-actions";

      const declineCancelBtn = document.createElement("button");
      declineCancelBtn.type = "button";
      declineCancelBtn.className = "files-card-action files-admin-request-action";
      declineCancelBtn.textContent = t("files_admin_requests_action_deny_cancel");
      declineCancelBtn.dataset.filesAdminAction = "deny-cancel";
      declineCancelBtn.dataset.requestId = entry.requestId;
      declineCancelBtn.dataset.actionKey = itemKey;
      declineCancelBtn.disabled = rowBusy || state.files.adminRequests.loading;

      const declineConfirmBtn = document.createElement("button");
      declineConfirmBtn.type = "button";
      declineConfirmBtn.className = "files-card-action files-admin-request-action is-delete";
      declineConfirmBtn.textContent = rowBusy
        ? t("files_admin_requests_action_busy")
        : t("files_admin_requests_action_deny_confirm");
      declineConfirmBtn.dataset.filesAdminAction = "deny-submit";
      declineConfirmBtn.dataset.requestId = entry.requestId;
      declineConfirmBtn.dataset.actionKey = itemKey;
      declineConfirmBtn.disabled = rowBusy || state.files.adminRequests.loading;

      declineEditorActions.appendChild(declineCancelBtn);
      declineEditorActions.appendChild(declineConfirmBtn);

      declineEditor.appendChild(declineLabel);
      declineEditor.appendChild(declineInput);
      declineEditor.appendChild(declineEditorActions);
      card.appendChild(declineEditor);
    }
    fragment.appendChild(card);
  }

  elements.filesAdminRequestsList.innerHTML = "";
  elements.filesAdminRequestsList.appendChild(fragment);
}

function renderFilesBotAdminPanel() {
  if (!elements.filesBotAdminPanel) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const canUseBotAdmin = canUseFilesBotAdmin(me, { requireDesktop: true });
  const showIndexButton = canUseBotAdmin
    && state.view === "intel"
    && !document.body.classList.contains("is-files")
    && !document.body.classList.contains("is-classified")
    && !state.siloDossier.open;
  elements.filesBotAdminPanel.hidden = !canUseBotAdmin;

  const activeModal = normalizeFilesAdminModalType(state.files.adminModal.active);
  const modalOpen = canUseBotAdmin && activeModal === "bot";
  const loading = Boolean(state.files.botAdmin.loading);
  const busyActionKey = String(state.files.botAdmin.busyActionKey || "").trim();
  const overview = normalizeFilesBotAdminOverview(state.files.botAdmin.overview);
  const inviteLink = overview?.inviteLink || state.publicConfig.botInviteLink || "";

  if (elements.filesBotAdminFloatingBtn) {
    elements.filesBotAdminFloatingBtn.hidden = !showIndexButton;
    elements.filesBotAdminFloatingBtn.classList.toggle("is-active", modalOpen);
    elements.filesBotAdminFloatingBtn.setAttribute("aria-expanded", modalOpen ? "true" : "false");
  }
  if (elements.filesBotAdminModalBtn) {
    elements.filesBotAdminModalBtn.classList.toggle("is-active", modalOpen);
    elements.filesBotAdminModalBtn.setAttribute("aria-expanded", modalOpen ? "true" : "false");
  }

  if (!canUseBotAdmin) {
    return;
  }

  if (elements.filesBotAdminRefreshBtn) {
    elements.filesBotAdminRefreshBtn.disabled = loading || Boolean(busyActionKey);
    elements.filesBotAdminRefreshBtn.textContent = loading
      ? t("files_bot_admin_refresh_button_busy")
      : t("files_bot_admin_refresh_button");
  }
  if (elements.filesBotAdminSyncBtn) {
    const syncBusy = busyActionKey === "sync";
    const canSyncBot = Boolean(overview?.enabled && overview.ready);
    elements.filesBotAdminSyncBtn.disabled = loading || Boolean(busyActionKey) || !canSyncBot;
    elements.filesBotAdminSyncBtn.textContent = syncBusy
      ? t("files_bot_admin_sync_button_busy")
      : t("files_bot_admin_sync_button");
  }
  if (elements.filesBotAdminInviteLink) {
    const hasInviteLink = Boolean(inviteLink);
    elements.filesBotAdminInviteLink.textContent = t("files_bot_admin_invite_button");
    elements.filesBotAdminInviteLink.href = hasInviteLink ? inviteLink : "#";
    elements.filesBotAdminInviteLink.classList.toggle("is-disabled", !hasInviteLink);
    elements.filesBotAdminInviteLink.setAttribute("aria-disabled", hasInviteLink ? "false" : "true");
    elements.filesBotAdminInviteLink.tabIndex = hasInviteLink ? 0 : -1;
    elements.filesBotAdminInviteLink.title = hasInviteLink ? t("files_bot_admin_invite_button") : t("files_bot_admin_invite_unavailable");
  }

  if (elements.filesBotAdminMeta) {
    elements.filesBotAdminMeta.textContent = getFilesBotAdminMetaText(overview);
  }
  if (elements.filesBotAdminFeedback) {
    const message = String(state.files.botAdmin.message || "");
    const hasMessage = Boolean(message);
    elements.filesBotAdminFeedback.hidden = !hasMessage;
    elements.filesBotAdminFeedback.textContent = message;
    elements.filesBotAdminFeedback.classList.toggle("is-success", state.files.botAdmin.messageKind === "success");
    elements.filesBotAdminFeedback.classList.toggle("is-error", state.files.botAdmin.messageKind === "error");
  }
  if (elements.filesBotAdminStatusValue) {
    elements.filesBotAdminStatusValue.textContent = getFilesBotAdminStatusLabel(overview);
  }
  if (elements.filesBotAdminServersValue) {
    elements.filesBotAdminServersValue.textContent = overview
      ? formatFilesBotAdminNumber(overview.stats.guildCount)
      : "--";
  }
  if (elements.filesBotAdminUsersValue) {
    elements.filesBotAdminUsersValue.textContent = overview
      ? formatFilesBotAdminNumber(overview.stats.userCount)
      : "--";
  }
  if (elements.filesBotAdminChannelsValue) {
    elements.filesBotAdminChannelsValue.textContent = overview
      ? formatFilesBotAdminNumber(overview.stats.subscriptionCount)
      : "--";
  }
  if (elements.filesBotAdminSearchInput) {
    const nextQuery = String(state.files.botAdmin.query || "");
    if (elements.filesBotAdminSearchInput.value !== nextQuery) {
      elements.filesBotAdminSearchInput.value = nextQuery;
    }
  }
  elements.filesBotAdminPanel.classList.remove("is-focus-mode");
  if (elements.filesBotAdminToolbar) {
    elements.filesBotAdminToolbar.hidden = false;
  }
  if (elements.filesBotAdminOverview) {
    elements.filesBotAdminOverview.hidden = false;
  }

  if (!elements.filesBotAdminServerList) {
    return;
  }

  const emptyState = document.createElement("p");
  emptyState.className = "files-bot-admin-empty";

  if (loading && !overview) {
    emptyState.textContent = t("files_bot_admin_loading");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }

  if (!overview || !overview.enabled) {
    emptyState.textContent = state.files.botAdmin.message || t("files_bot_admin_unavailable");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }
  if (!overview.ready && !overview.guilds.length) {
    emptyState.textContent = t("files_bot_admin_loading");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }

  const guilds = getFilteredFilesBotAdminGuilds();
  if (!guilds.length) {
    state.files.botAdmin.selectedGuildId = "";
    emptyState.textContent = t("files_bot_admin_empty");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }

  const selectedGuildId = String(state.files.botAdmin.selectedGuildId || "").trim();
  if (selectedGuildId && !guilds.some((guild) => guild.id === selectedGuildId)) {
    state.files.botAdmin.selectedGuildId = "";
  }

  const selectedGuild = state.files.botAdmin.selectedGuildId
    ? guilds.find((guild) => guild.id === state.files.botAdmin.selectedGuildId) || null
    : null;
  const focusMode = Boolean(selectedGuild);
  elements.filesBotAdminPanel.classList.toggle("is-focus-mode", focusMode);
  if (elements.filesBotAdminToolbar) {
    elements.filesBotAdminToolbar.hidden = focusMode;
  }
  if (elements.filesBotAdminOverview) {
    elements.filesBotAdminOverview.hidden = focusMode;
  }
  const fragment = document.createDocumentFragment();

  if (selectedGuild) {
    const guild = selectedGuild;
    const guildName = guild.name || t("files_unknown_value");
    const welcomeActionKey = `welcome:${guild.id}`;
    const leaveActionKey = `leave:${guild.id}`;
    const welcomeBusy = busyActionKey === welcomeActionKey;
    const leaveBusy = busyActionKey === leaveActionKey;

    const focus = document.createElement("section");
    focus.className = "files-bot-admin-focus";
    focus.dataset.filesBotGuildCard = guild.id;

    const focusTop = document.createElement("div");
    focusTop.className = "files-bot-admin-focus-top";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "files-card-action files-bot-admin-focus-back";
    backBtn.textContent = t("files_bot_admin_server_back_to_list");
    backBtn.dataset.filesBotSelect = "true";
    backBtn.dataset.guildId = guild.id;
    backBtn.disabled = loading || Boolean(busyActionKey);

    const focusStatus = document.createElement("span");
    focusStatus.className = "files-bot-admin-focus-status";
    focusStatus.textContent = getFilesBotAdminStatusLabel(overview);

    focusTop.appendChild(backBtn);
    focusTop.appendChild(focusStatus);

    const card = document.createElement("article");
    card.className = "files-bot-admin-focus-card";

    const hero = document.createElement("div");
    hero.className = "files-bot-admin-focus-hero";

    const identity = document.createElement("div");
    identity.className = "files-bot-admin-focus-identity";

    const avatar = document.createElement("div");
    avatar.className = "files-bot-admin-server-avatar";
    if (guild.iconUrl) {
      const image = document.createElement("img");
      image.src = guild.iconUrl;
      image.alt = `${guildName} icon`;
      image.loading = "lazy";
      avatar.appendChild(image);
    } else {
      avatar.textContent = guildName.slice(0, 2).toUpperCase();
    }

    const heroCopy = document.createElement("div");
    heroCopy.className = "files-bot-admin-focus-hero-copy";
    const heading = document.createElement("div");
    heading.className = "files-bot-admin-focus-hero-heading";
    const name = document.createElement("h3");
    name.className = "files-bot-admin-server-name";
    name.textContent = guildName;
    const id = document.createElement("span");
    id.className = "files-bot-admin-server-id";
    id.textContent = guild.id;
    heading.appendChild(name);
    heading.appendChild(id);
    heroCopy.appendChild(heading);

    const heroMeta = document.createElement("div");
    heroMeta.className = "files-bot-admin-focus-hero-meta";
    const heroMetaValues = [
      `${t("files_bot_admin_server_locale")} ${String(
        guild.preferredLocale || guild.language || overview.bot.defaultLanguage || t("files_unknown_value")
      ).toUpperCase()}`,
      `${t("files_bot_admin_server_users")} ${formatFilesBotAdminNumber(guild.memberCount)}`
    ];
    for (const value of heroMetaValues) {
      const metaChip = document.createElement("span");
      metaChip.className = "files-bot-admin-focus-hero-chip";
      metaChip.textContent = value;
      heroMeta.appendChild(metaChip);
    }
    heroCopy.appendChild(heroMeta);

    identity.appendChild(avatar);
    identity.appendChild(heroCopy);

    const heroBadges = document.createElement("div");
    heroBadges.className = "files-bot-admin-focus-hero-badges";

    const liveBadge = document.createElement("span");
    liveBadge.className = "files-bot-admin-server-badge is-live";
    liveBadge.textContent = getFilesBotAdminStatusLabel(overview);
    const subscriptionBadge = document.createElement("span");
    subscriptionBadge.className = "files-bot-admin-server-badge";
    subscriptionBadge.textContent = t("files_bot_admin_server_channels_count", {
      n: formatFilesBotAdminNumber(guild.subscriptionCount)
    });

    heroBadges.appendChild(liveBadge);
    heroBadges.appendChild(subscriptionBadge);

    hero.appendChild(identity);
    hero.appendChild(heroBadges);

    const metrics = document.createElement("div");
    metrics.className = "files-bot-admin-focus-grid";
    const ownerDisplay = guild.ownerName
      ? `${guild.ownerName} | ${guild.ownerId || t("files_unknown_value")}`
      : guild.ownerId || t("files_unknown_value");
    const metricEntries = [
      [t("files_bot_admin_server_joined"), formatFileDateTime(guild.joinedAt)],
      [t("files_bot_admin_server_owner"), ownerDisplay],
      [t("files_bot_admin_server_language"), (guild.language || overview.bot.defaultLanguage || t("files_unknown_value")).toUpperCase()],
      [t("files_bot_admin_summary_channels"), formatFilesBotAdminNumber(guild.subscriptionCount)]
    ];
    for (const [label, value] of metricEntries) {
      const item = document.createElement("div");
      item.className = "files-bot-admin-focus-metric";
      const itemLabel = document.createElement("span");
      itemLabel.textContent = label;
      const itemValue = document.createElement("strong");
      itemValue.textContent = value;
      item.appendChild(itemLabel);
      item.appendChild(itemValue);
      metrics.appendChild(item);
    }

    const subscriptions = document.createElement("section");
    subscriptions.className = "files-bot-admin-focus-subscriptions";
    const subscriptionsHead = document.createElement("div");
    subscriptionsHead.className = "files-bot-admin-focus-subscriptions-head";
    const subscriptionsTitle = document.createElement("strong");
    subscriptionsTitle.className = "files-bot-admin-focus-subscriptions-title";
    subscriptionsTitle.textContent = t("files_bot_admin_server_subscriptions");
    const subscriptionsCount = document.createElement("span");
    subscriptionsCount.className = "files-bot-admin-focus-subscriptions-count";
    subscriptionsCount.textContent = t("files_bot_admin_server_channels_count", {
      n: formatFilesBotAdminNumber(guild.subscriptionCount)
    });
    subscriptionsHead.appendChild(subscriptionsTitle);
    subscriptionsHead.appendChild(subscriptionsCount);
    subscriptions.appendChild(subscriptionsHead);

    if (guild.subscriptions.length) {
      const subscriptionList = document.createElement("div");
      subscriptionList.className = "files-bot-admin-focus-subscription-list";
      for (const entry of guild.subscriptions) {
        const chip = document.createElement("span");
        chip.className = "files-bot-admin-focus-subscription";
        chip.append(document.createTextNode(entry.channelName ? `#${entry.channelName}` : entry.channelId));
        const feed = document.createElement("span");
        feed.textContent = getFilesBotAdminFeedLabel(entry.feeds);
        chip.appendChild(feed);
        subscriptionList.appendChild(chip);
      }
      subscriptions.appendChild(subscriptionList);
    } else {
      const noSubscriptions = document.createElement("p");
      noSubscriptions.className = "files-bot-admin-empty";
      noSubscriptions.textContent = t("files_bot_admin_server_no_subscriptions");
      subscriptions.appendChild(noSubscriptions);
    }

    const actions = document.createElement("div");
    actions.className = "files-bot-admin-focus-actions";

    const welcomeBtn = document.createElement("button");
    welcomeBtn.type = "button";
    welcomeBtn.className = "files-card-action files-bot-admin-focus-action";
    welcomeBtn.textContent = welcomeBusy ? t("files_bot_admin_server_action_busy") : t("files_bot_admin_server_action_welcome");
    welcomeBtn.dataset.filesBotAction = "welcome";
    welcomeBtn.dataset.guildId = guild.id;
    welcomeBtn.dataset.guildName = guildName;
    welcomeBtn.dataset.actionKey = welcomeActionKey;
    welcomeBtn.disabled = loading || Boolean(busyActionKey);

    const leaveBtn = document.createElement("button");
    leaveBtn.type = "button";
    leaveBtn.className = "files-card-action files-bot-admin-focus-action is-delete";
    leaveBtn.textContent = leaveBusy ? t("files_bot_admin_server_action_busy") : t("files_bot_admin_server_action_leave");
    leaveBtn.dataset.filesBotAction = "leave";
    leaveBtn.dataset.guildId = guild.id;
    leaveBtn.dataset.guildName = guildName;
    leaveBtn.dataset.actionKey = leaveActionKey;
    leaveBtn.disabled = loading || Boolean(busyActionKey);

    actions.appendChild(welcomeBtn);
    actions.appendChild(leaveBtn);

    card.appendChild(hero);
    card.appendChild(metrics);
    card.appendChild(subscriptions);
    card.appendChild(actions);

    focus.appendChild(focusTop);
    focus.appendChild(card);
    fragment.appendChild(focus);
    elements.filesBotAdminServerList.replaceChildren(fragment);
    return;
  }

  const listShell = document.createElement("section");
  listShell.className = "files-bot-admin-list-shell";

  const listHead = document.createElement("div");
  listHead.className = "files-bot-admin-list-head";

  const listTitle = document.createElement("strong");
  listTitle.className = "files-bot-admin-list-title";
  listTitle.textContent = t("files_bot_admin_summary_servers");

  const listCount = document.createElement("span");
  listCount.className = "files-bot-admin-list-count";
  listCount.textContent = formatFilesBotAdminNumber(guilds.length);

  listHead.appendChild(listTitle);
  listHead.appendChild(listCount);

  const listScroll = document.createElement("div");
  listScroll.className = "files-bot-admin-list-scroll";

  for (const guild of guilds) {
    const guildName = guild.name || t("files_unknown_value");

    const row = document.createElement("article");
    row.className = "files-bot-admin-server-row";
    row.dataset.filesBotGuildCard = guild.id;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "files-bot-admin-server-row-trigger";
    trigger.dataset.filesBotSelect = "true";
    trigger.dataset.guildId = guild.id;
    trigger.setAttribute("aria-expanded", "false");

    const main = document.createElement("div");
    main.className = "files-bot-admin-server-row-main";

    const identity = document.createElement("div");
    identity.className = "files-bot-admin-server-row-identity";

    const avatar = document.createElement("div");
    avatar.className = "files-bot-admin-server-avatar";
    if (guild.iconUrl) {
      const image = document.createElement("img");
      image.src = guild.iconUrl;
      image.alt = `${guildName} icon`;
      image.loading = "lazy";
      avatar.appendChild(image);
    } else {
      avatar.textContent = guildName.slice(0, 2).toUpperCase();
    }

    const nameBlock = document.createElement("div");
    nameBlock.className = "files-bot-admin-server-name-block";
    const name = document.createElement("h3");
    name.className = "files-bot-admin-server-name";
    name.textContent = guildName;
    nameBlock.appendChild(name);

    identity.appendChild(avatar);
    identity.appendChild(nameBlock);

    main.appendChild(identity);
    trigger.appendChild(main);
    row.appendChild(trigger);
    listScroll.appendChild(row);
  }

  listShell.appendChild(listHead);
  listShell.appendChild(listScroll);
  fragment.appendChild(listShell);
  elements.filesBotAdminServerList.replaceChildren(fragment);
}

function setFilesUploadInputInvalid(isInvalid, { isMissingFileError = false } = {}) {
  state.files.uploadFieldInvalid = Boolean(isInvalid);
  state.files.uploadMissingFileError = Boolean(isMissingFileError) && state.files.uploadFieldInvalid;
}

function renderFilesDeleteModal() {
  const modalState = state.files.deleteModal;
  const isOpen = Boolean(modalState.open);
  const displayName = modalState.fileName || t("files_unknown_value");

  if (elements.filesDeleteTitle) {
    elements.filesDeleteTitle.textContent = t("files_delete_modal_title");
  }
  if (elements.filesDeleteMessage) {
    elements.filesDeleteMessage.textContent = t("files_delete_modal_body", { name: displayName });
  }
  if (elements.filesDeleteCancelBtn) {
    elements.filesDeleteCancelBtn.textContent = t("files_delete_modal_cancel");
    elements.filesDeleteCancelBtn.disabled = modalState.deleting;
  }
  if (elements.filesDeleteConfirmBtn) {
    elements.filesDeleteConfirmBtn.textContent = t("files_delete_modal_confirm");
    elements.filesDeleteConfirmBtn.disabled = modalState.deleting;
  }
  if (elements.filesDeleteOverlay) {
    elements.filesDeleteOverlay.classList.toggle("is-active", isOpen);
    elements.filesDeleteOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function closeFilesDeleteModal({ force = false } = {}) {
  if (state.files.deleteModal.deleting && !force) {
    return;
  }

  state.files.deleteModal.open = false;
  state.files.deleteModal.fileId = "";
  state.files.deleteModal.fileName = "";
  state.files.deleteModal.deleting = false;
  renderFilesDeleteModal();
}

function renderFilesBotAdminLeaveModal() {
  const modalState = state.files.botAdmin.leaveConfirm;
  const me = normalizeFilesProfile(state.files.me);
  const isOpen = Boolean(me.isAuthorized && me.isAdmin && modalState.open);
  const guildName = modalState.guildName || t("files_unknown_value");
  const busy = Boolean(state.files.botAdmin.busyActionKey);

  if (elements.filesBotAdminLeaveBadge) {
    elements.filesBotAdminLeaveBadge.textContent = t("files_bot_admin_leave_modal_badge");
  }
  if (elements.filesBotAdminLeaveTitle) {
    elements.filesBotAdminLeaveTitle.textContent = t("files_bot_admin_leave_modal_title");
  }
  if (elements.filesBotAdminLeaveMessage) {
    elements.filesBotAdminLeaveMessage.textContent = t("files_bot_admin_leave_confirm", { server: guildName });
  }
  if (elements.filesBotAdminLeaveCancelBtn) {
    elements.filesBotAdminLeaveCancelBtn.textContent = t("files_bot_admin_leave_modal_cancel");
    elements.filesBotAdminLeaveCancelBtn.disabled = busy;
  }
  if (elements.filesBotAdminLeaveConfirmBtn) {
    elements.filesBotAdminLeaveConfirmBtn.textContent = busy
      ? t("files_bot_admin_server_action_busy")
      : t("files_bot_admin_leave_modal_confirm");
    elements.filesBotAdminLeaveConfirmBtn.disabled = busy;
  }
  if (elements.filesBotAdminLeaveOverlay) {
    elements.filesBotAdminLeaveOverlay.classList.toggle("is-active", isOpen);
    elements.filesBotAdminLeaveOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function closeFilesBotAdminLeaveModal({ force = false } = {}) {
  if (state.files.botAdmin.busyActionKey && !force) {
    return;
  }

  state.files.botAdmin.leaveConfirm.open = false;
  state.files.botAdmin.leaveConfirm.guildId = "";
  state.files.botAdmin.leaveConfirm.guildName = "";
  state.files.botAdmin.leaveConfirm.actionKey = "";
  renderFilesBotAdminLeaveModal();
}

function openFilesBotAdminLeaveModal({ guildId = "", guildName = "", actionKey = "" } = {}) {
  state.files.botAdmin.leaveConfirm.open = true;
  state.files.botAdmin.leaveConfirm.guildId = String(guildId || "").trim();
  state.files.botAdmin.leaveConfirm.guildName = String(guildName || "").trim();
  state.files.botAdmin.leaveConfirm.actionKey = String(actionKey || "").trim();
  renderFilesBotAdminLeaveModal();
}

async function confirmFilesBotAdminLeaveModal() {
  const modalState = state.files.botAdmin.leaveConfirm;
  if (!modalState.open || !modalState.guildId || state.files.botAdmin.busyActionKey) {
    return;
  }

  await executeFilesBotAdminAction({
    action: "leave",
    guildId: modalState.guildId,
    guildName: modalState.guildName || t("files_unknown_value"),
    actionKey: modalState.actionKey || `leave:${modalState.guildId}`
  });
}

function setFilesSearchCount(text = "") {
  if (!elements.filesSearchCount) {
    return;
  }
  const hasText = Boolean(text);
  elements.filesSearchCount.hidden = !hasText;
  elements.filesSearchCount.textContent = hasText ? text : "";
}

function setFilesSearchOpen(active, { focusInput = false, clearQuery = false } = {}) {
  const open = Boolean(active);

  if (open && state.files.groupManager.open) {
    setFilesGroupManagerOpen(false, { focusInput: false, clearSelection: true });
  }

  state.files.search.open = open;

  if (open) {
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    state.files.transition = "";
  }

  if (elements.filesSearchWrap) {
    elements.filesSearchWrap.hidden = !open;
  }
  if (elements.filesSearchToggleBtn) {
    elements.filesSearchToggleBtn.classList.toggle("is-active", open);
    elements.filesSearchToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    const titleKey = open ? "files_search_toggle_close_label" : "files_search_toggle_open_label";
    elements.filesSearchToggleBtn.title = t(titleKey);
    elements.filesSearchToggleBtn.setAttribute("aria-label", t(titleKey));
  }
  if (elements.filesSearchToggleText) {
    const textKey = open ? "files_search_toggle_close" : "files_search_toggle_open";
    elements.filesSearchToggleText.textContent = t(textKey);
  }

  if (!open && clearQuery && elements.filesSearchInput) {
    elements.filesSearchInput.value = "";
    state.files.search.query = "";
  }

  renderFilesList();
  renderFilesGroupManagerPanel();

  if (open && focusInput && elements.filesSearchInput) {
    focusFilesOpenTarget(elements.filesSearchInput, {
      fallback: elements.filesSearchToggleBtn,
      selectText: true
    });
  }
}

function setFilesGroupManagerOpen(active, { focusInput = false, clearSelection = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  const canUseManager = Boolean(me.isAuthorized && me.isAdmin);
  const open = canUseManager && Boolean(active);

  if (open && state.files.search.open) {
    setFilesSearchOpen(false, { focusInput: false, clearQuery: true });
  }

  state.files.groupManager.open = open;

  if (open) {
    state.files.activeGroupKey = "";
    state.files.groupTransition = "";
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    cancelFilesRename({ render: false });
  }

  if (!open && clearSelection) {
    clearFilesGroupManagerState();
    closeAllFilesGroupSuggestMenus();
  }

  if (elements.filesGroupManagerToggleBtn) {
    elements.filesGroupManagerToggleBtn.classList.toggle("is-active", open);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    const titleKey = open ? "files_group_manager_toggle_close_label" : "files_group_manager_toggle_open_label";
    elements.filesGroupManagerToggleBtn.title = t(titleKey);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-label", t(titleKey));
    elements.filesGroupManagerToggleBtn.hidden = !canUseManager;
  }
  if (elements.filesGroupManagerToggleText) {
    const textKey = open ? "files_group_manager_toggle_close" : "files_group_manager_toggle_open";
    elements.filesGroupManagerToggleText.textContent = t(textKey);
  }
  if (elements.filesGroupManagerWrap) {
    elements.filesGroupManagerWrap.hidden = !open;
  }

  renderFilesList();
  renderFilesGroupManagerPanel();

  if (open && focusInput) {
    const managerInput = elements.filesGroupManagerWrap?.querySelector("[data-files-group-input]");
    if (managerInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(managerInput, {
        fallback: elements.filesGroupManagerToggleBtn,
        selectText: true
      });
    }
  }
}

function renderFilesGroupManagerPanel() {
  if (!elements.filesGroupManagerWrap) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const canUseManager = Boolean(me.isAuthorized && me.isAdmin);
  const shouldShow = canUseManager && Boolean(state.files.groupManager.open);
  elements.filesGroupManagerWrap.hidden = !shouldShow;
  elements.filesGroupManagerWrap.replaceChildren();
  if (!shouldShow) {
    return;
  }

  const visibleFileIds = getFilesGroupManagerVisibleFileIds();
  const visibleIdSet = new Set(visibleFileIds);
  state.files.groupManager.selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter((value) => value && visibleIdSet.has(value));

  const selectedCount = state.files.groupManager.selectedIds.length;
  const totalCount = Math.max(0, visibleFileIds.length);
  const currentTargetGroup = normalizeFilesGroup(state.files.groupManager.targetGroup || "");
  const currentTargetLabel = currentTargetGroup || t("files_group_default");
  const fragment = document.createDocumentFragment();

  const manager = document.createElement("section");
  manager.className = "files-group-manager";

  const managerTop = document.createElement("div");
  managerTop.className = "files-group-manager-top";

  const managerTitle = document.createElement("p");
  managerTitle.className = "files-group-manager-title";
  managerTitle.textContent = t("files_group_manager_title");
  managerTop.appendChild(managerTitle);

  const managerCount = document.createElement("span");
  managerCount.className = "files-group-manager-count";
  managerCount.textContent = t("files_group_manager_selected_count", {
    n: String(selectedCount),
    total: String(totalCount)
  });
  managerTop.appendChild(managerCount);
  manager.appendChild(managerTop);

  const activeGroupText = document.createElement("p");
  activeGroupText.className = "files-group-manager-active";
  activeGroupText.textContent = t("files_group_manager_active_group", { group: currentTargetLabel });
  manager.appendChild(activeGroupText);

  const managerHint = document.createElement("p");
  managerHint.className = "files-group-manager-hint";
  managerHint.textContent = t("files_group_manager_mode_hint");
  manager.appendChild(managerHint);

  const managerControls = document.createElement("div");
  managerControls.className = "files-group-manager-controls";

  const managerInput = document.createElement("input");
  managerInput.id = "filesGroupManagerInput";
  managerInput.type = "text";
  managerInput.className = "files-upload-text files-group-manager-input";
  managerInput.maxLength = 80;
  managerInput.placeholder = t("files_group_manager_placeholder");
  managerInput.value = currentTargetGroup;
  managerInput.setAttribute("data-files-group-input", "true");
  managerInput.disabled = state.files.groupManager.busy;
  managerControls.appendChild(managerInput);

  const managerSuggest = createFilesGroupSuggestionDropdown(managerInput.id, managerInput.value);
  const managerSuggestToggle = managerSuggest.querySelector("[data-files-group-suggest-toggle]");
  if (managerSuggestToggle instanceof HTMLButtonElement) {
    managerSuggestToggle.disabled = state.files.groupManager.busy;
  }
  managerControls.appendChild(managerSuggest);

  const managerActions = document.createElement("div");
  managerActions.className = "files-group-manager-actions";

  const assignButton = document.createElement("button");
  assignButton.type = "button";
  assignButton.className = "files-card-action";
  assignButton.setAttribute("data-files-action", "assign-selected-group");
  assignButton.textContent = state.files.groupManager.busy
    ? t("files_group_manager_assign_busy")
    : t("files_group_manager_assign_button");
  assignButton.disabled = state.files.groupManager.busy || selectedCount < 1;
  managerActions.appendChild(assignButton);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "files-card-action is-delete";
  removeButton.setAttribute("data-files-action", "remove-selected-group");
  removeButton.textContent = state.files.groupManager.busy
    ? t("files_group_manager_remove_busy")
    : t("files_group_manager_remove_button");
  removeButton.disabled = state.files.groupManager.busy || selectedCount < 1;
  managerActions.appendChild(removeButton);

  const selectAllButton = document.createElement("button");
  selectAllButton.type = "button";
  selectAllButton.className = "files-card-action";
  selectAllButton.setAttribute("data-files-action", "select-all-group-files");
  selectAllButton.textContent = t("files_group_manager_select_all_button");
  selectAllButton.disabled = state.files.groupManager.busy || totalCount < 1;
  managerActions.appendChild(selectAllButton);

  const clearSelectionButton = document.createElement("button");
  clearSelectionButton.type = "button";
  clearSelectionButton.className = "files-card-action";
  clearSelectionButton.setAttribute("data-files-action", "clear-group-files-selection");
  clearSelectionButton.textContent = t("files_group_manager_clear_button");
  clearSelectionButton.disabled = state.files.groupManager.busy || selectedCount < 1;
  managerActions.appendChild(clearSelectionButton);

  managerControls.appendChild(managerActions);
  if (!totalCount) {
    const empty = document.createElement("p");
    empty.className = "files-search-empty files-group-manager-empty";
    empty.textContent = t("files_group_manager_no_files");
    managerControls.appendChild(empty);
  }
  manager.appendChild(managerControls);
  fragment.appendChild(manager);

  elements.filesGroupManagerWrap.appendChild(fragment);
}

function getFilteredFilesList(files = []) {
  const source = Array.isArray(files) ? files : [];
  const isSearchOpen = Boolean(state.files.search.open);
  const rawQuery = isSearchOpen
    ? String(state.files.search.query || "")
    : "";
  const query = normalizeSearchText(rawQuery);
  if (!isSearchOpen || !query) {
    return source;
  }

  const queryTokens = query.split(" ").filter(Boolean);
  if (!queryTokens.length) {
    return source;
  }

  return source.filter((file) => {
    const displayName = normalizeSearchText(getFilesDisplayName(file));
    const realName = normalizeSearchText(file.name || file.originalName || "");
    const type = normalizeSearchText(file.mimeType || file.type || resolveFileTypeLabel(file));
    const group = normalizeSearchText(file.group || "");
    const description = normalizeSearchText(file.description || "");
    const uploader = normalizeSearchText(file.uploader || file.uploaderDiscordId || "");
    const haystack = `${displayName} ${realName} ${type} ${group} ${description} ${uploader}`;
    return queryTokens.every((token) => haystack.includes(token));
  });
}

function openFilesDeleteModal(fileId) {
  if (!state.files.me?.isAdmin) {
    return;
  }

  const matchedFile = state.files.list.find((entry) => String(entry.id || "") === String(fileId || ""));
  if (!matchedFile) {
    return;
  }

  state.files.deleteModal.open = true;
  state.files.deleteModal.fileId = String(fileId);
  state.files.deleteModal.fileName = getFilesDisplayName(matchedFile);
  state.files.deleteModal.deleting = false;
  renderFilesDeleteModal();
  setTimeout(() => {
    elements.filesDeleteConfirmBtn?.focus();
  }, 0);
}

async function confirmFilesDeleteModal() {
  if (!state.files.me?.isAdmin) {
    closeFilesDeleteModal({ force: true });
    return;
  }

  const fileId = state.files.deleteModal.fileId;
  if (!fileId) {
    closeFilesDeleteModal({ force: true });
    return;
  }

  state.files.deleteModal.deleting = true;
  renderFilesDeleteModal();

  try {
    await requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE"
    });
    closeFilesDeleteModal({ force: true });
    setFilesUploadFeedback(t("files_delete_success"), "success");
    await refreshFilesList();
  } catch (error) {
    closeFilesDeleteModal({ force: true });
    setFilesUploadFeedback(String(error?.message || t("files_delete_error")), "error");
    renderFilesAccessView();
  }
}

function createFilesMetaItem(label, value) {
  const wrap = document.createElement("div");
  wrap.className = "files-meta-item";

  const labelEl = document.createElement("span");
  labelEl.className = "files-meta-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "files-meta-value";
  valueEl.textContent = value || t("files_unknown_value");

  wrap.appendChild(labelEl);
  wrap.appendChild(valueEl);
  return wrap;
}

function createFilesDescriptionBlock({ description = "", imageUrl = "", imageName = "", fileName = "" } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "files-description-block";

  const labelEl = document.createElement("span");
  labelEl.className = "files-meta-label";
  labelEl.textContent = t("files_description_label");

  const valueEl = document.createElement("p");
  valueEl.className = "files-description-value";
  valueEl.textContent = description || t("files_unknown_value");

  wrap.appendChild(labelEl);
  wrap.appendChild(valueEl);

  const resolvedImageUrl = String(imageUrl || "").trim();
  if (resolvedImageUrl) {
    const imageWrap = document.createElement("figure");
    imageWrap.className = "files-description-image";

    const imageEl = document.createElement("img");
    imageEl.className = "files-description-image-media";
    imageEl.src = resolvedImageUrl;
    imageEl.alt = String(imageName || fileName || t("files_description_label"));
    imageEl.loading = "lazy";
    imageEl.decoding = "async";

    imageWrap.appendChild(imageEl);
    wrap.appendChild(imageWrap);
  }

  return wrap;
}

function buildFilesDetailRenderKey(file, { isAdmin = false } = {}) {
  const safeFile = file && typeof file === "object" ? file : {};
  return [
    state.lang,
    isAdmin ? "1" : "0",
    String(safeFile.id || ""),
    String(safeFile.name || safeFile.originalName || ""),
    String(safeFile.displayName || ""),
    String(safeFile.mimeType || safeFile.type || ""),
    String(Math.max(0, Number(safeFile.size) || 0)),
    String(safeFile.uploadedAt || safeFile.uploaded_at || ""),
    String(safeFile.updatedAt || safeFile.updated_at || ""),
    normalizeFilesGroup(safeFile.group),
    String(safeFile.description || ""),
    String(safeFile.uploader || safeFile.uploaderDiscordId || ""),
    String(safeFile.imageUrl || ""),
    String(safeFile.imageName || ""),
    safeFile.hasImage ? "1" : "0"
  ].join("|");
}

function createFilesAdminEditForm(file) {
  if (!state.files.me?.isAdmin) {
    return null;
  }

  const fileId = String(file.id || "").trim();
  if (!fileId) {
    return null;
  }

  const form = document.createElement("form");
  form.className = "files-edit-form";
  form.noValidate = true;
  form.setAttribute("data-files-edit-form", "true");
  form.setAttribute("data-file-id", fileId);

  const title = document.createElement("p");
  title.className = "files-edit-title";
  title.textContent = t("files_edit_section_title");
  form.appendChild(title);

  const descriptionLabel = document.createElement("label");
  descriptionLabel.className = "files-edit-label";
  descriptionLabel.textContent = t("files_edit_description_label");
  descriptionLabel.setAttribute("for", `filesEditDescription-${fileId}`);
  form.appendChild(descriptionLabel);

  const descriptionInput = document.createElement("textarea");
  descriptionInput.id = `filesEditDescription-${fileId}`;
  descriptionInput.className = "files-upload-description files-edit-description";
  descriptionInput.name = "description";
  descriptionInput.rows = 4;
  descriptionInput.maxLength = 500;
  descriptionInput.value = String(file.description || "").trim();
  descriptionInput.placeholder = t("files_upload_description_placeholder");
  form.appendChild(descriptionInput);

  const groupLabel = document.createElement("label");
  groupLabel.className = "files-edit-label";
  groupLabel.textContent = t("files_edit_group_label");
  groupLabel.setAttribute("for", `filesEditGroup-${fileId}`);
  form.appendChild(groupLabel);

  const groupInput = document.createElement("input");
  groupInput.id = `filesEditGroup-${fileId}`;
  groupInput.className = "files-upload-text files-edit-group";
  groupInput.name = "group";
  groupInput.type = "text";
  groupInput.maxLength = 80;
  groupInput.value = normalizeFilesGroup(file.group || "");
  groupInput.placeholder = t("files_upload_group_placeholder");
  form.appendChild(groupInput);

  const groupSuggestDropdown = createFilesGroupSuggestionDropdown(groupInput.id, groupInput.value);
  form.appendChild(groupSuggestDropdown);

  const imageLabel = document.createElement("label");
  imageLabel.className = "files-edit-label";
  imageLabel.textContent = t("files_edit_image_label");
  imageLabel.setAttribute("for", `filesEditImage-${fileId}`);
  form.appendChild(imageLabel);

  const imageInput = document.createElement("input");
  imageInput.id = `filesEditImage-${fileId}`;
  imageInput.className = "files-upload-input files-upload-image-input files-edit-image";
  imageInput.name = "image";
  imageInput.type = "file";
  imageInput.accept = "image/*";
  form.appendChild(imageInput);

  if (file.hasImage || file.imageUrl) {
    const removeWrap = document.createElement("label");
    removeWrap.className = "files-edit-remove";

    const removeInput = document.createElement("input");
    removeInput.type = "checkbox";
    removeInput.name = "removeImage";
    removeInput.value = "1";

    const removeText = document.createElement("span");
    removeText.textContent = t("files_edit_remove_image_label");

    removeWrap.appendChild(removeInput);
    removeWrap.appendChild(removeText);
    form.appendChild(removeWrap);
  }

  const actions = document.createElement("div");
  actions.className = "files-edit-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "files-card-action";
  saveButton.textContent = t("files_edit_save_button");
  actions.appendChild(saveButton);

  form.appendChild(actions);
  return form;
}

function renderFilesDetailCard(file) {
  if (!elements.filesList) {
    return;
  }

  const fileId = String(file.id || "");
  const fileName = getFilesDisplayName(file);
  const fileType = resolveFileTypeLabel(file);
  const fileSize = formatFileSize(file.size);
  const uploadDate = formatFileDateTime(file.uploadedAt || file.uploaded_at);
  const description = String(file.description || "").trim();
  const group = getFilesGroupDisplayLabel(file);
  const uploader = String(file.uploader || file.uploaderDiscordId || t("files_unknown_value"));
  const imageUrl = String(file.imageUrl || "").trim();
  const imageName = String(file.imageName || "").trim();

  const detailCard = document.createElement("article");
  detailCard.className = "panel files-detail-card";

  const detailTop = document.createElement("div");
  detailTop.className = "files-detail-top";

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "files-btn files-detail-back";
  backButton.textContent = t("files_back_to_index_button");
  backButton.setAttribute("data-files-action", "back-to-index");
  detailTop.appendChild(backButton);

  const title = document.createElement("p");
  title.className = "files-detail-title";
  title.textContent = fileName;
  detailTop.appendChild(title);

  const detailBody = document.createElement("div");
  detailBody.className = "files-detail-body";

  const metadata = document.createElement("div");
  metadata.className = "files-meta-grid";
  metadata.appendChild(createFilesMetaItem(t("files_name_label"), fileName));
  metadata.appendChild(createFilesMetaItem(t("files_type_label"), fileType));
  metadata.appendChild(createFilesMetaItem(t("files_size_label"), fileSize));
  metadata.appendChild(createFilesMetaItem(t("files_uploaded_label"), uploadDate));
  metadata.appendChild(createFilesMetaItem(t("files_group_label"), group));
  metadata.appendChild(createFilesMetaItem(t("files_uploader_label"), uploader));

  const descriptionBlock = createFilesDescriptionBlock({
    description,
    imageUrl,
    imageName,
    fileName
  });

  const actions = document.createElement("div");
  actions.className = "files-card-actions files-detail-actions";

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.className = "files-card-action";
  downloadButton.textContent = t("files_download_button");
  downloadButton.setAttribute("data-files-action", "download");
  downloadButton.setAttribute("data-file-id", fileId);
  actions.appendChild(downloadButton);

  if (state.files.me?.isAdmin) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "files-card-action is-delete";
    deleteButton.textContent = t("files_delete_button");
    deleteButton.setAttribute("data-files-action", "delete");
    deleteButton.setAttribute("data-file-id", fileId);
    actions.appendChild(deleteButton);
  }

  detailBody.appendChild(metadata);
  detailBody.appendChild(descriptionBlock);
  detailBody.appendChild(actions);

  if (state.files.me?.isAdmin) {
    const editForm = createFilesAdminEditForm(file);
    if (editForm) {
      detailBody.appendChild(editForm);
    }
  }

  detailCard.appendChild(detailTop);
  detailCard.appendChild(detailBody);
  elements.filesList.appendChild(detailCard);
  elements.filesList.dataset.detailRenderKey = buildFilesDetailRenderKey(file, {
    isAdmin: Boolean(state.files.me?.isAdmin)
  });
}

function renderFilesSessionProfile({ loggedIn, authorized, isAdmin, username, discordId, accessRequestStatus } = {}) {
  const unknown = t("files_unknown_value");
  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const resolvedAdmin = Boolean(isAdmin) && resolvedAuthorized;
  const resolvedUsername = resolvedLoggedIn ? (String(username || "").trim() || unknown) : unknown;
  const resolvedDiscordId = resolvedLoggedIn ? (String(discordId || "").trim() || unknown) : unknown;
  const resolvedClearance = !resolvedLoggedIn
    ? unknown
    : resolvedAdmin
      ? t("files_session_clearance_admin")
      : resolvedAuthorized
        ? t("files_session_clearance_authorized")
        : t("files_session_clearance_unauthorized");
  const resolvedState = getFilesSessionStateLabel({
    loggedIn: resolvedLoggedIn,
    accessRequestStatus
  });
  const badgeText = !resolvedLoggedIn
    ? unknown
    : resolvedAdmin
      ? t("files_session_badge_admin")
      : resolvedAuthorized
        ? t("files_session_badge_authorized")
        : t("files_session_badge_unauthorized");

  if (elements.filesSessionUser) {
    elements.filesSessionUser.textContent = resolvedUsername;
  }
  if (elements.filesSessionId) {
    elements.filesSessionId.textContent = resolvedDiscordId;
  }
  if (elements.filesSessionClearance) {
    elements.filesSessionClearance.textContent = resolvedClearance;
    elements.filesSessionClearance.classList.toggle("is-admin", resolvedAdmin);
  }
  if (elements.filesSessionState) {
    elements.filesSessionState.textContent = resolvedState;
  }
  if (elements.filesSessionBadge) {
    elements.filesSessionBadge.textContent = badgeText;
    elements.filesSessionBadge.classList.toggle("is-admin", resolvedAdmin);
  }
}

function createFilesRestrictedIncidentCode(seed = "") {
  const input = String(seed || "guest");
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return `FR-${hash.toString(16).toUpperCase().padStart(8, "0").slice(-6)}`;
}

function renderFilesRestrictedView({
  loggedIn,
  authorized,
  username,
  discordId,
  accessRequestStatus,
  accessRequestRequestedAt,
  accessRequestDecidedAt,
  accessRequestReapplyAt,
  accessRequestDeclineReason,
  accessDisclaimerDecision
} = {}) {
  if (!elements.filesRestrictedView) {
    return;
  }

  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const cooldownActive = isFilesDeclinedCooldownActive({
    accessRequestStatus,
    accessRequestDecidedAt,
    accessRequestReapplyAt
  });
  const resolvedRequestStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  const resolvedDisclaimerDecision = normalizeFilesDisclaimerDecision(accessDisclaimerDecision);
  const disclaimerGateActive = resolvedRequestStatus === "approved"
    && !resolvedAuthorized
    && (resolvedDisclaimerDecision === "none" || resolvedDisclaimerDecision === "declined");
  const showRestricted = resolvedLoggedIn && !resolvedAuthorized && !cooldownActive && !disclaimerGateActive;
  elements.filesRestrictedView.hidden = !showRestricted;
  if (elements.filesRestrictedRequestFeedback) {
    if (!showRestricted) {
      elements.filesRestrictedRequestFeedback.hidden = true;
      elements.filesRestrictedRequestFeedback.textContent = "";
      elements.filesRestrictedRequestFeedback.classList.remove("is-error", "is-success");
    }
  }
  if (elements.filesRestrictedReasonInput && !showRestricted) {
    elements.filesRestrictedReasonInput.classList.remove("is-invalid");
  }
  if (!showRestricted) {
    return;
  }

  const unknown = t("files_unknown_value");
  const resolvedUsername = String(username || "").trim() || unknown;
  const resolvedDiscordId = String(discordId || "").trim() || unknown;
  const declineReason = String(accessRequestDeclineReason || "").trim();
  const hideReasonSection = resolvedRequestStatus === "pending";
  const incidentCode = createFilesRestrictedIncidentCode(resolvedDiscordId !== unknown ? resolvedDiscordId : resolvedUsername);
  const locale = state.lang === "es" ? "es-ES" : "en-US";

  if (elements.filesRestrictedReasonSection) {
    elements.filesRestrictedReasonSection.hidden = hideReasonSection;
  }
  if (hideReasonSection && elements.filesRestrictedReasonInput) {
    elements.filesRestrictedReasonInput.classList.remove("is-invalid");
  }

  if (elements.filesRestrictedIncident) {
    elements.filesRestrictedIncident.textContent = t("files_restricted_incident", { code: incidentCode });
  }
  if (elements.filesRestrictedSubtitle) {
    const showDeclinedReason = resolvedRequestStatus === "declined" && Boolean(declineReason);
    elements.filesRestrictedSubtitle.textContent = showDeclinedReason
      ? t("files_restricted_subtitle_declined_reason", { reason: declineReason })
      : t("files_restricted_subtitle");
  }
  if (elements.filesRestrictedIdentityValue) {
    elements.filesRestrictedIdentityValue.textContent = resolvedUsername;
  }
  if (elements.filesRestrictedDiscordValue) {
    elements.filesRestrictedDiscordValue.textContent = resolvedDiscordId;
  }
  if (elements.filesRestrictedClearanceValue) {
    elements.filesRestrictedClearanceValue.textContent = t("files_session_clearance_unauthorized");
  }
  if (elements.filesRestrictedStatusValue) {
    elements.filesRestrictedStatusValue.textContent = getFilesAccessRequestStatusLabel(resolvedRequestStatus);
  }
  if (elements.filesRestrictedTimeValue) {
    const checkpointSource = String(accessRequestDecidedAt || accessRequestRequestedAt || "").trim();
    const checkpointDate = checkpointSource ? new Date(checkpointSource) : new Date();
    const safeDate = Number.isNaN(checkpointDate.getTime()) ? new Date() : checkpointDate;
    elements.filesRestrictedTimeValue.textContent = safeDate.toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  if (elements.filesRestrictedRequestFeedback) {
    const hasMessage = Boolean(state.files.accessRequestMessage);
    elements.filesRestrictedRequestFeedback.hidden = !hasMessage;
    elements.filesRestrictedRequestFeedback.textContent = hasMessage ? state.files.accessRequestMessage : "";
    elements.filesRestrictedRequestFeedback.classList.toggle("is-success", state.files.accessRequestMessageKind === "success");
    elements.filesRestrictedRequestFeedback.classList.toggle("is-error", state.files.accessRequestMessageKind === "error");
  }
}

function updateFilesDeniedCountdown(nowMs = Date.now()) {
  if (!elements.filesDeniedView || elements.filesDeniedView.hidden || !elements.filesDeniedCountdownValue) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const remainingMs = getFilesDeclinedCooldownRemainingMs(me, nowMs);
  if (remainingMs <= 0) {
    elements.filesDeniedCountdownValue.textContent = t("files_denied_countdown_ready");
    renderFilesAccessView();
    return;
  }

  elements.filesDeniedCountdownValue.textContent = formatMinervaCountdown(remainingMs);
}

function renderFilesDeniedView({
  loggedIn,
  authorized,
  accessRequestStatus,
  accessRequestDecidedAt,
  accessRequestReapplyAt,
  accessRequestDeclineReason
} = {}) {
  if (!elements.filesDeniedView) {
    return;
  }

  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  const declineReason = String(accessRequestDeclineReason || "").trim();
  const remainingMs = getFilesDeclinedCooldownRemainingMs({
    accessRequestStatus: resolvedStatus,
    accessRequestDecidedAt,
    accessRequestReapplyAt
  });
  const showDenied = resolvedLoggedIn && !resolvedAuthorized && resolvedStatus === "declined" && remainingMs > 0;
  elements.filesDeniedView.hidden = !showDenied;
  if (!showDenied) {
    return;
  }

  const reapplyAtMs = resolveFilesReapplyAtMs({
    accessRequestStatus: resolvedStatus,
    accessRequestDecidedAt,
    accessRequestReapplyAt
  });
  const reapplyAtDate = Number.isFinite(reapplyAtMs) && reapplyAtMs > 0
    ? new Date(reapplyAtMs)
    : null;

  if (elements.filesDeniedSubtitle) {
    elements.filesDeniedSubtitle.textContent = t("files_denied_subtitle");
  }
  if (elements.filesDeniedReasonSection) {
    const showReason = declineReason.length > 0;
    elements.filesDeniedReasonSection.hidden = !showReason;
    if (elements.filesDeniedReasonValue) {
      elements.filesDeniedReasonValue.textContent = showReason ? declineReason : t("files_unknown_value");
    }
  }

  if (elements.filesDeniedStatusValue) {
    elements.filesDeniedStatusValue.textContent = t("files_denied_status_value");
  }
  if (elements.filesDeniedNextWindowValue) {
    elements.filesDeniedNextWindowValue.textContent = reapplyAtDate
      ? formatFileDateTime(reapplyAtDate.toISOString())
      : t("files_unknown_value");
  }

  updateFilesDeniedCountdown();
}

function setFilesDisclaimerGateFeedback(message = "", kind = "") {
  state.files.disclaimerGate.message = String(message || "");
  state.files.disclaimerGate.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";
}

function clearFilesDisclaimerAcceptTransitionTimer() {
  if (!filesDisclaimerAcceptTransitionTimer) {
    return;
  }
  clearTimeout(filesDisclaimerAcceptTransitionTimer);
  filesDisclaimerAcceptTransitionTimer = null;
}

function startFilesDisclaimerAcceptTransition() {
  clearFilesDisclaimerAcceptTransitionTimer();
  state.files.disclaimerGate.acceptTransitionActive = true;
  state.files.disclaimerGate.acceptTransitionExiting = false;
  state.files.disclaimerGate.acceptTransitionStartedAt = Date.now();
}

function stopFilesDisclaimerAcceptTransition({ immediate = false } = {}) {
  clearFilesDisclaimerAcceptTransitionTimer();
  if (immediate) {
    state.files.disclaimerGate.acceptTransitionActive = false;
    state.files.disclaimerGate.acceptTransitionExiting = false;
    state.files.disclaimerGate.acceptTransitionStartedAt = 0;
    return;
  }

  if (!state.files.disclaimerGate.acceptTransitionActive) {
    state.files.disclaimerGate.acceptTransitionExiting = false;
    state.files.disclaimerGate.acceptTransitionStartedAt = 0;
    return;
  }

  state.files.disclaimerGate.acceptTransitionExiting = true;
  if (state.view === "files" && document.body.classList.contains("is-files")) {
    renderFilesAccessView();
  }
  filesDisclaimerAcceptTransitionTimer = setTimeout(() => {
    filesDisclaimerAcceptTransitionTimer = null;
    state.files.disclaimerGate.acceptTransitionActive = false;
    state.files.disclaimerGate.acceptTransitionExiting = false;
    state.files.disclaimerGate.acceptTransitionStartedAt = 0;
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      renderFilesAccessView();
    }
  }, FILES_DISCLAIMER_ACCEPT_FADE_MS);
}

function resetFilesDisclaimerGateContactState({ clearText = true } = {}) {
  state.files.disclaimerGate.contactOpen = false;
  state.files.disclaimerGate.contactBusy = false;
  if (clearText) {
    state.files.disclaimerGate.contactText = "";
  }
  if (elements.filesDisclaimerContactInput) {
    if (clearText) {
      elements.filesDisclaimerContactInput.value = "";
    }
    elements.filesDisclaimerContactInput.classList.remove("is-invalid");
  }
}

function openFilesDisclaimerContactView() {
  const me = normalizeFilesProfile(state.files.me);
  if (!shouldShowFilesDisclaimerGate(me)) {
    return;
  }
  if (normalizeFilesDisclaimerDecision(me.accessDisclaimerDecision) !== "declined") {
    return;
  }
  if (hasPendingFilesDisclaimerReevaluation(me)) {
    resetFilesDisclaimerGateContactState({ clearText: false });
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_pending"), "error");
    renderFilesAccessView();
    return;
  }

  state.files.disclaimerGate.contactOpen = true;
  state.files.disclaimerGate.contactBusy = false;
  setFilesDisclaimerGateFeedback("", "");
  renderFilesAccessView();

  if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
    elements.filesDisclaimerContactInput.focus();
    elements.filesDisclaimerContactInput.selectionStart = elements.filesDisclaimerContactInput.value.length;
    elements.filesDisclaimerContactInput.selectionEnd = elements.filesDisclaimerContactInput.value.length;
  }
}

function closeFilesDisclaimerContactView({ clearText = false } = {}) {
  resetFilesDisclaimerGateContactState({ clearText });
  setFilesDisclaimerGateFeedback("", "");
  renderFilesAccessView();
}

function renderFilesDisclaimerGateView({
  loggedIn,
  authorized,
  accessRequestStatus,
  accessDisclaimerDecision
} = {}) {
  if (!elements.filesDisclaimerGateView) {
    return;
  }

  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  const resolvedDecision = normalizeFilesDisclaimerDecision(accessDisclaimerDecision);
  const showGate = resolvedLoggedIn && !resolvedAuthorized && resolvedStatus === "approved";
  const showDeclinedState = showGate && resolvedDecision === "declined";
  const showContactView = showDeclinedState && Boolean(state.files.disclaimerGate.contactOpen);
  elements.filesDisclaimerGateView.hidden = !showGate;

  if (!showGate) {
    state.files.disclaimerGate.busy = false;
    state.files.disclaimerGate.pendingDecision = "";
    setFilesDisclaimerGateFeedback("", "");
    resetFilesDisclaimerGateContactState({ clearText: true });
    return;
  }
  if (!showDeclinedState) {
    resetFilesDisclaimerGateContactState({ clearText: true });
  }

  const busy = Boolean(state.files.disclaimerGate.busy);
  const pendingDecision = String(state.files.disclaimerGate.pendingDecision || "").trim().toLowerCase();
  const contactBusy = Boolean(state.files.disclaimerGate.contactBusy);

  if (elements.filesDisclaimerGateBadge) {
    elements.filesDisclaimerGateBadge.textContent = showDeclinedState
      ? t("files_disclaimer_gate_declined_badge")
      : t("files_disclaimer_gate_badge");
  }

  if (elements.filesDisclaimerGateActions) {
    elements.filesDisclaimerGateActions.hidden = showDeclinedState;
  }
  if (elements.filesDisclaimerAgreeBtn) {
    elements.filesDisclaimerAgreeBtn.disabled = busy || showDeclinedState;
    elements.filesDisclaimerAgreeBtn.textContent = busy && pendingDecision === "accepted"
      ? t("files_disclaimer_gate_agree_busy")
      : t("files_disclaimer_gate_agree_button");
  }
  if (elements.filesDisclaimerDeclineBtn) {
    elements.filesDisclaimerDeclineBtn.disabled = busy || showDeclinedState;
    elements.filesDisclaimerDeclineBtn.textContent = busy && pendingDecision === "declined"
      ? t("files_disclaimer_gate_decline_busy")
      : t("files_disclaimer_gate_decline_button");
  }

  if (elements.filesDisclaimerDeclinedPanel) {
    elements.filesDisclaimerDeclinedPanel.hidden = !showDeclinedState || showContactView;
  }
  if (elements.filesDisclaimerContactBtn) {
    elements.filesDisclaimerContactBtn.disabled = contactBusy;
  }
  if (elements.filesDisclaimerContactView) {
    elements.filesDisclaimerContactView.hidden = !showContactView;
  }
  if (elements.filesDisclaimerContactInput) {
    if (elements.filesDisclaimerContactInput.value !== state.files.disclaimerGate.contactText) {
      elements.filesDisclaimerContactInput.value = state.files.disclaimerGate.contactText;
    }
    elements.filesDisclaimerContactInput.disabled = contactBusy;
  }
  if (elements.filesDisclaimerContactCancelBtn) {
    elements.filesDisclaimerContactCancelBtn.disabled = contactBusy;
  }
  if (elements.filesDisclaimerContactSendBtn) {
    elements.filesDisclaimerContactSendBtn.disabled = contactBusy;
    elements.filesDisclaimerContactSendBtn.textContent = contactBusy
      ? t("files_disclaimer_gate_contact_send_busy")
      : t("files_disclaimer_gate_contact_send_button");
  }

  if (elements.filesDisclaimerGateFeedback) {
    const message = String(state.files.disclaimerGate.message || "");
    const hasMessage = Boolean(message);
    elements.filesDisclaimerGateFeedback.hidden = !hasMessage;
    elements.filesDisclaimerGateFeedback.textContent = hasMessage ? message : "";
    elements.filesDisclaimerGateFeedback.classList.toggle("is-success", state.files.disclaimerGate.messageKind === "success");
    elements.filesDisclaimerGateFeedback.classList.toggle("is-error", state.files.disclaimerGate.messageKind === "error");
  }
}

async function submitFilesDisclaimerReevaluation() {
  if (state.files.disclaimerGate.contactBusy) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  if (!shouldShowFilesDisclaimerGate(me)) {
    return;
  }
  if (normalizeFilesDisclaimerDecision(me.accessDisclaimerDecision) !== "declined") {
    return;
  }

  const rawExplanation = elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement
    ? String(elements.filesDisclaimerContactInput.value || "")
    : String(state.files.disclaimerGate.contactText || "");
  const explanation = rawExplanation.trim();
  state.files.disclaimerGate.contactText = rawExplanation;

  if (!explanation) {
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_required"), "error");
    if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
      elements.filesDisclaimerContactInput.classList.add("is-invalid");
      elements.filesDisclaimerContactInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (explanation.length > FILES_ACCESS_REQUEST_REASON_MAX) {
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_too_long"), "error");
    if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
      elements.filesDisclaimerContactInput.classList.add("is-invalid");
      elements.filesDisclaimerContactInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
    elements.filesDisclaimerContactInput.classList.remove("is-invalid");
  }

  state.files.disclaimerGate.contactBusy = true;
  setFilesDisclaimerGateFeedback("", "");
  renderFilesAccessView();

  try {
    await requestJson("/api/files/disclaimer-reevaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        explanation
      })
    });
    state.files.me = {
      ...normalizeFilesProfile(state.files.me),
      accessDisclaimerReevaluationRequestedAt: new Date().toISOString()
    };
    resetFilesDisclaimerGateContactState({ clearText: true });
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_success"), "success");
  } catch (error) {
    const serverMessage = String(error?.message || "").trim().toLowerCase();
    let message = t("files_disclaimer_gate_contact_error");
    if (error?.status === 503) {
      message = t("files_disclaimer_gate_contact_unavailable");
    } else if (error?.status === 429 || serverMessage.includes("pending")) {
      message = t("files_disclaimer_gate_contact_pending");
      resetFilesDisclaimerGateContactState({ clearText: false });
    } else if (error?.status === 400) {
      message = serverMessage.includes("required")
        ? t("files_disclaimer_gate_contact_required")
        : (serverMessage.includes("long") || serverMessage.includes("exceed") || serverMessage.includes("character"))
            ? t("files_disclaimer_gate_contact_too_long")
            : t("files_disclaimer_gate_contact_error");
    }
    setFilesDisclaimerGateFeedback(message, "error");
  } finally {
    state.files.disclaimerGate.contactBusy = false;
    renderFilesAccessView();
  }
}

async function submitFilesDisclaimerDecision(decision) {
  const normalizedDecision = normalizeFilesDisclaimerDecision(decision);
  const isAcceptDecision = normalizedDecision === "accepted";
  if (normalizedDecision !== "accepted" && normalizedDecision !== "declined") {
    return;
  }
  if (state.files.disclaimerGate.busy) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  if (!shouldShowFilesDisclaimerGate(me)) {
    return;
  }

  state.files.disclaimerGate.busy = true;
  state.files.disclaimerGate.pendingDecision = normalizedDecision;
  setFilesDisclaimerGateFeedback("", "");
  if (isAcceptDecision) {
    startFilesDisclaimerAcceptTransition();
    resetFilesDisclaimerGateContactState({ clearText: true });
  }
  renderFilesAccessView();

  try {
    await requestJson("/api/files/disclaimer-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        decision: normalizedDecision
      })
    });
    await refreshFilesIdentity({ loadFiles: isAcceptDecision });
    if (isAcceptDecision) {
      const startedAt = Number(state.files.disclaimerGate.acceptTransitionStartedAt) || Date.now();
      const elapsedMs = Math.max(0, Date.now() - startedAt);
      const remainingMs = Math.max(0, FILES_DISCLAIMER_ACCEPT_MIN_MS - elapsedMs);
      if (remainingMs > 0) {
        await sleep(remainingMs);
      }
      stopFilesDisclaimerAcceptTransition({ immediate: false });
    }
  } catch (error) {
    if (isAcceptDecision) {
      stopFilesDisclaimerAcceptTransition({ immediate: true });
    }
    const serverMessage = String(error?.message || "").trim();
    const message = serverMessage || t("files_disclaimer_gate_error");
    setFilesDisclaimerGateFeedback(message, "error");
  } finally {
    state.files.disclaimerGate.busy = false;
    state.files.disclaimerGate.pendingDecision = "";
    renderFilesAccessView();
  }
}

function renderFilesSearchResults() {
  if (!elements.filesSearchResults || !elements.filesSearchInput) {
    return;
  }

  if (!state.files.search.open || !state.files.me?.isAuthorized) {
    elements.filesSearchResults.innerHTML = "";
    elements.filesSearchResults.hidden = true;
    setFilesSearchCount("");
    return;
  }

  const query = String(elements.filesSearchInput.value || "").trim();
  state.files.search.query = query;
  elements.filesSearchResults.hidden = false;

  const setSearchMessage = (message) => {
    elements.filesSearchResults.innerHTML = `<p class="files-search-empty">${message}</p>`;
  };

  if (state.files.loadingList && !state.files.list.length) {
    setFilesSearchCount("");
    setSearchMessage(t("files_loading_state"));
    return;
  }

  if (state.files.listError) {
    setFilesSearchCount("");
    setSearchMessage(state.files.listError);
    return;
  }

  if (!query) {
    setFilesSearchCount("");
    setSearchMessage(t("files_search_prompt"));
    return;
  }

  const matches = getFilteredFilesList(state.files.list);
  if (!matches.length) {
    setFilesSearchCount(t("files_search_results_count", { n: "0" }));
    setSearchMessage(t("files_search_no_results"));
    return;
  }

  setFilesSearchCount(t("files_search_results_count", { n: String(matches.length) }));
  const fragment = document.createDocumentFragment();
  const limitedMatches = matches.slice(0, 200);

  for (let index = 0; index < limitedMatches.length; index += 1) {
    const file = limitedMatches[index];
    const fileId = String(file.id || "");
    const fileName = getFilesDisplayName(file);
    const fileType = resolveFileTypeLabel(file);
    const fileSize = formatFileSize(file.size);
    const uploadDate = formatFileDateTime(file.uploadedAt || file.uploaded_at);

    const row = document.createElement("article");
    row.className = "files-search-row";
    row.style.setProperty("--files-search-index", String(Math.min(index, 9)));

    const itemField = document.createElement("div");
    itemField.className = "files-search-cell files-search-item";
    itemField.innerHTML = `<span class="files-search-k">${t("files_name_label")}</span>`;

    const itemValue = document.createElement("span");
    itemValue.className = "files-search-v";
    itemValue.textContent = fileName;
    itemField.appendChild(itemValue);

    const typeField = document.createElement("div");
    typeField.className = "files-search-cell";
    typeField.innerHTML = `<span class="files-search-k">${t("files_type_label")}</span>`;
    const typeValue = document.createElement("span");
    typeValue.className = "files-search-v";
    typeValue.textContent = fileType;
    typeField.appendChild(typeValue);

    const sizeField = document.createElement("div");
    sizeField.className = "files-search-cell";
    sizeField.innerHTML = `<span class="files-search-k">${t("files_size_label")}</span>`;
    const sizeValue = document.createElement("span");
    sizeValue.className = "files-search-v";
    sizeValue.textContent = fileSize;
    sizeField.appendChild(sizeValue);

    const uploadedField = document.createElement("div");
    uploadedField.className = "files-search-cell";
    uploadedField.innerHTML = `<span class="files-search-k">${t("files_uploaded_label")}</span>`;
    const uploadedValue = document.createElement("span");
    uploadedValue.className = "files-search-v";
    uploadedValue.textContent = uploadDate;
    uploadedField.appendChild(uploadedValue);

    const actionField = document.createElement("div");
    actionField.className = "files-search-cell files-search-action";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "files-search-open";
    openButton.textContent = t("files_search_open_file");
    openButton.setAttribute("data-files-action", "open-detail-search");
    openButton.setAttribute("data-file-id", fileId);
    actionField.appendChild(openButton);

    row.appendChild(itemField);
    row.appendChild(typeField);
    row.appendChild(sizeField);
    row.appendChild(uploadedField);
    row.appendChild(actionField);
    fragment.appendChild(row);
  }

  elements.filesSearchResults.innerHTML = "";
  elements.filesSearchResults.appendChild(fragment);
}

function renderFilesList() {
  if (!elements.filesList || !elements.filesEmptyState) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const canReadFiles = Boolean(me.isAuthorized);
  const showRestrictedNotice = me.loggedIn && !canReadFiles && !shouldShowFilesDisclaimerGate(me);
  const pendingTransition = String(state.files.transition || "");
  const reuseManagerMode = Boolean(state.files.groupManager.open && me.isAdmin);
  const reuseSelectedId = String(state.files.selectedId || "");
  const reuseSelectedFile = reuseSelectedId
    ? state.files.list.find((entry) => String(entry.id || "") === reuseSelectedId) || null
    : null;
  if (canReadFiles && reuseSelectedFile && !reuseManagerMode && pendingTransition !== "to-detail") {
    const currentDetailKey = String(elements.filesList.dataset.detailRenderKey || "");
    const nextDetailKey = buildFilesDetailRenderKey(reuseSelectedFile, {
      isAdmin: Boolean(me.isAdmin)
    });
    if (currentDetailKey && currentDetailKey === nextDetailKey && elements.filesList.classList.contains("is-detail-mode")) {
      state.files.transition = "";
      state.files.groupTransition = "";
      elements.filesList.classList.remove(
        "is-transition-to-detail",
        "is-transition-to-list",
        "is-transition-group-open",
        "is-transition-group-close"
      );
      elements.filesList.classList.add("is-detail-mode");
      elements.filesList.hidden = false;
      elements.filesEmptyState.hidden = true;
      elements.filesEmptyState.textContent = "";
      elements.filesEmptyState.classList.remove("is-restricted");
      elements.filesBrowserPanel?.classList.toggle("is-restricted", showRestrictedNotice);
      setFilesSearchCount("");
      if (elements.filesSearchResults) {
        elements.filesSearchResults.innerHTML = "";
        elements.filesSearchResults.hidden = true;
      }
      return;
    }
  }
  elements.filesList.replaceChildren();
  delete elements.filesList.dataset.detailRenderKey;
  elements.filesList.classList.remove(
    "is-detail-mode",
    "is-transition-to-detail",
    "is-transition-to-list",
    "is-transition-group-open",
    "is-transition-group-close"
  );
  elements.filesEmptyState.classList.remove("is-restricted");
  elements.filesBrowserPanel?.classList.toggle("is-restricted", showRestrictedNotice);
  const transition = String(state.files.transition || "");
  const groupTransition = String(state.files.groupTransition || "");
  state.files.transition = "";
  state.files.groupTransition = "";

  if (!canReadFiles) {
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    if (state.files.search.open || state.files.search.query) {
      setFilesSearchOpen(false, { clearQuery: true });
      return;
    }

    setFilesSearchCount("");
    elements.filesList.hidden = true;
    elements.filesEmptyState.hidden = true;
    elements.filesEmptyState.textContent = "";
    elements.filesEmptyState.classList.remove("is-restricted");
    if (!showRestrictedNotice) {
      if (elements.filesRestrictedView) {
        elements.filesRestrictedView.hidden = true;
      }
      if (elements.filesDeniedView) {
        elements.filesDeniedView.hidden = true;
      }
    }
    if (elements.filesSearchResults) {
      elements.filesSearchResults.innerHTML = "";
      elements.filesSearchResults.hidden = true;
    }
    return;
  }

  if (elements.filesRestrictedView) {
    elements.filesRestrictedView.hidden = true;
  }
  if (elements.filesDeniedView) {
    elements.filesDeniedView.hidden = true;
  }
  syncFilesGroupSuggestions();

  const isSearchMode = Boolean(state.files.search.open);
  const managerMode = Boolean(state.files.groupManager.open && me.isAdmin);
  const selectedId = String(state.files.selectedId || "");
  const selectedFile = selectedId
    ? state.files.list.find((entry) => String(entry.id || "") === selectedId) || null
    : null;

  if (selectedId && !selectedFile) {
    state.files.selectedId = "";
    state.files.detailOrigin = "";
  }

  if (managerMode && selectedFile) {
    state.files.selectedId = "";
    state.files.detailOrigin = "";
  }

  if (selectedFile && !managerMode) {
    elements.filesList.hidden = false;
    if (elements.filesSearchResults) {
      elements.filesSearchResults.innerHTML = "";
      elements.filesSearchResults.hidden = true;
    }
    elements.filesList.classList.add("is-detail-mode");
    if (transition === "to-detail") {
      elements.filesList.classList.add("is-transition-to-detail");
    }
    elements.filesEmptyState.hidden = true;
    renderFilesDetailCard(selectedFile);
    return;
  }

  if (isSearchMode && !managerMode) {
    elements.filesList.hidden = true;
    elements.filesEmptyState.hidden = true;
    renderFilesSearchResults();
    return;
  }

  elements.filesList.hidden = false;
  setFilesSearchCount("");
  if (elements.filesSearchResults) {
    elements.filesSearchResults.innerHTML = "";
    elements.filesSearchResults.hidden = true;
  }

  let emptyMessage = "";
  if (state.files.loadingList && !state.files.list.length) {
    emptyMessage = t("files_loading_state");
  } else if (state.files.listError) {
    emptyMessage = state.files.listError;
  } else if (!state.files.list.length) {
    emptyMessage = t("files_empty_state");
  }

  if (emptyMessage) {
    elements.filesEmptyState.hidden = false;
    elements.filesEmptyState.textContent = emptyMessage;
    return;
  }

  if (transition === "to-list") {
    elements.filesList.classList.add("is-transition-to-list");
  }
  if (groupTransition === "open") {
    elements.filesList.classList.add("is-transition-group-open");
  } else if (groupTransition === "close") {
    elements.filesList.classList.add("is-transition-group-close");
  }

  elements.filesEmptyState.hidden = true;
  const fragment = document.createDocumentFragment();
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];

  const groups = [];
  const groupsByKey = new Map();
  for (const file of baseFiles) {
    const normalizedGroup = normalizeFilesGroup(file.group || "");
    const key = getFilesGroupKey(normalizedGroup);
    if (!groupsByKey.has(key)) {
      const nextGroup = {
        key,
        label: normalizedGroup || t("files_group_default"),
        files: []
      };
      groupsByKey.set(key, nextGroup);
      groups.push(nextGroup);
    }
    groupsByKey.get(key).files.push(file);
  }

  const activeGroupKey = String(state.files.activeGroupKey || "").trim();
  const activeGroup = activeGroupKey
    ? groups.find((entry) => entry.key === activeGroupKey) || null
    : null;
  if (activeGroupKey && !activeGroup) {
    state.files.activeGroupKey = "";
  }
  const hasFocusedGroup = Boolean(activeGroup && state.files.activeGroupKey);
  if (!hasFocusedGroup && state.files.rename.fileId) {
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
  }
  if (!hasFocusedGroup && !managerMode) {
    state.files.groupManager.selectedIds = [];
  }
  const groupsToRender = hasFocusedGroup ? [activeGroup] : groups;

  if (state.files.rename.fileId && !baseFiles.some((entry) => String(entry.id || "") === state.files.rename.fileId)) {
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
  }
  const availableFileIds = new Set(baseFiles.map((entry) => String(entry?.id || "")));
  state.files.groupManager.selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter((value) => value && availableFileIds.has(value));
  if (hasFocusedGroup) {
    const focusedIds = new Set((activeGroup?.files || []).map((entry) => String(entry?.id || "")));
    state.files.groupManager.selectedIds = state.files.groupManager.selectedIds.filter((value) => focusedIds.has(value));
  }

  if (managerMode) {
    const managerFiles = getFilteredFilesList(baseFiles);
    const managerVisibleIds = new Set(managerFiles.map((entry) => String(entry?.id || "").trim()).filter(Boolean));
    state.files.groupManager.selectedIds = state.files.groupManager.selectedIds
      .map((value) => String(value || "").trim())
      .filter((value) => value && managerVisibleIds.has(value));

    if (isSearchMode) {
      setFilesSearchCount(t("files_search_results_count", { n: String(managerFiles.length) }));
    }

    if (!managerFiles.length) {
      elements.filesEmptyState.hidden = false;
      elements.filesEmptyState.textContent = isSearchMode
        ? t("files_search_no_results")
        : t("files_group_manager_no_files");
      return;
    }

    const targetGroup = normalizeFilesGroup(state.files.groupManager.targetGroup || "");
    const managerList = document.createElement("section");
    managerList.className = "files-group-manager-list";
    let renderedIndex = 0;

    for (const file of managerFiles) {
      const fileId = String(file.id || "");
      const fileName = getFilesDisplayName(file);
      const fileType = resolveFileTypeLabel(file);
      const fileTypeBadgeLabel = getFilesTypeBadgeLabel(file);
      const fileTypeSummaryLabel = fileTypeBadgeLabel || fileType;
      const fileSize = formatFileSize(file.size);
      const uploadDate = formatFileDateTime(file.uploadedAt || file.uploaded_at);
      const uploader = String(file.uploader || t("files_unknown_value"));
      const selectedForGrouping = state.files.groupManager.selectedIds.includes(fileId);
      const groupStatus = resolveFilesGroupManagerFileStatus(file, targetGroup);

      const card = document.createElement("article");
      card.className = "panel files-file-card files-file-card-manager";
      card.style.setProperty("--files-item-index", String(Math.min(renderedIndex, 9)));
      renderedIndex += 1;

      const cardBody = document.createElement("div");
      cardBody.className = "files-file-toggle files-file-toggle-static";

      const cardHead = document.createElement("div");
      cardHead.className = "files-file-head";

      const title = document.createElement("p");
      title.className = "files-file-name";
      title.textContent = fileName;

      const badges = document.createElement("div");
      badges.className = "files-file-badges";

      const typeBadge = document.createElement("span");
      typeBadge.className = "files-file-badge is-type";
      typeBadge.textContent = fileTypeBadgeLabel;
      badges.appendChild(typeBadge);

      if (file.hasImage || file.imageUrl) {
        const imageBadge = document.createElement("span");
        imageBadge.className = "files-file-badge is-image";
        imageBadge.textContent = "IMG";
        badges.appendChild(imageBadge);
      }

      cardHead.appendChild(title);
      cardHead.appendChild(badges);

      const summary = document.createElement("div");
      summary.className = "files-file-summary";

      const typeSummary = document.createElement("span");
      typeSummary.className = "files-file-pill";
      typeSummary.textContent = `${t("files_type_label")}: ${fileTypeSummaryLabel}`;
      if (fileType && fileType !== fileTypeSummaryLabel) {
        typeSummary.title = fileType;
      }

      const sizeSummary = document.createElement("span");
      sizeSummary.className = "files-file-pill";
      sizeSummary.textContent = `${t("files_size_label")}: ${fileSize}`;

      summary.appendChild(typeSummary);
      summary.appendChild(sizeSummary);

      const footer = document.createElement("div");
      footer.className = "files-file-footer";

      const dateSummary = document.createElement("span");
      dateSummary.className = "files-file-footer-item";
      dateSummary.textContent = `${t("files_uploaded_label")}: ${uploadDate}`;

      const uploaderSummary = document.createElement("span");
      uploaderSummary.className = "files-file-footer-item";
      uploaderSummary.textContent = `${t("files_uploader_label")}: ${uploader}`;

      footer.appendChild(dateSummary);
      footer.appendChild(uploaderSummary);

      cardBody.appendChild(cardHead);
      cardBody.appendChild(summary);
      cardBody.appendChild(footer);
      card.appendChild(cardBody);

      const managerWrap = document.createElement("div");
      managerWrap.className = "files-file-rename-wrap files-file-group-manager-wrap";

      const statusText = document.createElement("p");
      statusText.className = `files-file-group-status is-${groupStatus.kind}`;
      statusText.textContent = groupStatus.text;
      managerWrap.appendChild(statusText);

      const selectLabel = document.createElement("label");
      selectLabel.className = "files-file-group-select";

      const selectInput = document.createElement("input");
      selectInput.type = "checkbox";
      selectInput.className = "files-file-group-select-input";
      selectInput.setAttribute("data-files-group-select", "true");
      selectInput.setAttribute("data-file-id", fileId);
      selectInput.checked = selectedForGrouping;
      selectInput.disabled = state.files.groupManager.busy;

      const selectText = document.createElement("span");
      selectText.textContent = t("files_group_manager_select_file_label");

      selectLabel.appendChild(selectInput);
      selectLabel.appendChild(selectText);
      managerWrap.appendChild(selectLabel);
      card.appendChild(managerWrap);

      managerList.appendChild(card);
    }

    fragment.appendChild(managerList);
    elements.filesList.appendChild(fragment);
    return;
  }

  if (hasFocusedGroup) {
    const focusBar = document.createElement("div");
    focusBar.className = "files-group-focus-bar";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "files-btn files-group-back-btn";
    backButton.textContent = t("files_groups_back_button");
    backButton.setAttribute("data-files-action", "clear-group-filter");
    focusBar.appendChild(backButton);

    const activeLabel = document.createElement("span");
    activeLabel.className = "files-group-focus-label";
    activeLabel.textContent = activeGroup.label;
    focusBar.appendChild(activeLabel);
    fragment.appendChild(focusBar);
  }

  let renderedIndex = 0;
  let renderedGroupIndex = 0;
  for (const groupEntry of groupsToRender) {
    const groupWrap = document.createElement("section");
    groupWrap.className = "files-group-section";
    groupWrap.classList.toggle("is-open", hasFocusedGroup);
    groupWrap.style.setProperty("--files-group-index", String(Math.min(renderedGroupIndex, 8)));
    renderedGroupIndex += 1;

    const groupHead = document.createElement("div");
    groupHead.className = "files-group-head";
    const canRenameFocusedGroup = hasFocusedGroup
      && Boolean(state.files.me?.isAdmin)
      && groupEntry.key !== "__ungrouped__";

    const groupToggle = document.createElement("button");
    groupToggle.type = "button";
    groupToggle.className = "files-group-toggle";
    groupToggle.setAttribute("data-files-action", "select-group");
    groupToggle.setAttribute("data-group-key", groupEntry.key);
    groupToggle.setAttribute("aria-expanded", hasFocusedGroup ? "true" : "false");
    groupToggle.disabled = hasFocusedGroup;

    const groupTitle = document.createElement("span");
    groupTitle.className = "files-group-title";
    groupTitle.textContent = groupEntry.label;

    const groupMeta = document.createElement("span");
    groupMeta.className = "files-group-meta";

    const groupCount = document.createElement("span");
    groupCount.className = "files-group-count";
    const groupTotalBytes = groupEntry.files.reduce((acc, item) => acc + (Number(item?.size) || 0), 0);
    groupCount.textContent = `${formatFilesGroupCount(groupEntry.files.length)} · ${formatFileSize(groupTotalBytes)}`;

    groupMeta.appendChild(groupCount);
    if (!hasFocusedGroup) {
      const openHint = document.createElement("span");
      openHint.className = "files-group-open-hint";
      openHint.textContent = t("files_group_open_button");
      groupMeta.appendChild(openHint);
    }

    const groupCaret = document.createElement("span");
    groupCaret.className = "files-group-caret";
    groupCaret.setAttribute("aria-hidden", "true");
    groupCaret.textContent = ">";
    groupMeta.appendChild(groupCaret);

    groupToggle.appendChild(groupTitle);
    groupToggle.appendChild(groupMeta);
    groupHead.appendChild(groupToggle);

    if (canRenameFocusedGroup) {
      const renameGroupButton = document.createElement("button");
      renameGroupButton.type = "button";
      renameGroupButton.className = "files-group-rename-btn";
      renameGroupButton.textContent = "✎";
      renameGroupButton.setAttribute("data-files-action", "rename-group");
      renameGroupButton.setAttribute("data-group-key", groupEntry.key);
      renameGroupButton.setAttribute("data-group-label", groupEntry.label || "");
      const renameLabel = t("files_group_rename_button_label", { group: groupEntry.label || t("files_group_default") });
      renameGroupButton.setAttribute("aria-label", renameLabel);
      renameGroupButton.disabled = Boolean(state.files.groupRename.busy);
      groupHead.appendChild(renameGroupButton);
    }

    const groupList = document.createElement("div");
    groupList.className = "files-group-list";
    groupList.hidden = !hasFocusedGroup;

    if (hasFocusedGroup) {
      for (let index = 0; index < groupEntry.files.length; index += 1) {
        const file = groupEntry.files[index];
        const fileId = String(file.id || "");
        const fileName = getFilesDisplayName(file);
        const fileType = resolveFileTypeLabel(file);
        const fileTypeBadgeLabel = getFilesTypeBadgeLabel(file);
        const fileTypeSummaryLabel = fileTypeBadgeLabel || fileType;
        const fileSize = formatFileSize(file.size);
        const uploadDate = formatFileDateTime(file.uploadedAt || file.uploaded_at);
        const uploader = String(file.uploader || t("files_unknown_value"));
        const isRenaming = Boolean(state.files.rename.fileId) && state.files.rename.fileId === fileId;
        const renameBusy = isRenaming && Boolean(state.files.rename.busy);
        const selectedForGrouping = state.files.groupManager.selectedIds.includes(fileId);

        const card = document.createElement("article");
        card.className = "panel files-file-card";
        card.style.setProperty("--files-item-index", String(Math.min(renderedIndex, 9)));
        renderedIndex += 1;

        const openButton = document.createElement("div");
        openButton.className = "files-file-toggle";
        openButton.setAttribute("role", "button");
        openButton.tabIndex = 0;
        openButton.setAttribute("data-files-action", "open-detail");
        openButton.setAttribute("data-file-id", fileId);

        const cardHead = document.createElement("div");
        cardHead.className = "files-file-head";

        const title = document.createElement("p");
        title.className = "files-file-name";
        title.textContent = fileName;

        const badges = document.createElement("div");
        badges.className = "files-file-badges";

        const typeBadge = document.createElement("span");
        typeBadge.className = "files-file-badge is-type";
        typeBadge.textContent = fileTypeBadgeLabel;
        badges.appendChild(typeBadge);

        if (file.hasImage || file.imageUrl) {
          const imageBadge = document.createElement("span");
          imageBadge.className = "files-file-badge is-image";
          imageBadge.textContent = "IMG";
          badges.appendChild(imageBadge);
        }

        cardHead.appendChild(title);
        cardHead.appendChild(badges);

        const summary = document.createElement("div");
        summary.className = "files-file-summary";

        const typeSummary = document.createElement("span");
        typeSummary.className = "files-file-pill";
        typeSummary.textContent = `${t("files_type_label")}: ${fileTypeSummaryLabel}`;
        if (fileType && fileType !== fileTypeSummaryLabel) {
          typeSummary.title = fileType;
        }
        const sizeSummary = document.createElement("span");
        sizeSummary.className = "files-file-pill";
        sizeSummary.textContent = `${t("files_size_label")}: ${fileSize}`;

        summary.appendChild(typeSummary);
        summary.appendChild(sizeSummary);

        const footer = document.createElement("div");
        footer.className = "files-file-footer";

        const dateSummary = document.createElement("span");
        dateSummary.className = "files-file-footer-item";
        dateSummary.textContent = `${t("files_uploaded_label")}: ${uploadDate}`;

        const uploaderSummary = document.createElement("span");
        uploaderSummary.className = "files-file-footer-item";
        uploaderSummary.textContent = `${t("files_uploader_label")}: ${uploader}`;

        footer.appendChild(dateSummary);
        footer.appendChild(uploaderSummary);

        openButton.appendChild(cardHead);
        openButton.appendChild(summary);
        openButton.appendChild(footer);
        card.appendChild(openButton);

        if (state.files.me?.isAdmin) {
          const renameWrap = document.createElement("div");
          renameWrap.className = "files-file-rename-wrap";

          if (hasFocusedGroup && state.files.groupManager.open) {
            const selectLabel = document.createElement("label");
            selectLabel.className = "files-file-group-select";

            const selectInput = document.createElement("input");
            selectInput.type = "checkbox";
            selectInput.className = "files-file-group-select-input";
            selectInput.setAttribute("data-files-group-select", "true");
            selectInput.setAttribute("data-file-id", fileId);
            selectInput.checked = selectedForGrouping;
            selectInput.disabled = state.files.groupManager.busy;

            const selectText = document.createElement("span");
            selectText.textContent = t("files_group_manager_select_file_label");

            selectLabel.appendChild(selectInput);
            selectLabel.appendChild(selectText);
            renameWrap.appendChild(selectLabel);
          }

          if (isRenaming) {
            const renameForm = document.createElement("form");
            renameForm.className = "files-file-rename-form";
            renameForm.noValidate = true;
            renameForm.setAttribute("data-files-rename-form", "true");
            renameForm.setAttribute("data-file-id", fileId);

            const renameInput = document.createElement("input");
            renameInput.type = "text";
            renameInput.name = "displayName";
            renameInput.className = "files-file-rename-input";
            renameInput.maxLength = 180;
            renameInput.placeholder = t("files_rename_placeholder");
            renameInput.value = state.files.rename.value || fileName;
            renameInput.disabled = renameBusy;

            const renameActions = document.createElement("div");
            renameActions.className = "files-file-rename-actions";

            const saveRenameBtn = document.createElement("button");
            saveRenameBtn.type = "submit";
            saveRenameBtn.className = "files-card-action files-file-rename-save";
            saveRenameBtn.textContent = renameBusy ? t("files_rename_busy") : t("files_rename_save_button");
            saveRenameBtn.disabled = renameBusy;

            const cancelRenameBtn = document.createElement("button");
            cancelRenameBtn.type = "button";
            cancelRenameBtn.className = "files-card-action files-file-rename-cancel";
            cancelRenameBtn.textContent = t("files_rename_cancel_button");
            cancelRenameBtn.setAttribute("data-files-action", "cancel-rename");
            cancelRenameBtn.setAttribute("data-file-id", fileId);
            cancelRenameBtn.disabled = renameBusy;

            renameActions.appendChild(saveRenameBtn);
            renameActions.appendChild(cancelRenameBtn);

            renameForm.appendChild(renameInput);
            renameForm.appendChild(renameActions);
            renameWrap.appendChild(renameForm);
          } else {
            const renameButton = document.createElement("button");
            renameButton.type = "button";
            renameButton.className = "files-card-action files-file-rename-button";
            renameButton.textContent = t("files_rename_button");
            renameButton.setAttribute("data-files-action", "start-rename");
            renameButton.setAttribute("data-file-id", fileId);
            renameWrap.appendChild(renameButton);
          }
          card.appendChild(renameWrap);
        }

        groupList.appendChild(card);
      }
    }

    groupWrap.appendChild(groupHead);
    groupWrap.appendChild(groupList);
    fragment.appendChild(groupWrap);
  }

  elements.filesList.appendChild(fragment);
}

function renderFilesAccessView() {
  const isFileProtocol = window.location.protocol === "file:";
  const me = normalizeFilesProfile(state.files.me);
  const loggedIn = me.loggedIn;
  const authorized = me.isAuthorized;
  const isAdmin = me.isAdmin;
  const showDisclaimerGate = shouldShowFilesDisclaimerGate(me);
  const showRestrictedLayout = loggedIn && !authorized;
  const showAuthorizedLayout = authorized || showRestrictedLayout;
  const showUploadPanel = authorized && isAdmin;
  const disclaimerAcceptTransitionActive = Boolean(state.files.disclaimerGate.acceptTransitionActive);
  const disclaimerAcceptTransitionExiting = Boolean(state.files.disclaimerGate.acceptTransitionExiting);
  const showDisclaimerAcceptLoader = disclaimerAcceptTransitionActive || disclaimerAcceptTransitionExiting;

  if (elements.filesBrowserPanel) {
    elements.filesBrowserPanel.classList.toggle("is-disclaimer-accept-loading", showDisclaimerAcceptLoader);
  }
  if (elements.filesDisclaimerAcceptLoader) {
    elements.filesDisclaimerAcceptLoader.hidden = !showDisclaimerAcceptLoader;
    elements.filesDisclaimerAcceptLoader.classList.toggle("is-visible", showDisclaimerAcceptLoader);
    elements.filesDisclaimerAcceptLoader.classList.toggle(
      "is-active",
      disclaimerAcceptTransitionActive && !disclaimerAcceptTransitionExiting
    );
    elements.filesDisclaimerAcceptLoader.classList.toggle("is-exiting", disclaimerAcceptTransitionExiting);
  }

  if (showDisclaimerGate) {
    state.files.accessRequestBusy = false;
    setFilesRestrictedRequestFeedback("", "");
  }

  syncFilesDecisionNoticeFromProfile(me);

  if ((!authorized || !isAdmin) && state.files.deleteModal.open) {
    closeFilesDeleteModal({ force: true });
  }

  document.body.classList.toggle("is-files-unauthorized", !authorized);
  document.body.classList.toggle("is-files-guest", !loggedIn && !authorized);

  if (elements.filesBrowserTitle) {
    if (showDisclaimerGate) {
      elements.filesBrowserTitle.textContent = t("files_disclaimer_gate_browser_title");
    } else {
      elements.filesBrowserTitle.textContent = showRestrictedLayout
        ? t("files_restricted_browser_title")
        : t("files_file_index_title");
    }
  }

  if (isFileProtocol) {
    if (state.files.adminModal.active) {
      state.files.adminModal.active = "";
    }
    if (state.files.groupRename.open) {
      clearFilesGroupRenameState();
    }
    if (state.files.disclaimerModal.open) {
      state.files.disclaimerModal.open = false;
    }
    renderFilesSessionProfile({
      loggedIn: false,
      authorized: false,
      isAdmin: false,
      username: "",
      discordId: "",
      accessRequestStatus: "none"
    });
    if (elements.filesUnauthorizedPanel) {
      elements.filesUnauthorizedPanel.hidden = false;
    }
    if (elements.filesAuthorizedView) {
      elements.filesAuthorizedView.hidden = true;
    }
    if (elements.filesNotAuthorizedMessage) {
      elements.filesNotAuthorizedMessage.hidden = false;
      elements.filesNotAuthorizedMessage.textContent = t("files_server_required_message");
    }
    if (elements.filesLoginForm) {
      elements.filesLoginForm.hidden = true;
    }
    if (elements.filesLogoutBtn) {
      elements.filesLogoutBtn.hidden = true;
    }
    if (elements.filesSessionLogoutBtn) {
      elements.filesSessionLogoutBtn.hidden = true;
    }
    if (elements.filesUploadPanel) {
      elements.filesUploadPanel.hidden = true;
    }
    if (elements.filesGroupManagerToggleBtn) {
      elements.filesGroupManagerToggleBtn.hidden = true;
    }
    if (elements.filesGroupManagerWrap) {
      elements.filesGroupManagerWrap.hidden = true;
      elements.filesGroupManagerWrap.replaceChildren();
    }
    if (elements.filesAdminRequestsPanel) {
      elements.filesAdminRequestsPanel.hidden = true;
    }
    if (elements.filesBotAdminPanel) {
      elements.filesBotAdminPanel.hidden = true;
    }
    if (elements.filesRestrictedView) {
      elements.filesRestrictedView.hidden = true;
    }
    if (elements.filesDeniedView) {
      elements.filesDeniedView.hidden = true;
    }
    if (elements.filesDisclaimerGateView) {
      elements.filesDisclaimerGateView.hidden = true;
    }
    renderFilesBotAdminPanel();
    renderFilesBotAdminLeaveModal();
    renderFilesAdminModals();
    renderFilesGroupRenameModal();
    renderFilesDisclaimerModal();
    renderFilesDecisionTabBadge();
    renderFilesList();
    return;
  }

  if (!authorized) {
    state.files.search.open = false;
    state.files.search.query = "";
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    state.files.groupManager.open = false;
    clearFilesGroupManagerState();
    if (elements.filesSearchInput) {
      elements.filesSearchInput.value = "";
    }
    if (elements.filesSearchWrap) {
      elements.filesSearchWrap.hidden = true;
    }
    if (elements.filesSearchToggleBtn) {
      elements.filesSearchToggleBtn.classList.remove("is-active");
      elements.filesSearchToggleBtn.setAttribute("aria-expanded", "false");
      elements.filesSearchToggleBtn.title = t("files_search_toggle_open_label");
      elements.filesSearchToggleBtn.setAttribute("aria-label", t("files_search_toggle_open_label"));
    }
    if (elements.filesSearchToggleText) {
      elements.filesSearchToggleText.textContent = t("files_search_toggle_open");
    }
  }

  if (elements.filesUnauthorizedPanel) {
    elements.filesUnauthorizedPanel.hidden = showAuthorizedLayout;
  }
  if (elements.filesAuthorizedView) {
    elements.filesAuthorizedView.hidden = !showAuthorizedLayout;
  }
  if (elements.filesNotAuthorizedMessage) {
    elements.filesNotAuthorizedMessage.hidden = true;
  }
  if (elements.filesLoginForm) {
    elements.filesLoginForm.hidden = loggedIn || showAuthorizedLayout;
  }
  if (elements.filesLogoutBtn) {
    elements.filesLogoutBtn.hidden = !loggedIn || showAuthorizedLayout;
  }
  if (elements.filesSessionLogoutBtn) {
    elements.filesSessionLogoutBtn.hidden = !loggedIn || !showAuthorizedLayout;
  }
  if (elements.filesUploadPanel) {
    elements.filesUploadPanel.hidden = !showUploadPanel;
  }
  if (elements.filesSearchToggleBtn) {
    elements.filesSearchToggleBtn.hidden = !authorized;
  }
  if (elements.filesGroupManagerToggleBtn) {
    elements.filesGroupManagerToggleBtn.hidden = !showUploadPanel;
    const managerOpen = showUploadPanel && Boolean(state.files.groupManager.open);
    elements.filesGroupManagerToggleBtn.classList.toggle("is-active", managerOpen);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-expanded", managerOpen ? "true" : "false");
    const managerTitleKey = managerOpen
      ? "files_group_manager_toggle_close_label"
      : "files_group_manager_toggle_open_label";
    elements.filesGroupManagerToggleBtn.title = t(managerTitleKey);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-label", t(managerTitleKey));
  }
  if (elements.filesGroupManagerToggleText) {
    const managerTextKey = showUploadPanel && state.files.groupManager.open
      ? "files_group_manager_toggle_close"
      : "files_group_manager_toggle_open";
    elements.filesGroupManagerToggleText.textContent = t(managerTextKey);
  }
  if (elements.filesGroupManagerWrap) {
    elements.filesGroupManagerWrap.hidden = !showUploadPanel || !state.files.groupManager.open;
  }
  if (!showUploadPanel) {
    state.files.groupManager.open = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.adminModal.active = "";
  }

  renderFilesSessionProfile({
    loggedIn,
    authorized,
    isAdmin,
    username: me.username,
    discordId: me.discordId,
    accessRequestStatus: me.accessRequestStatus
  });
  renderFilesDisclaimerGateView({
    loggedIn,
    authorized,
    accessRequestStatus: me.accessRequestStatus,
    accessDisclaimerDecision: me.accessDisclaimerDecision
  });
  renderFilesRestrictedView({
    loggedIn,
    authorized,
    username: me.username,
    discordId: me.discordId,
    accessRequestStatus: me.accessRequestStatus,
    accessRequestRequestedAt: me.accessRequestRequestedAt,
    accessRequestDecidedAt: me.accessRequestDecidedAt,
    accessRequestReapplyAt: me.accessRequestReapplyAt,
    accessRequestDeclineReason: me.accessRequestDeclineReason,
    accessDisclaimerDecision: me.accessDisclaimerDecision
  });
  renderFilesDeniedView({
    loggedIn,
    authorized,
    accessRequestStatus: me.accessRequestStatus,
    accessRequestDecidedAt: me.accessRequestDecidedAt,
    accessRequestReapplyAt: me.accessRequestReapplyAt,
    accessRequestDeclineReason: me.accessRequestDeclineReason
  });

  if (elements.filesUploadBtn) {
    elements.filesUploadBtn.disabled = state.files.uploadBusy;
  }
  if (elements.filesRestrictedRetryBtn) {
    const requestBusy = Boolean(state.files.accessRequestBusy);
    const requestPending = normalizeFilesAccessRequestStatus(me.accessRequestStatus) === "pending";
    const declinedCooldownActive = isFilesDeclinedCooldownActive(me);
    elements.filesRestrictedRetryBtn.disabled = requestBusy || requestPending || declinedCooldownActive || !showRestrictedLayout;
    elements.filesRestrictedRetryBtn.textContent = requestBusy
      ? t("files_restricted_request_button_busy")
      : requestPending
        ? t("files_restricted_request_button_pending")
        : t("files_restricted_retry_button");
  }
  if (elements.filesUploadInput) {
    elements.filesUploadInput.classList.toggle("is-invalid", state.files.uploadFieldInvalid);
  }
  if (elements.filesUploadFeedback) {
    if (state.files.uploadMissingFileError) {
      state.files.uploadMessage = t("files_upload_missing_file");
      state.files.uploadMessageKind = "error";
    }

    elements.filesUploadFeedback.classList.remove("is-error", "is-success");
    if (state.files.uploadMessageKind === "error") {
      elements.filesUploadFeedback.classList.add("is-error");
    } else if (state.files.uploadMessageKind === "success") {
      elements.filesUploadFeedback.classList.add("is-success");
    }

    const hasMessage = Boolean(state.files.uploadMessage);
    elements.filesUploadFeedback.hidden = !hasMessage;
    elements.filesUploadFeedback.textContent = hasMessage ? state.files.uploadMessage : "";
  }

  renderFilesAdminRequestsPanel();
  renderFilesBotAdminPanel();
  renderFilesBotAdminLeaveModal();
  renderFilesAdminModals();
  renderFilesGroupRenameModal();
  renderFilesDisclaimerModal();
  renderFilesDecisionTabBadge();
  renderFilesList();
  renderFilesGroupManagerPanel();
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload || {};
}

function getDiscordAuthPopupFeatures() {
  const leftBase = Number.isFinite(window.screenLeft) ? window.screenLeft : window.screenX;
  const topBase = Number.isFinite(window.screenTop) ? window.screenTop : window.screenY;
  const viewportWidth = Number(window.innerWidth) || Number(document.documentElement?.clientWidth) || DISCORD_AUTH_POPUP_WIDTH;
  const viewportHeight = Number(window.innerHeight) || Number(document.documentElement?.clientHeight) || DISCORD_AUTH_POPUP_HEIGHT;
  const left = Math.max(0, Math.round((Number(leftBase) || 0) + (viewportWidth - DISCORD_AUTH_POPUP_WIDTH) / 2));
  const top = Math.max(0, Math.round((Number(topBase) || 0) + (viewportHeight - DISCORD_AUTH_POPUP_HEIGHT) / 2));

  return [
    `width=${DISCORD_AUTH_POPUP_WIDTH}`,
    `height=${DISCORD_AUTH_POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=yes"
  ].join(",");
}

function stopDiscordAuthPopupWatch({ refreshIdentity = false } = {}) {
  if (discordAuthPopupPollTimer) {
    clearInterval(discordAuthPopupPollTimer);
    discordAuthPopupPollTimer = null;
  }
  discordAuthPopupWindow = null;
  if (refreshIdentity) {
    void refreshFilesIdentity({ loadFiles: true });
  }
}

function startDiscordAuthPopupWatch() {
  if (discordAuthPopupPollTimer) {
    clearInterval(discordAuthPopupPollTimer);
  }

  discordAuthPopupPollTimer = setInterval(() => {
    if (discordAuthPopupWindow && !discordAuthPopupWindow.closed) {
      return;
    }
    stopDiscordAuthPopupWatch({ refreshIdentity: true });
  }, DISCORD_AUTH_POPUP_POLL_INTERVAL_MS);
}

function openDiscordLoginPopup() {
  if (!elements.filesLoginForm) {
    return false;
  }

  if (discordAuthPopupWindow && !discordAuthPopupWindow.closed) {
    try {
      discordAuthPopupWindow.focus();
    } catch {
      // no-op
    }
    return true;
  }

  const popup = window.open("", DISCORD_AUTH_POPUP_WINDOW_NAME, getDiscordAuthPopupFeatures());
  if (!popup) {
    return false;
  }

  const form = elements.filesLoginForm;
  const previousTarget = form.getAttribute("target");
  const previousAction = form.getAttribute("action");
  discordAuthPopupWindow = popup;

  form.setAttribute("target", DISCORD_AUTH_POPUP_WINDOW_NAME);
  form.setAttribute("action", DISCORD_AUTH_POPUP_PATH);

  try {
    form.submit();
  } catch {
    try {
      popup.close();
    } catch {
      // no-op
    }
    discordAuthPopupWindow = null;
    if (previousTarget === null) {
      form.removeAttribute("target");
    } else {
      form.setAttribute("target", previousTarget);
    }
    if (previousAction === null) {
      form.removeAttribute("action");
    } else {
      form.setAttribute("action", previousAction);
    }
    return false;
  }

  if (previousTarget === null) {
    form.removeAttribute("target");
  } else {
    form.setAttribute("target", previousTarget);
  }
  if (previousAction === null) {
    form.removeAttribute("action");
  } else {
    form.setAttribute("action", previousAction);
  }

  try {
    popup.focus();
  } catch {
    // no-op
  }
  startDiscordAuthPopupWatch();
  return true;
}

function handleDiscordAuthPopupMessage(event) {
  if (event.origin !== window.location.origin) {
    return;
  }
  const payload = event.data;
  if (!payload || typeof payload !== "object" || payload.type !== DISCORD_AUTH_POST_MESSAGE_TYPE) {
    return;
  }

  try {
    if (discordAuthPopupWindow && !discordAuthPopupWindow.closed) {
      discordAuthPopupWindow.close();
    }
  } catch {
    // no-op
  }

  stopDiscordAuthPopupWatch({ refreshIdentity: true });
}

function stopFilesLiveIdentityPolling() {
  if (filesLiveIdentityPollTimer) {
    clearInterval(filesLiveIdentityPollTimer);
    filesLiveIdentityPollTimer = null;
  }
  filesLiveIdentityPollInFlight = false;
}

function startFilesLiveIdentityPolling() {
  if (filesLiveIdentityPollTimer) {
    return;
  }

  filesLiveIdentityPollTimer = setInterval(() => {
    void pollFilesIdentityLive();
  }, FILES_LIVE_IDENTITY_POLL_INTERVAL_MS);
}

function hasFilesIdentityChanged(previousProfile, nextProfile) {
  const prev = normalizeFilesProfile(previousProfile);
  const next = normalizeFilesProfile(nextProfile);
  return (
    prev.loggedIn !== next.loggedIn
    || prev.discordId !== next.discordId
    || prev.username !== next.username
    || prev.isAdmin !== next.isAdmin
    || prev.isAuthorized !== next.isAuthorized
    || prev.accessRequestStatus !== next.accessRequestStatus
    || prev.accessRequestRequestedAt !== next.accessRequestRequestedAt
    || prev.accessRequestDecidedAt !== next.accessRequestDecidedAt
    || prev.accessRequestReapplyAt !== next.accessRequestReapplyAt
    || prev.accessRequestDeclineReason !== next.accessRequestDeclineReason
    || prev.accessDisclaimerDecision !== next.accessDisclaimerDecision
    || prev.accessDisclaimerDecidedAt !== next.accessDisclaimerDecidedAt
    || prev.accessDisclaimerReevaluationRequestedAt !== next.accessDisclaimerReevaluationRequestedAt
    || prev.disclaimerRequired !== next.disclaimerRequired
  );
}

async function pollFilesIdentityLive({ force = false } = {}) {
  if (filesLiveIdentityPollInFlight) {
    return;
  }
  if (state.view !== "files" || !document.body.classList.contains("is-files")) {
    return;
  }
  if (!force && document.hidden) {
    return;
  }

  filesLiveIdentityPollInFlight = true;
  const previousProfile = normalizeFilesProfile(state.files.me);

  try {
    const payload = await requestJson("/api/me");
    const nextProfile = normalizeFilesProfile(payload);
    if (!hasFilesIdentityChanged(previousProfile, nextProfile)) {
      return;
    }

    state.files.me = nextProfile;
    syncFilesDecisionNoticeFromProfile(nextProfile);
    syncDiscordBotInviteButton();

    if (nextProfile.isAuthorized) {
      const identityChanged = previousProfile.discordId !== nextProfile.discordId;
      const becameAuthorized = !previousProfile.isAuthorized && nextProfile.isAuthorized;
      if (identityChanged || becameAuthorized) {
        await refreshFilesList();
      } else {
        renderFilesAccessView();
      }

      if (nextProfile.isAdmin) {
        await refreshFilesAdminRequests({ silent: true });
      } else {
        clearFilesAdminRequestsState();
        renderFilesAccessView();
      }
      return;
    }

    if (previousProfile.isAuthorized || previousProfile.discordId !== nextProfile.discordId) {
      state.files.list = [];
      state.files.activeGroupKey = "";
      state.files.rename.fileId = "";
      state.files.rename.value = "";
      state.files.rename.busy = false;
      clearFilesGroupManagerState();
      clearFilesGroupRenameState();
      state.files.listError = "";
      state.files.loadingList = false;
      state.files.selectedId = "";
      state.files.detailOrigin = "";
      state.files.transition = "";
      clearFilesAdminRequestsState();
    }
    if (!nextProfile.loggedIn || nextProfile.isAuthorized) {
      state.files.accessRequestBusy = false;
      setFilesRestrictedRequestFeedback("", "");
    }

    renderFilesAccessView();
  } catch {
    // Ignore background polling failures; user-initiated flows keep explicit errors.
  } finally {
    filesLiveIdentityPollInFlight = false;
  }
}

async function refreshFilesList() {
  if (!state.files.me?.isAuthorized) {
    state.files.list = [];
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.listError = "";
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    state.files.transition = "";
    if (!state.files.me?.isAdmin) {
      clearFilesAdminRequestsState();
    }
    renderFilesAccessView();
    return;
  }

  state.files.loadingList = true;
  state.files.listError = "";
  renderFilesAccessView();

  try {
    const payload = await requestJson("/api/files");
    const rawFiles = Array.isArray(payload.files) ? payload.files : [];
    state.files.list = rawFiles
      .map((entry) => normalizeFilesEntry(entry))
      .filter(Boolean);
    if (
      state.files.activeGroupKey
      && !state.files.list.some((entry) => getFilesGroupKey(entry.group) === state.files.activeGroupKey)
    ) {
      state.files.activeGroupKey = "";
      clearFilesGroupManagerState();
      clearFilesGroupRenameState();
    }
    if (
      state.files.rename.fileId
      && !state.files.list.some((entry) => String(entry.id || "") === state.files.rename.fileId)
    ) {
      state.files.rename.fileId = "";
      state.files.rename.value = "";
      state.files.rename.busy = false;
    }
    if (!state.files.list.some((file) => String(file.id || "") === state.files.selectedId)) {
      state.files.selectedId = "";
      state.files.detailOrigin = "";
      state.files.transition = "";
    }
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    state.files.list = [];
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.listError = String(error?.message || t("files_empty_state"));
  } finally {
    state.files.loadingList = false;
  }

  renderFilesAccessView();
}

async function refreshFilesAdminRequests({ silent = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  if (!me.isAuthorized || !me.isAdmin) {
    clearFilesAdminRequestsState();
    renderFilesAccessView();
    return;
  }

  state.files.adminRequests.loading = true;
  state.files.adminRequests.busyActionKey = "";
  if (!silent) {
    renderFilesAccessView();
  }

  try {
    const payload = await requestJson("/api/files/access-requests");
    const rawEntries = Array.isArray(payload?.entries) ? payload.entries : [];
    const parsedEntries = rawEntries
      .map((entry) => normalizeFilesAdminRequestEntry(entry))
      .filter(Boolean);
    state.files.adminRequests.list = parsedEntries;
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    state.files.adminRequests.list = [];
    setFilesAdminRequestsFeedback(String(error?.message || t("files_admin_requests_error_generic")), "error");
  } finally {
    state.files.adminRequests.loading = false;
  }

  renderFilesAccessView();
}

async function refreshFilesBotAdminOverview({ silent = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  if (!me.isAuthorized || !me.isAdmin) {
    clearFilesBotAdminState();
    renderFilesAccessView();
    return;
  }
  if (state.files.botAdmin.loading) {
    return;
  }

  state.files.botAdmin.loading = true;
  if (!silent) {
    renderFilesAccessView();
  }

  try {
    const payload = await requestJson("/api/admin/bot/overview");
    state.files.botAdmin.overview = normalizeFilesBotAdminOverview(payload);
    state.files.botAdmin.lastLoadedAt = Date.now();
    if (state.files.botAdmin.messageKind === "error") {
      setFilesBotAdminFeedback("", "");
    }
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      stopFilesBotAdminLivePolling();
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    state.files.botAdmin.overview = null;
    state.files.botAdmin.selectedGuildId = "";
    state.files.botAdmin.lastLoadedAt = 0;
    setFilesBotAdminFeedback(getFilesBotAdminErrorMessage(error), "error");
  } finally {
    state.files.botAdmin.loading = false;
  }

  renderFilesAccessView();
}

async function refreshFilesIdentity({ loadFiles = true } = {}) {
  state.files.loadingMe = true;
  state.files.meError = "";
  renderFilesAccessView();

  try {
    const payload = await requestJson("/api/me");
    state.files.me = normalizeFilesProfile(payload);
    syncFilesDecisionNoticeFromProfile(state.files.me);
  } catch (error) {
    state.files.me = buildGuestFilesProfile();
    state.files.meError = String(error?.message || "");
    syncFilesDecisionNoticeFromProfile(state.files.me);
  } finally {
    state.files.loadingMe = false;
  }

  syncDiscordBotInviteButton();

  if (state.files.me.isAuthorized && loadFiles) {
    await refreshFilesList();
    if (state.files.me.isAdmin) {
      await refreshFilesAdminRequests({ silent: true });
    } else {
      clearFilesAdminRequestsState();
      clearFilesBotAdminState({ preserveQuery: true });
    }
    return;
  }

  if (!state.files.me.isAuthorized) {
    state.files.list = [];
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.listError = "";
    state.files.loadingList = false;
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    state.files.transition = "";
    clearFilesAdminRequestsState();
    clearFilesBotAdminState({ preserveQuery: true });
  }
  if (state.files.me.isAuthorized && !state.files.me.isAdmin) {
    clearFilesAdminRequestsState();
    clearFilesBotAdminState({ preserveQuery: true });
  }
  if (!state.files.me.loggedIn || state.files.me.isAuthorized) {
    state.files.accessRequestBusy = false;
    setFilesRestrictedRequestFeedback("", "");
  }

  renderFilesAccessView();
}

async function refreshFilesIdentityBadgeOnly() {
  try {
    const payload = await requestJson("/api/me");
    state.files.me = normalizeFilesProfile(payload);
  } catch {
    state.files.me = buildGuestFilesProfile();
  }

  syncFilesDecisionNoticeFromProfile(state.files.me);
  renderFilesDecisionTabBadge();
  syncDiscordBotInviteButton();
  renderFilesBotAdminPanel();
}

async function handleFilesLogout() {
  try {
    await requestJson("/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout transport errors and still clear local state.
  }

  state.files.me = buildGuestFilesProfile();
  state.files.list = [];
  state.files.activeGroupKey = "";
  state.files.rename.fileId = "";
  state.files.rename.value = "";
  state.files.rename.busy = false;
  clearFilesGroupManagerState();
  clearFilesGroupRenameState();
  state.files.listError = "";
  state.files.selectedId = "";
  state.files.detailOrigin = "";
  state.files.transition = "";
  state.files.uploadBusy = false;
  setFilesUploadFeedback("", "");
  state.files.accessRequestBusy = false;
  setFilesRestrictedRequestFeedback("", "");
  stopFilesDisclaimerAcceptTransition({ immediate: true });
  syncDiscordBotInviteButton();
  state.files.disclaimerGate.busy = false;
  state.files.disclaimerGate.pendingDecision = "";
  resetFilesDisclaimerGateContactState({ clearText: true });
  setFilesDisclaimerGateFeedback("", "");
  clearFilesAdminRequestsState();
  clearFilesBotAdminState();
  state.files.adminRequests.query = "";
  state.files.adminRequests.filter = "pending";
  setFilesUploadInputInvalid(false, { isMissingFileError: false });
  state.files.search.query = "";
  state.files.search.open = false;
  state.files.decisionNotice.visible = false;
  state.files.decisionNotice.token = "";
  renderFilesDecisionTabBadge();
  renderFilesAccessView();
  await refreshFilesIdentity({ loadFiles: false });
}

async function handleFilesAccessRequest() {
  if (state.files.accessRequestBusy) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  if (!me.loggedIn) {
    setFilesRestrictedRequestFeedback(t("files_restricted_request_login_required"), "error");
    renderFilesAccessView();
    return;
  }
  if (me.isAuthorized) {
    setFilesRestrictedRequestFeedback(t("files_restricted_request_already_authorized"), "error");
    renderFilesAccessView();
    return;
  }

  const reasonRaw = String(elements.filesRestrictedReasonInput?.value || "");
  const reason = reasonRaw.trim();
  if (!reason) {
    setFilesRestrictedRequestFeedback(t("files_restricted_reason_required"), "error");
    if (elements.filesRestrictedReasonInput) {
      elements.filesRestrictedReasonInput.classList.add("is-invalid");
      elements.filesRestrictedReasonInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (reason.length > FILES_ACCESS_REQUEST_REASON_MAX) {
    setFilesRestrictedRequestFeedback(t("files_restricted_reason_too_long"), "error");
    if (elements.filesRestrictedReasonInput) {
      elements.filesRestrictedReasonInput.classList.add("is-invalid");
      elements.filesRestrictedReasonInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (elements.filesRestrictedReasonInput) {
    elements.filesRestrictedReasonInput.classList.remove("is-invalid");
  }

  state.files.accessRequestBusy = true;
  setFilesRestrictedRequestFeedback("", "");
  renderFilesAccessView();

  try {
    await requestJson("/api/files/access-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason
      })
    });
    state.files.me = {
      ...normalizeFilesProfile(state.files.me),
      accessRequestStatus: "pending",
      accessRequestRequestedAt: new Date().toISOString(),
      accessRequestDecidedAt: "",
      accessRequestReapplyAt: "",
      accessRequestDeclineReason: "",
      accessDisclaimerDecision: "none",
      accessDisclaimerDecidedAt: "",
      accessDisclaimerReevaluationRequestedAt: "",
      disclaimerRequired: false
    };
    syncFilesDecisionNoticeFromProfile(state.files.me);
    if (elements.filesRestrictedReasonInput) {
      elements.filesRestrictedReasonInput.value = "";
      elements.filesRestrictedReasonInput.classList.remove("is-invalid");
    }
    setFilesRestrictedRequestFeedback(t("files_restricted_request_success"), "success");
  } catch (error) {
    let message = t("files_restricted_request_error");
    if (error?.status === 401) {
      message = t("files_restricted_request_login_required");
    } else if (error?.status === 400) {
      const serverMessage = String(error?.message || "").toLowerCase();
      message = serverMessage.includes("required")
        ? t("files_restricted_reason_required")
        : (serverMessage.includes("long") || serverMessage.includes("exceed") || serverMessage.includes("character"))
            ? t("files_restricted_reason_too_long")
            : t("files_restricted_request_error");
      if (elements.filesRestrictedReasonInput) {
        elements.filesRestrictedReasonInput.classList.add("is-invalid");
      }
    } else if (error?.status === 409) {
      message = t("files_restricted_request_already_authorized");
    } else if (error?.status === 429) {
      const serverMessage = String(error?.message || "").toLowerCase();
      message = serverMessage.includes("pending")
        ? t("files_restricted_request_pending_error")
        : (serverMessage.includes("declined") || serverMessage.includes("cooldown"))
            ? t("files_restricted_request_declined_cooldown")
            : t("files_restricted_request_rate_limited");
    } else if (error?.status === 503) {
      message = t("files_restricted_request_unavailable");
    } else if (error?.message) {
      message = String(error.message);
    }
    setFilesRestrictedRequestFeedback(message, "error");
  } finally {
    state.files.accessRequestBusy = false;
    renderFilesAccessView();
  }
}

function setFilesEditFormBusy(formElement, busy) {
  if (!(formElement instanceof HTMLFormElement)) {
    return;
  }

  const isBusy = Boolean(busy);
  const controls = Array.from(formElement.querySelectorAll("input, textarea, button"));
  controls.forEach((control) => {
    if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLButtonElement) {
      control.disabled = isBusy;
    }
  });

  const submitButton = formElement.querySelector("button[type=\"submit\"]");
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.textContent = isBusy ? t("files_edit_save_busy") : t("files_edit_save_button");
  }
}

async function handleFilesMetadataEdit(formElement) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  if (!(formElement instanceof HTMLFormElement)) {
    return;
  }

  const fileId = String(formElement.dataset.fileId || "").trim();
  if (!fileId) {
    return;
  }

  const descriptionInput = formElement.querySelector("textarea[name=\"description\"]");
  const groupInput = formElement.querySelector("input[name=\"group\"]");
  const imageInput = formElement.querySelector("input[name=\"image\"]");
  const removeImageInput = formElement.querySelector("input[name=\"removeImage\"]");

  const description = descriptionInput instanceof HTMLTextAreaElement
    ? String(descriptionInput.value || "").trim()
    : "";
  const group = groupInput instanceof HTMLInputElement
    ? normalizeFilesGroup(groupInput.value)
    : "";
  const imageFile = imageInput instanceof HTMLInputElement && imageInput.files?.length
    ? imageInput.files[0]
    : null;
  const removeImage = removeImageInput instanceof HTMLInputElement && removeImageInput.checked;

  const formData = new FormData();
  formData.append("description", description);
  formData.append("group", group);
  if (imageFile) {
    formData.append("image", imageFile);
  }
  if (removeImage) {
    formData.append("removeImage", "1");
  }

  setFilesEditFormBusy(formElement, true);
  setFilesUploadFeedback("", "");

  try {
    await requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      body: formData
    });
    setFilesUploadFeedback(t("files_edit_success"), "success");
    await refreshFilesList();
  } catch (error) {
    setFilesUploadFeedback(String(error?.message || t("files_upload_error")), "error");
    renderFilesAccessView();
  } finally {
    if (formElement.isConnected) {
      setFilesEditFormBusy(formElement, false);
    }
  }
}

async function handleFilesUpload(event) {
  event.preventDefault();
  if (!state.files.me?.isAdmin) {
    setFilesUploadFeedback(t("files_upload_error"), "error");
    setFilesUploadInputInvalid(false, { isMissingFileError: false });
    renderFilesAccessView();
    return;
  }

  if (!elements.filesUploadInput?.files?.length) {
    setFilesUploadFeedback(t("files_upload_missing_file"), "error");
    setFilesUploadInputInvalid(true, { isMissingFileError: true });
    elements.filesUploadInput?.focus();
    renderFilesAccessView();
    return;
  }

  const selectedFile = elements.filesUploadInput.files[0];
  const selectedImage = elements.filesImageInput?.files?.length ? elements.filesImageInput.files[0] : null;
  const group = normalizeFilesGroup(elements.filesGroupInput?.value || "");
  const description = String(elements.filesDescriptionInput?.value || "").trim();
  const formData = new FormData();
  formData.append("file", selectedFile);
  if (selectedImage) {
    formData.append("image", selectedImage);
  }
  if (group) {
    formData.append("group", group);
  }
  if (description) {
    formData.append("description", description);
  }

  state.files.uploadBusy = true;
  setFilesUploadFeedback("", "");
  setFilesUploadInputInvalid(false, { isMissingFileError: false });
  renderFilesAccessView();

  try {
    await requestJson("/api/files/upload", {
      method: "POST",
      body: formData
    });
    elements.filesUploadForm?.reset();
    state.files.uploadBusy = false;
    setFilesUploadFeedback(t("files_upload_success"), "success");
    setFilesUploadInputInvalid(false, { isMissingFileError: false });
    await refreshFilesList();
  } catch (error) {
    state.files.uploadBusy = false;
    setFilesUploadFeedback(String(error?.message || t("files_upload_error")), "error");
    setFilesUploadInputInvalid(false, { isMissingFileError: false });
    renderFilesAccessView();
  }
}

async function handleFilesAdminRequestsAction(actionElement) {
  const me = normalizeFilesProfile(state.files.me);
  if (!me.isAuthorized || !me.isAdmin) {
    return;
  }
  if (!(actionElement instanceof HTMLElement)) {
    return;
  }
  if (state.files.adminRequests.loading || state.files.adminRequests.busyActionKey) {
    return;
  }

  const action = String(actionElement.dataset.filesAdminAction || "").trim().toLowerCase();
  const requestId = String(actionElement.dataset.requestId || "").trim();
  const discordId = String(actionElement.dataset.discordId || "").trim();
  const actionKey = String(actionElement.dataset.actionKey || requestId || discordId).trim();

  if (action === "deny-open" && requestId) {
    openFilesAdminRequestsDeclineComposer(requestId);
    return;
  }
  if (action === "deny-cancel") {
    closeFilesAdminRequestsDeclineComposer();
    return;
  }

  if (!actionKey) {
    return;
  }

  let requestUrl = "";
  let requestBody = null;
  let successMessage = "";

  if ((action === "approve" || action === "deny-submit") && requestId) {
    let declineReason = "";
    if (action === "deny-submit") {
      declineReason = String(state.files.adminRequests.declineComposerValue || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
      if (declineReason.length > FILES_ACCESS_REQUEST_REASON_MAX) {
        setFilesAdminRequestsFeedback(t("files_admin_requests_action_decline_reason_too_long"), "error");
        renderFilesAccessView();
        return;
      }
    }
    requestUrl = `/api/files/access-requests/${encodeURIComponent(requestId)}/decision`;
    requestBody = {
      action: action === "approve" ? "approve" : "decline"
    };
    if (action === "deny-submit" && declineReason) {
      requestBody.declineReason = declineReason;
    }
    successMessage = action === "approve"
      ? t("files_admin_requests_action_approve_success")
      : t("files_admin_requests_action_deny_success");
  } else if (action === "unauthorize" && discordId) {
    requestUrl = `/api/files/access-requests/${encodeURIComponent(discordId)}/unauthorize`;
    successMessage = t("files_admin_requests_action_unauthorize_success");
  } else if (action === "allow-reapply" && discordId) {
    requestUrl = `/api/files/access-requests/${encodeURIComponent(discordId)}/allow-reapply`;
    successMessage = t("files_admin_requests_action_allow_reapply_success");
  } else {
    return;
  }

  state.files.adminRequests.busyActionKey = actionKey;
  setFilesAdminRequestsFeedback("", "");
  renderFilesAccessView();

  try {
    await requestJson(requestUrl, {
      method: "POST",
      headers: requestBody
        ? {
            "Content-Type": "application/json"
          }
        : undefined,
      body: requestBody ? JSON.stringify(requestBody) : undefined
    });
    if (action === "approve" || action === "deny-submit") {
      state.files.adminRequests.declineComposerRequestId = "";
      state.files.adminRequests.declineComposerValue = "";
    }
    setFilesAdminRequestsFeedback(successMessage, "success");
    await refreshFilesAdminRequests({ silent: true });
  } catch (error) {
    const serverMessage = String(error?.message || "");
    const lowerMessage = serverMessage.toLowerCase();
    let message = t("files_admin_requests_error_generic");
    if (lowerMessage.includes("allowed_discord_ids")) {
      message = t("files_admin_requests_error_allowlist");
    } else if (serverMessage) {
      message = serverMessage;
    }
    setFilesAdminRequestsFeedback(message, "error");
  } finally {
    state.files.adminRequests.busyActionKey = "";
    renderFilesAccessView();
  }
}

function handleFilesAdminRequestsListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const actionTarget = target.closest("[data-files-admin-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }
  void handleFilesAdminRequestsAction(actionTarget);
}

function handleFilesAdminRequestsListInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  if (String(target.getAttribute("data-files-admin-decline-input") || "") !== "true") {
    return;
  }

  const requestId = String(target.getAttribute("data-request-id") || "").trim();
  if (!requestId || state.files.adminRequests.declineComposerRequestId !== requestId) {
    return;
  }
  state.files.adminRequests.declineComposerValue = String(target.value || "");
}

async function executeFilesBotAdminAction({ action = "", guildId = "", guildName = "", actionKey = "" } = {}) {
  let requestUrl = "";
  let successMessage = "";
  if (action === "sync") {
    requestUrl = "/api/admin/bot/commands/sync";
    successMessage = t("files_bot_admin_sync_success");
  } else if (action === "welcome") {
    requestUrl = `/api/admin/bot/guilds/${encodeURIComponent(guildId)}/welcome`;
    successMessage = t("files_bot_admin_welcome_success", { server: guildName });
  } else if (action === "leave") {
    requestUrl = `/api/admin/bot/guilds/${encodeURIComponent(guildId)}/leave`;
    successMessage = t("files_bot_admin_leave_success", { server: guildName });
  } else {
    return;
  }

  state.files.botAdmin.busyActionKey = actionKey;
  if (action === "leave") {
    closeFilesBotAdminLeaveModal({ force: true });
  }
  setFilesBotAdminFeedback("", "");
  renderFilesAccessView();
  renderFilesBotAdminLeaveModal();

  try {
    await requestJson(requestUrl, {
      method: "POST"
    });
    setFilesBotAdminFeedback(successMessage, "success");
    await refreshFilesBotAdminOverview({ silent: true });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      stopFilesBotAdminLivePolling();
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    setFilesBotAdminFeedback(getFilesBotAdminErrorMessage(error), "error");
  } finally {
    state.files.botAdmin.busyActionKey = "";
    renderFilesAccessView();
    renderFilesBotAdminLeaveModal();
  }
}

async function handleFilesBotAdminAction(actionElement) {
  const me = normalizeFilesProfile(state.files.me);
  if (!me.isAuthorized || !me.isAdmin) {
    return;
  }
  if (!(actionElement instanceof HTMLElement)) {
    return;
  }
  if (state.files.botAdmin.loading || state.files.botAdmin.busyActionKey) {
    return;
  }

  const action = String(actionElement.dataset.filesBotAction || "").trim().toLowerCase();
  const guildId = String(actionElement.dataset.guildId || "").trim();
  const guildName = String(actionElement.dataset.guildName || "").trim() || t("files_unknown_value");
  const actionKey = String(actionElement.dataset.actionKey || action).trim();

  if (!actionKey) {
    return;
  }
  if ((action === "welcome" || action === "leave") && !guildId) {
    return;
  }
  if (action === "leave") {
    openFilesBotAdminLeaveModal({
      guildId,
      guildName,
      actionKey
    });
    return;
  }

  await executeFilesBotAdminAction({
    action,
    guildId,
    guildName,
    actionKey
  });
}

function handleFilesBotAdminServerListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const actionTarget = target.closest("[data-files-bot-action]");
  if (actionTarget instanceof HTMLElement) {
    void handleFilesBotAdminAction(actionTarget);
    return;
  }
  const selectTarget = target.closest("[data-files-bot-select]");
  if (!(selectTarget instanceof HTMLElement)) {
    return;
  }
  const guildId = String(selectTarget.dataset.guildId || "").trim();
  if (!guildId) {
    return;
  }
  const nextGuildId = state.files.botAdmin.selectedGuildId === guildId ? "" : guildId;
  setFilesBotAdminSelectedGuildId(nextGuildId, {
    scrollIntoView: Boolean(nextGuildId)
  });
}

async function handleFilesDelete(fileId) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  openFilesDeleteModal(fileId);
}

function startFilesRename(fileId) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  const matchedFile = state.files.list.find((entry) => String(entry.id || "") === String(fileId || ""));
  if (!matchedFile) {
    return;
  }

  state.files.rename.fileId = String(fileId);
  state.files.rename.value = getFilesDisplayName(matchedFile);
  state.files.rename.busy = false;
  renderFilesList();
}

function cancelFilesRename({ render = true } = {}) {
  state.files.rename.fileId = "";
  state.files.rename.value = "";
  state.files.rename.busy = false;
  if (render) {
    renderFilesList();
  }
}

async function handleFilesRenameSubmit(formElement) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  if (!(formElement instanceof HTMLFormElement)) {
    return;
  }

  const fileId = String(formElement.dataset.fileId || "").trim();
  if (!fileId || state.files.rename.busy) {
    return;
  }

  const nameInput = formElement.querySelector("input[name=\"displayName\"]");
  const displayName = nameInput instanceof HTMLInputElement
    ? String(nameInput.value || "")
      .replace(/\r\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    : "";

  state.files.rename.busy = true;
  state.files.rename.value = displayName;
  renderFilesList();

  try {
    const formData = new FormData();
    formData.append("displayName", displayName);
    await requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      body: formData
    });
    setFilesUploadFeedback(t("files_rename_success"), "success");
    cancelFilesRename({ render: false });
    await refreshFilesList();
  } catch (error) {
    state.files.rename.busy = false;
    setFilesUploadFeedback(String(error?.message || t("files_upload_error")), "error");
    renderFilesAccessView();
  }
}

async function handleFilesRenameGroupSubmit() {
  if (!state.files.me?.isAdmin || state.files.groupRename.busy || !state.files.groupRename.open) {
    return;
  }

  const targetGroupKey = String(state.files.groupRename.key || "").trim();
  if (!targetGroupKey || targetGroupKey === "__ungrouped__") {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  const filesInGroup = getFilesGroupEntriesByKey(targetGroupKey);
  if (!filesInGroup.length) {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  const currentGroup = normalizeFilesGroup(filesInGroup[0]?.group || "") || normalizeFilesGroup(state.files.groupRename.label || "");
  if (!currentGroup) {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  const nextValueRaw = elements.filesGroupRenameInput instanceof HTMLInputElement
    ? String(elements.filesGroupRenameInput.value || "")
    : String(state.files.groupRename.value || "");
  state.files.groupRename.value = nextValueRaw;
  const nextGroup = normalizeFilesGroup(nextValueRaw);
  if (!nextGroup) {
    setFilesGroupRenameFeedback(t("files_group_rename_error_required"), "error");
    if (elements.filesGroupRenameInput instanceof HTMLInputElement) {
      elements.filesGroupRenameInput.focus();
      elements.filesGroupRenameInput.select();
    }
    renderFilesGroupRenameModal();
    return;
  }

  if (normalizeSearchText(nextGroup) === normalizeSearchText(currentGroup)) {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  state.files.groupRename.busy = true;
  setFilesGroupRenameFeedback("", "");
  renderFilesGroupRenameModal();

  let renamed = false;
  try {
    await Promise.all(filesInGroup.map((file) => {
      const fileId = String(file?.id || "").trim();
      if (!fileId) {
        return Promise.resolve();
      }

      const formData = new FormData();
      formData.append("group", nextGroup);
      return requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
        method: "PATCH",
        body: formData
      });
    }));
    state.files.list = (Array.isArray(state.files.list) ? state.files.list : []).map((file) => {
      if (getFilesGroupKey(file?.group || "") !== targetGroupKey) {
        return file;
      }
      return {
        ...file,
        group: nextGroup
      };
    });
    state.files.activeGroupKey = getFilesGroupKey(nextGroup);
    state.files.groupTransition = "";
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    setFilesUploadFeedback(t("files_group_rename_success", { group: nextGroup }), "success");
    renamed = true;
  } catch (error) {
    setFilesGroupRenameFeedback(String(error?.message || t("files_group_manager_error_update")), "error");
  } finally {
    state.files.groupRename.busy = false;
  }

  if (renamed) {
    closeFilesGroupRenameModal({ force: true });
    state.files.transition = "to-list";
    renderFilesAccessView();
    scheduleFilesListPostMutationRefresh();
    await refreshFilesList();
    state.files.transition = "to-list";
    renderFilesAccessView();
    scheduleFilesListPostMutationRefresh();
    return;
  }

  renderFilesGroupRenameModal();
}

async function handleFilesAssignSelectedGroup() {
  if (!state.files.me?.isAdmin || state.files.groupManager.busy) {
    return;
  }

  const selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!selectedIds.length) {
    setFilesUploadFeedback(t("files_group_manager_error_select_files"), "error");
    renderFilesAccessView();
    return;
  }

  const groupInput = elements.filesGroupManagerWrap?.querySelector("[data-files-group-input]")
    || elements.filesList?.querySelector("[data-files-group-input]");
  const rawGroupName = groupInput instanceof HTMLInputElement
    ? String(groupInput.value || "")
    : String(state.files.groupManager.targetGroup || "");
  const nextGroup = normalizeFilesGroup(rawGroupName);
  state.files.groupManager.targetGroup = nextGroup || rawGroupName;

  if (!nextGroup) {
    setFilesUploadFeedback(t("files_group_manager_error_group_required"), "error");
    renderFilesAccessView();
    return;
  }

  state.files.groupManager.busy = true;
  setFilesUploadFeedback("", "");
  renderFilesList();

  let updated = false;
  try {
    await Promise.all(selectedIds.map((fileId) => {
      const formData = new FormData();
      formData.append("group", nextGroup);
      return requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
        method: "PATCH",
        body: formData
      });
    }));

    clearFilesGroupManagerState({ clearTargetGroup: false });
    state.files.groupManager.targetGroup = nextGroup;
    if (state.files.groupManager.open) {
      state.files.activeGroupKey = "";
      state.files.groupTransition = "";
    } else {
      state.files.activeGroupKey = getFilesGroupKey(nextGroup);
      state.files.groupTransition = "open";
    }
    setFilesUploadFeedback(
      t("files_group_manager_success", { n: String(selectedIds.length), group: nextGroup }),
      "success"
    );
    updated = true;
  } catch (error) {
    setFilesUploadFeedback(String(error?.message || t("files_group_manager_error_update")), "error");
  } finally {
    state.files.groupManager.busy = false;
  }

  if (updated) {
    await refreshFilesList();
    return;
  }
  renderFilesAccessView();
}

async function handleFilesRemoveSelectedFromGroup() {
  if (!state.files.me?.isAdmin || state.files.groupManager.busy) {
    return;
  }

  const selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!selectedIds.length) {
    setFilesUploadFeedback(t("files_group_manager_error_select_files"), "error");
    renderFilesAccessView();
    return;
  }

  state.files.groupManager.busy = true;
  setFilesUploadFeedback("", "");
  renderFilesList();

  let updated = false;
  try {
    await Promise.all(selectedIds.map((fileId) => {
      const formData = new FormData();
      formData.append("group", "");
      return requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
        method: "PATCH",
        body: formData
      });
    }));

    clearFilesGroupManagerState({ clearTargetGroup: false });
    state.files.activeGroupKey = "";
    state.files.groupTransition = "";
    setFilesUploadFeedback(
      t("files_group_manager_remove_success", { n: String(selectedIds.length) }),
      "success"
    );
    updated = true;
  } catch (error) {
    setFilesUploadFeedback(String(error?.message || t("files_group_manager_error_update")), "error");
  } finally {
    state.files.groupManager.busy = false;
  }

  if (updated) {
    await refreshFilesList();
    return;
  }
  renderFilesAccessView();
}

function handleFilesListInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.id) {
    const dropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-target]"));
    const linkedDropdown = dropdowns.find((node) => {
      if (!(node instanceof HTMLElement)) {
        return false;
      }
      return String(node.getAttribute("data-files-group-suggest-target") || "") === target.id;
    });
    if (linkedDropdown instanceof HTMLElement) {
      syncFilesGroupSuggestDropdown(linkedDropdown, target.value || "");
    }
  }

  if (!target.matches("[data-files-group-input]")) {
    return;
  }
  state.files.groupManager.targetGroup = String(target.value || "").slice(0, 80);
  syncFilesGroupSuggestions();
  renderFilesList();
}

function handleFilesListChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (!(target instanceof HTMLInputElement) || !target.matches("[data-files-group-select]")) {
    return;
  }

  const fileId = String(target.getAttribute("data-file-id") || "").trim();
  if (!fileId) {
    return;
  }

  const selected = new Set(state.files.groupManager.selectedIds.map((value) => String(value || "").trim()).filter(Boolean));
  if (target.checked) {
    selected.add(fileId);
  } else {
    selected.delete(fileId);
  }
  state.files.groupManager.selectedIds = Array.from(selected);
  renderFilesList();
  renderFilesGroupManagerPanel();
}

function handleFilesListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const actionTarget = target.closest("[data-files-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }

  const action = actionTarget.getAttribute("data-files-action") || "";
  if (action === "toggle-group-suggest-menu") {
    const dropdown = actionTarget.closest("[data-files-group-suggest-dropdown]");
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }
    const shouldOpen = !dropdown.classList.contains("is-open");
    closeAllFilesGroupSuggestMenus({ except: shouldOpen ? dropdown : null });
    setFilesGroupSuggestMenuOpen(dropdown, shouldOpen);
    return;
  }

  if (action === "select-group-suggest-option") {
    const dropdown = actionTarget.closest("[data-files-group-suggest-dropdown]");
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }
    const nextValue = normalizeFilesGroup(actionTarget.getAttribute("data-group-value") || "");
    const linkedInput = getFilesGroupSuggestTargetInput(dropdown);
    if (linkedInput instanceof HTMLInputElement) {
      linkedInput.value = nextValue;
      if (linkedInput.id === "filesGroupManagerInput" || linkedInput.matches("[data-files-group-input]")) {
        state.files.groupManager.targetGroup = nextValue;
        renderFilesList();
        renderFilesGroupManagerPanel();
      } else {
        linkedInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    syncFilesGroupSuggestDropdown(dropdown, nextValue);
    setFilesGroupSuggestMenuOpen(dropdown, false);
    return;
  }

  if (action === "assign-selected-group") {
    void handleFilesAssignSelectedGroup();
    return;
  }
  if (action === "remove-selected-group") {
    void handleFilesRemoveSelectedFromGroup();
    return;
  }
  if (action === "select-all-group-files") {
    if (state.files.groupManager.busy) {
      return;
    }
    state.files.groupManager.selectedIds = getFilesGroupManagerVisibleFileIds();
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }
  if (action === "clear-group-files-selection") {
    if (state.files.groupManager.busy) {
      return;
    }
    state.files.groupManager.selectedIds = [];
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }

  if (action === "select-group") {
    const groupKey = String(actionTarget.getAttribute("data-group-key") || "").trim();
    if (!groupKey) {
      return;
    }
    if (state.files.activeGroupKey === groupKey) {
      return;
    }
    state.files.activeGroupKey = groupKey;
    clearFilesGroupManagerState();
    const groupItemCount = getFilesGroupItemCount(groupKey);
    state.files.groupTransition = groupItemCount > 1 ? "open" : "";
    cancelFilesRename({ render: false });
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }
  if (action === "clear-group-filter") {
    state.files.activeGroupKey = "";
    clearFilesGroupManagerState();
    state.files.groupTransition = "close";
    cancelFilesRename({ render: false });
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }
  if (action === "rename-group") {
    const renameGroupKey = String(actionTarget.getAttribute("data-group-key") || "").trim();
    const renameGroupLabel = String(actionTarget.getAttribute("data-group-label") || "").trim();
    if (!renameGroupKey) {
      return;
    }
    openFilesGroupRenameModal(renameGroupKey, renameGroupLabel);
    return;
  }

  if (action === "back-to-index") {
    const returnToSearch = state.files.detailOrigin === "search" && String(state.files.search.query || "").trim();
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    if (returnToSearch) {
      state.files.transition = "";
      setFilesSearchOpen(true, { clearQuery: false });
    } else {
      state.files.transition = "to-list";
      renderFilesList();
    }
    return;
  }

  if (action === "start-rename") {
    const renameFileId = actionTarget.getAttribute("data-file-id") || "";
    if (!renameFileId) {
      return;
    }
    startFilesRename(renameFileId);
    return;
  }

  if (action === "cancel-rename") {
    cancelFilesRename();
    return;
  }

  const fileId = actionTarget.getAttribute("data-file-id") || "";
  if (!fileId) {
    return;
  }

  if (action === "open-detail-search") {
    cancelFilesRename({ render: false });
    state.files.selectedId = fileId;
    state.files.detailOrigin = "search";
    state.files.transition = "to-detail";
    setFilesSearchOpen(false, { clearQuery: false });
    elements.filesList?.scrollTo({ top: 0 });
    return;
  }

  if (action === "open-detail") {
    cancelFilesRename({ render: false });
    state.files.selectedId = fileId;
    state.files.detailOrigin = "list";
    state.files.transition = "to-detail";
    renderFilesList();
    elements.filesList?.scrollTo({ top: 0 });
    return;
  }

  if (action === "download") {
    window.location.href = `/api/files/${encodeURIComponent(fileId)}/download`;
    return;
  }

  if (action === "delete") {
    void handleFilesDelete(fileId);
  }
}

function handleFilesListKeydown(event) {
  const key = String(event.key || "");
  if (key !== "Enter" && key !== " ") {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const actionTarget = target.closest("[data-files-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }

  const action = String(actionTarget.getAttribute("data-files-action") || "").trim();
  if (action !== "open-detail") {
    return;
  }

  if (actionTarget.tagName === "BUTTON") {
    return;
  }

  event.preventDefault();
  actionTarget.click();
}

function handleFilesListSubmit(event) {
  const target = event.target;
  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  if (target.matches("[data-files-edit-form]")) {
    event.preventDefault();
    void handleFilesMetadataEdit(target);
    return;
  }

  if (target.matches("[data-files-rename-form]")) {
    event.preventDefault();
    void handleFilesRenameSubmit(target);
  }
}

function queueImagePreload(url, { highPriority = false } = {}) {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) {
    return Promise.resolve(false);
  }

  const cached = minervaImagePreloadCache.get(normalizedUrl);
  if (cached) {
    return cached;
  }

  const preloadPromise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    if ("loading" in image) {
      image.loading = "eager";
    }
    if (highPriority && "fetchPriority" in image) {
      image.fetchPriority = "high";
    }

    let settled = false;
    const finalize = (ok) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(ok);
    };

    image.addEventListener("load", () => finalize(true), { once: true });
    image.addEventListener("error", () => finalize(false), { once: true });
    image.src = normalizedUrl;

    if (image.complete) {
      finalize(true);
    }
  });

  minervaImagePreloadCache.set(normalizedUrl, preloadPromise);
  return preloadPromise;
}

function prewarmStaticSiteImages() {
  const uniqueUrls = [...new Set(
    STATIC_SITE_IMAGE_PRELOAD_URLS
      .map((url) => String(url || "").trim())
      .filter(Boolean)
  )];

  uniqueUrls.forEach((url, index) => {
    void queueImagePreload(url, { highPriority: index < 4 });
  });
}

function prewarmMinervaDetailImages(byKey = state.minervaDetail.fallbackByKey) {
  const urls = new Set();
  const fallbackImageUrl = String(state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE).trim();
  if (fallbackImageUrl) {
    urls.add(fallbackImageUrl);
  }

  if (byKey && typeof byKey === "object") {
    for (const entry of Object.values(byKey)) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const imageUrl = String(entry.imageUrl || "").trim();
      if (imageUrl) {
        urls.add(imageUrl);
      }
      if (urls.size >= MINERVA_DETAIL_IMAGE_PRELOAD_LIMIT) {
        break;
      }
    }
  }

  const preloadUrls = [...urls];
  preloadUrls.forEach((url, index) => {
    void queueImagePreload(url, { highPriority: index === 0 });
  });
}

function proxied(url) {
  return `${PROXY_BASE}${encodeURIComponent(url)}`;
}

function detectInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_LANG_KEY);
  if (stored === "en" || stored === "es") {
    return stored;
  }

  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

function ensureAudioContext() {
  if (state.audio.context) {
    return state.audio.context;
  }

  const ContextClass = window.AudioContext || window.webkitAudioContext;
  if (!ContextClass) {
    return null;
  }

  try {
    state.audio.context = new ContextClass();
  } catch (error) {
    state.audio.context = null;
  }

  return state.audio.context;
}

function primeAudioContext() {
  const context = ensureAudioContext();
  if (!context || context.state !== "suspended") {
    return;
  }

  context.resume().catch(() => {});
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (target instanceof HTMLTextAreaElement) {
    return !target.disabled && !target.readOnly;
  }

  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) {
      return false;
    }
    const type = String(target.type || "text").toLowerCase();
    return [
      "text",
      "search",
      "url",
      "email",
      "tel",
      "password",
      "number"
    ].includes(type);
  }

  return false;
}

function playTypeTickSound() {
  const nowMs = performance.now();
  if (nowMs - state.audio.lastTypeSoundAt < TYPE_SOUND_MIN_INTERVAL_MS) {
    return;
  }
  state.audio.lastTypeSoundAt = nowMs;

  const context = ensureAudioContext();
  if (!context || context.state !== "running") {
    return;
  }

  const startAt = context.currentTime + 0.001;
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const freqJitter = (Math.random() * 60) - 30;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(TYPE_SOUND_BASE_FREQ + freqJitter, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(220, TYPE_SOUND_BASE_FREQ - 120 + freqJitter),
    startAt + TYPE_SOUND_DURATION_SEC
  );

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1900, startAt);
  filter.Q.setValueAtTime(0.8, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(TYPE_SOUND_GAIN, startAt + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + TYPE_SOUND_DURATION_SEC);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + TYPE_SOUND_DURATION_SEC + 0.003);
}

function formatReadableDateTime(
  date,
  {
    includeSeconds = false,
    timeZone = "UTC",
    includeWeekday = true,
    includeYear = true,
    zoneLabel = "",
    hour12 = false
  } = {}
) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const dateOptions = {
    day: "2-digit",
    month: "short",
    timeZone
  };

  if (includeWeekday) {
    dateOptions.weekday = "short";
  }
  if (includeYear) {
    dateOptions.year = "numeric";
  }

  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
    timeZone
  };

  if (includeSeconds) {
    timeOptions.second = "2-digit";
  }

  const datePart = new Intl.DateTimeFormat(locale, dateOptions).format(date).replace(/,/g, "");
  const timePart = normalizeMeridiemText(
    new Intl.DateTimeFormat(locale, timeOptions).format(date)
  );
  const zonePart = zoneLabel ? ` ${zoneLabel}` : "";
  return `${datePart} ${timePart}${zonePart}`;
}

function normalizeMeridiemText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([ap])\s*\.\s*m\s*\./gi, (_match, token) => `${token.toLowerCase()}m`)
    .replace(/\b([AP])M\b/g, (_match, token) => `${token.toLowerCase()}m`);
}

function extractTimeZoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const byType = Object.create(null);

  for (const part of parts) {
    if (part.type !== "literal") {
      byType[part.type] = part.value;
    }
  }

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second || "0")
  };
}

function buildEasternDate(year, month, day, hour, minute) {
  const timeZone = "America/New_York";
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let index = 0; index < 4; index += 1) {
    const actual = extractTimeZoneParts(new Date(utcMs), timeZone);
    const targetMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const actualMs = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    const diff = targetMs - actualMs;
    if (!diff) {
      return new Date(utcMs);
    }
    utcMs += diff;
  }

  return new Date(utcMs);
}

function parseBethesdaRawDateTime(raw) {
  const match = String(raw || "").match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const meridiem = match[6].toUpperCase();

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }
  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return buildEasternDate(year, month, day, hour, minute);
}

function formatBethesdaRawDateTime(raw) {
  const parsed = parseBethesdaRawDateTime(raw);
  if (!parsed) {
    return raw || "--";
  }
  return formatEtDisplay(parsed);
}

function formatUtc(now = new Date()) {
  return formatReadableDateTime(now, {
    includeSeconds: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    includeWeekday: true,
    includeYear: false,
    zoneLabel: getLocalZoneLabel(now),
    hour12: true
  });
}

function getLocalZoneLabel(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value || "";
}

function formatLastSync(now = new Date()) {
  return formatReadableDateTime(now, {
    includeSeconds: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    includeWeekday: true,
    includeYear: false,
    zoneLabel: getLocalZoneLabel(now),
    hour12: true
  });
}

function formatStamp(date) {
  return formatEtDisplay(date);
}

function formatEtDisplay(date, { includeWeekday = true, includeYear = true } = {}) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const dateOptions = {
    month: "short",
    day: "2-digit",
    timeZone: "America/New_York"
  };
  if (includeWeekday) {
    dateOptions.weekday = "short";
  }
  if (includeYear) {
    dateOptions.year = "numeric";
  }

  const timeOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: state.lang !== "es",
    timeZone: "America/New_York"
  };

  const datePart = new Intl.DateTimeFormat(locale, dateOptions).format(date).replace(/,/g, "");
  const timePart = normalizeMeridiemText(new Intl.DateTimeFormat(locale, timeOptions).format(date));
  return `${datePart} | ${timePart} ET`;
}

function formatEtCompact(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const formatWeekdayToken = (rawWeekday) => {
    const cleaned = String(rawWeekday || "").replace(/\./g, "").trim();
    if (!cleaned) {
      return "";
    }

    if (state.lang === "es") {
      const normalized = cleaned
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const key = normalized.slice(0, 3);
      const esMap = {
        lun: "LUN",
        mar: "MAR",
        mie: "MIER",
        jue: "JUE",
        vie: "VIE",
        sab: "SAB",
        dom: "DOM"
      };
      return esMap[key] || cleaned.toUpperCase();
    }

    return cleaned.toUpperCase();
  };

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const dateParts = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    timeZone: "America/New_York"
  }).formatToParts(date);
  const weekdayRaw = dateParts
    .find((part) => part.type === "weekday")
    ?.value
    ?.trim() || "";
  const weekdayPart = formatWeekdayToken(weekdayRaw);
  const dayPart = dateParts.find((part) => part.type === "day")?.value || "";
  let timePart = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York"
  }).format(date).replace(/\s+/g, " ").trim();
  timePart = normalizeMeridiemText(timePart);

  return `${weekdayPart} ${dayPart} ${timePart}`.trim();
}

function formatMinervaWindowStatus(data) {
  if (!data || typeof data !== "object") {
    return t("window_unknown");
  }

  const isActive = Boolean(data.active);
  const shortLabelKey = isActive ? "window_leaves_short" : "window_arrives_short";
  const toCardLine = (timeText) => `${t(shortLabelKey)}\n${timeText}`;

  if (data.nextChange) {
    const parsed = parseBethesdaRawDateTime(data.nextChange);
    const timeValue = parsed ? formatEtCompact(parsed) : String(data.nextChange || "--");
    return toCardLine(timeValue);
  }

  const targetDate = isActive ? data.eventEnd : data.eventStart;
  if (targetDate instanceof Date && !Number.isNaN(targetDate.getTime())) {
    return toCardLine(formatEtCompact(targetDate));
  }

  return t("window_unknown");
}

function formatMinervaCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (state.lang === "es") {
    return `${days} ${days === 1 ? "dia" : "dias"} ${hours} horas ${minutes} min ${seconds} seg`;
  }
  return `${days} ${days === 1 ? "day" : "days"} ${hours} hours ${minutes} min ${seconds} sec`;
}

function formatMinervaLocationDate(date, mode = "") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function asValidDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  return null;
}

function resolveMinervaWindowDates(data) {
  const nextChangeDate = data?.nextChange ? parseBethesdaRawDateTime(data.nextChange) : null;
  const active = Boolean(data?.active);
  const eventStart = asValidDate(data?.eventStart) || (!active ? nextChangeDate : null);
  const eventEnd = asValidDate(data?.eventEnd) || (active ? nextChangeDate : null);
  return { eventStart, eventEnd };
}

function setMinervaLocationCountdownTarget(targetDate, mode = "") {
  const validTarget = asValidDate(targetDate);
  state.minervaLocation.countdownTargetMs = validTarget ? validTarget.getTime() : null;
  state.minervaLocation.countdownMode = mode === "leaves" ? "leaves" : "arrives";
  updateMinervaLocationCountdown();
}

function updateMinervaLocationCountdown(nowMs = Date.now()) {
  if (!elements.minervaLocationCountdown || !elements.minervaLocationCountdownLabel || !state.minervaLocation.open) {
    return;
  }

  const labelKey = state.minervaLocation.countdownMode === "leaves"
    ? "minerva_location_countdown_leaves"
    : "minerva_location_countdown_arrives";
  elements.minervaLocationCountdownLabel.textContent = t(labelKey);

  if (!Number.isFinite(state.minervaLocation.countdownTargetMs)) {
    elements.minervaLocationCountdown.textContent = "--";
    return;
  }

  const remainingMs = state.minervaLocation.countdownTargetMs - nowMs;
  if (remainingMs <= 0) {
    elements.minervaLocationCountdown.textContent = t("minerva_location_countdown_now");
    return;
  }

  elements.minervaLocationCountdown.textContent = formatMinervaCountdown(remainingMs);
}

function syncMinervaLocationMapPins(location) {
  const normalizedTarget = normalizeLocation(location);
  if (!Array.isArray(elements.minervaLocationPins)) {
    return;
  }

  elements.minervaLocationPins.forEach((pin) => {
    const isTarget = normalizeLocation(pin.dataset.location || "") === normalizedTarget && normalizedTarget !== "--";
    pin.classList.toggle("is-target", isTarget);
    pin.setAttribute("aria-current", isTarget ? "true" : "false");
    pin.hidden = !isTarget;
    pin.setAttribute("aria-hidden", isTarget ? "false" : "true");
  });
}

function resolveMinervaLocationSlides(data) {
  const defaultMapImage = "assets/images/minerva-route-map.svg";
  if (!data) {
    return [{
      key: "route-default",
      src: defaultMapImage,
      alt: "Appalachia route map",
      showPins: true
    }];
  }

  const location = normalizeLocation(data.location || "--");
  const locationByMapImage = inferLocationFromMapImage(data.locationMapImage || "");
  const mapLocation = location !== "--" ? location : locationByMapImage;
  const localizedMapLocation = localizeLocation(mapLocation);
  const mapImageSrc = String(data.locationMapImage || "").trim();
  const primarySrc = mapImageSrc || defaultMapImage;
  const slides = [{
    key: mapImageSrc ? "route-known" : "route-default",
    src: primarySrc,
    alt: mapImageSrc
      ? `${localizedMapLocation === "--" ? "Appalachia" : localizedMapLocation} map marker`
      : "Appalachia route map",
    showPins: !mapImageSrc
  }];

  const storeSrc = String(MINERVA_STORE_IMAGE_BY_LOCATION[mapLocation] || "").trim();
  if (storeSrc && storeSrc !== primarySrc) {
    slides.push({
      key: "store",
      src: storeSrc,
      alt: `${localizedMapLocation === "--" ? "Minerva" : localizedMapLocation} store location`,
      showPins: false
    });
  }

  return slides;
}

function syncMinervaLocationSlides(data) {
  const slides = resolveMinervaLocationSlides(data);
  const nextKey = slides.map((slide) => `${slide.key}:${slide.src}`).join("|");
  if (state.minervaLocation.slideKey !== nextKey) {
    state.minervaLocation.slides = slides;
    state.minervaLocation.slideKey = nextKey;
    state.minervaLocation.slideIndex = 0;
  } else {
    state.minervaLocation.slides = slides;
    state.minervaLocation.slideIndex = Math.min(
      state.minervaLocation.slideIndex,
      Math.max(0, slides.length - 1)
    );
  }
}

function renderMinervaLocationSlide(data, activeLocation) {
  if (!elements.minervaLocationMapImage) {
    return;
  }

  syncMinervaLocationSlides(data);
  const slides = state.minervaLocation.slides;
  const activeSlide = slides[state.minervaLocation.slideIndex] || slides[0] || null;
  const hasMultipleSlides = slides.length > 1;

  if (elements.minervaLocationMapPrevBtn) {
    elements.minervaLocationMapPrevBtn.hidden = !hasMultipleSlides;
  }
  if (elements.minervaLocationMapNextBtn) {
    elements.minervaLocationMapNextBtn.hidden = !hasMultipleSlides;
  }

  if (!activeSlide) {
    return;
  }

  const currentSrc = elements.minervaLocationMapImage.dataset.slideSrc
    || elements.minervaLocationMapImage.getAttribute("src")
    || "";
  if (currentSrc !== activeSlide.src) {
    const token = ++state.minervaLocation.transitionToken;
    const preload = new Image();
    elements.minervaLocationMapImage.classList.add("is-switching");
    preload.onload = () => {
      if (token !== state.minervaLocation.transitionToken) {
        return;
      }
      window.setTimeout(() => {
        if (token !== state.minervaLocation.transitionToken) {
          return;
        }
        elements.minervaLocationMapImage.src = activeSlide.src;
        elements.minervaLocationMapImage.alt = activeSlide.alt;
        elements.minervaLocationMapImage.dataset.slideSrc = activeSlide.src;
        requestAnimationFrame(() => {
          elements.minervaLocationMapImage.classList.remove("is-switching");
        });
      }, 120);
    };
    preload.onerror = () => {
      if (token !== state.minervaLocation.transitionToken) {
        return;
      }
      elements.minervaLocationMapImage.classList.remove("is-switching");
    };
    preload.src = activeSlide.src;
  } else {
    elements.minervaLocationMapImage.alt = activeSlide.alt;
    elements.minervaLocationMapImage.dataset.slideSrc = activeSlide.src;
    elements.minervaLocationMapImage.classList.remove("is-switching");
  }

  if (elements.minervaLocationPinsWrap) {
    elements.minervaLocationPinsWrap.hidden = !activeSlide.showPins;
  }
  if (activeSlide.showPins) {
    syncMinervaLocationMapPins(activeLocation);
  }
}

function cycleMinervaLocationSlide(direction) {
  const slides = state.minervaLocation.slides;
  if (!Array.isArray(slides) || slides.length < 2) {
    return;
  }

  state.minervaLocation.slideIndex = (
    state.minervaLocation.slideIndex + direction + slides.length
  ) % slides.length;
  renderMinervaLocationView();
}

function renderMinervaLocationView() {
  if (
    !state.minervaLocation.open
    || !elements.minervaLocationView
    || !elements.minervaLocationStatus
    || !elements.minervaLocationArrives
    || !elements.minervaLocationLeaves
  ) {
    return;
  }

  const data = state.minerva.data;
  if (!data) {
    elements.minervaLocationStatus.textContent = t("minerva_location_status_unknown");
    elements.minervaLocationArrives.textContent = "--";
    elements.minervaLocationLeaves.textContent = "--";
    if (elements.minervaLocationMapName) {
      elements.minervaLocationMapName.textContent = "--";
      elements.minervaLocationMapName.hidden = true;
    }
    renderMinervaLocationSlide(null, "--");
    setMinervaLocationCountdownTarget(null, "arrives");
    return;
  }

  const location = normalizeLocation(data.location || "--");
  const locationByMapImage = inferLocationFromMapImage(data.locationMapImage || "");
  const mapLocation = location !== "--" ? location : locationByMapImage;
  const localizedLocation = localizeLocation(location);
  const localizedMapLocation = localizeLocation(mapLocation);
  if (elements.minervaLocationMapName) {
    elements.minervaLocationMapName.textContent = localizedMapLocation === "--"
      ? t("minerva_location_map_label")
      : localizedMapLocation;
    elements.minervaLocationMapName.hidden = false;
  }
  const statusLocation = localizedLocation === "--" ? localizedMapLocation : localizedLocation;
  if (statusLocation === "--") {
    elements.minervaLocationStatus.textContent = t("minerva_location_status_unknown");
  } else {
    elements.minervaLocationStatus.textContent = data.active
      ? t("minerva_location_status_active", { location: statusLocation })
      : t("minerva_location_status_inactive", { location: statusLocation });
  }

  const { eventStart, eventEnd } = resolveMinervaWindowDates(data);
  elements.minervaLocationArrives.textContent = eventStart
    ? formatMinervaLocationDate(eventStart, data.mode)
    : "--";
  elements.minervaLocationLeaves.textContent = eventEnd
    ? formatMinervaLocationDate(eventEnd, data.mode)
    : "--";
  renderMinervaLocationSlide(data, location);
  setMinervaLocationCountdownTarget(data.active ? eventEnd : eventStart, data.active ? "leaves" : "arrives");
}

function nextResetUtc(now = new Date()) {
  const reset = new Date(now);
  const daysUntilReset = ((SILO_RESET_DAY_UTC + 7 - now.getUTCDay()) % 7) || 7;
  reset.setUTCDate(now.getUTCDate() + daysUntilReset);
  reset.setUTCHours(0, 0, 0, 0);
  if (reset <= now) {
    reset.setUTCDate(reset.getUTCDate() + 7);
  }
  return reset;
}

function updateClock() {
  elements.utcTime.textContent = formatUtc();

  const nowMs = Date.now();
  const targetUtc = getActiveSiloResetTargetMs(nowMs);

  const totalSeconds = Math.max(0, Math.floor((targetUtc - nowMs) / 1000));
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ts = formatReadableDateTime(new Date(targetUtc), {
    includeSeconds: false,
    timeZone: "UTC",
    includeWeekday: true,
    includeYear: false,
    zoneLabel: "UTC"
  });

  elements.siloExpiry.textContent = t("reset_in", { d, h, m, s, ts });
  if (state.siloDossier.open) {
    renderSiloDossier();
  }
  updateMinervaLocationCountdown(nowMs);
  updateFilesDeniedCountdown(nowMs);
}

function setSignal(key) {
  state.signalKey = key;
  elements.dataSignal.textContent = t(`signal_${key}`);
  if (state.siloDossier.open) {
    renderSiloDossier();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setupBackgroundParallax() {
  const root = document.documentElement;
  if (!root) {
    return;
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (prefersReducedMotion) {
    root.style.setProperty("--map-parallax-x", "0px");
    root.style.setProperty("--map-parallax-y", "0px");
    return;
  }

  let pointerX = 0;
  let pointerY = 0;
  let scrollAmount = 0;
  let rafId = 0;

  const apply = () => {
    rafId = 0;
    const x = pointerX * 10.5;
    const y = pointerY * 7.5 - scrollAmount * 0.015;
    root.style.setProperty("--map-parallax-x", `${x.toFixed(2)}px`);
    root.style.setProperty("--map-parallax-y", `${y.toFixed(2)}px`);
  };

  const schedule = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(apply);
    }
  };

  const handlePointerMove = (event) => {
    const width = Math.max(1, window.innerWidth || 1);
    const height = Math.max(1, window.innerHeight || 1);
    pointerX = (event.clientX / width - 0.5) * 2;
    pointerY = (event.clientY / height - 0.5) * 2;
    schedule();
  };

  const handleScroll = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    scrollAmount = Math.max(-220, Math.min(220, y));
    schedule();
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });

  handleScroll();
  schedule();
}

function showSyncOverlay(active) {
  if (!elements.syncOverlay) {
    return;
  }

  document.body.classList.toggle("is-syncing", active);
  if (active) {
    showClassifiedLoadOverlay(false);
  }
  elements.syncOverlay.classList.toggle("is-active", active);
  elements.syncOverlay.setAttribute("aria-hidden", active ? "false" : "true");
}

function showClassifiedLoadOverlay(active) {
  if (!elements.classifiedLoadOverlay) {
    return;
  }

  if (active) {
    showSyncOverlay(false);
  }
  document.body.classList.toggle("is-classified-loading", active);
  elements.classifiedLoadOverlay.classList.toggle("is-active", active);
  elements.classifiedLoadOverlay.setAttribute("aria-hidden", active ? "false" : "true");
}

function setLanguageMenuOpen(active) {
  if (!elements.langDropdown || !elements.langToggleBtn || !elements.langMenu) {
    return;
  }

  elements.langDropdown.classList.toggle("is-open", active);
  elements.langToggleBtn.setAttribute("aria-expanded", active ? "true" : "false");
  elements.langMenu.hidden = !active;
}

function syncLanguageMenu() {
  if (elements.langCurrent) {
    elements.langCurrent.textContent = state.lang.toUpperCase();
  }

  if (!Array.isArray(elements.langOptions)) {
    return;
  }

  elements.langOptions.forEach((option) => {
    const selected = option.dataset.lang === state.lang;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function applyStaggeredReveal(nodes, stepMs = 45, maxItems = 18) {
  nodes.forEach((node, idx) => {
    node.classList.remove("reveal-item");
    node.style.animationDelay = "0ms";
    if (idx < maxItems) {
      node.style.animationDelay = `${idx * stepMs}ms`;
      node.classList.add("reveal-item");
    }
  });
}

function shuffleCopy(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomJunkChunk(length) {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += HACK_JUNK_CHARS[Math.floor(Math.random() * HACK_JUNK_CHARS.length)];
  }
  return output;
}

function makeAddress(baseAddress, index) {
  return `0x${(baseAddress + index * HACK_DUMP_WIDTH).toString(16).toUpperCase().padStart(4, "0")}`;
}

function createHackColumn(baseAddress) {
  const lines = Array.from({ length: HACK_COLUMN_LINE_COUNT }, (_, index) => {
    return {
      address: makeAddress(baseAddress, index),
      chars: Array.from({ length: HACK_DUMP_WIDTH }, () => {
        return HACK_JUNK_CHARS[Math.floor(Math.random() * HACK_JUNK_CHARS.length)];
      }),
      tokens: []
    };
  });

  return {
    baseAddress,
    lines
  };
}

function canPlaceHackToken(line, start, length) {
  return !line.tokens.some((token) => {
    return start <= token.end && start + length - 1 >= token.start;
  });
}

function placeHackToken(line, token) {
  line.tokens.push(token);
  line.tokens.sort((a, b) => a.start - b.start);

  for (let i = 0; i < token.text.length; i += 1) {
    line.chars[token.start + i] = token.text[i];
  }
}

function placeTextTokenInColumn(column, text, tokenProps = {}) {
  const length = text.length;
  if (!column || length > HACK_DUMP_WIDTH) {
    return false;
  }

  for (let tries = 0; tries < 320; tries += 1) {
    const lineIndex = Math.floor(Math.random() * column.lines.length);
    const line = column.lines[lineIndex];
    const start = Math.floor(Math.random() * (HACK_DUMP_WIDTH - length + 1));
    if (!canPlaceHackToken(line, start, length)) {
      continue;
    }

    placeHackToken(line, {
      ...tokenProps,
      text,
      start,
      end: start + length - 1
    });
    return true;
  }

  return false;
}

function chooseHackWordLength(wordsByLength) {
  const preferred = HACK_WORD_LENGTH_OPTIONS.filter((length) => {
    const pool = wordsByLength[String(length)] || [];
    return pool.length >= HACK_WORD_COUNT;
  });

  if (preferred.length) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }

  const fallback = Object.entries(wordsByLength)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([length]) => Number(length))
    .find((length) => Number.isFinite(length));

  return fallback || HACK_WORD_LENGTH_OPTIONS[0];
}

function buildHackBoard(candidates) {
  const leftColumn = createHackColumn(HACK_ADDRESS_LEFT_BASE);
  const rightColumn = createHackColumn(HACK_ADDRESS_RIGHT_BASE);
  const columns = [leftColumn, rightColumn];

  for (let idx = 0; idx < candidates.length; idx += 1) {
    const word = candidates[idx];
    const primary = columns[idx % columns.length];
    const secondary = columns[(idx + 1) % columns.length];
    const placed = placeTextTokenInColumn(primary, word, { type: "word", word })
      || placeTextTokenInColumn(secondary, word, { type: "word", word });
    if (!placed) {
      return null;
    }
  }

  let pairId = 0;
  let ensureDud = true;
  const pairEffects = new Map();

  for (let idx = 0; idx < HACK_PAIR_COUNT; idx += 1) {
    const [open, close] = HACK_BRACKET_PAIRS[Math.floor(Math.random() * HACK_BRACKET_PAIRS.length)];
    const innerLength = 2 + Math.floor(Math.random() * 5);
    const pairText = `${open}${randomJunkChunk(innerLength)}${close}`;
    const primary = columns[idx % columns.length];
    const secondary = columns[(idx + 1) % columns.length];

    pairId += 1;
    let effect = Math.random() < 0.6 ? "dud" : "allowance";
    if (ensureDud) {
      effect = "dud";
    }

    const placed = placeTextTokenInColumn(primary, pairText, { type: "pair", pairId })
      || placeTextTokenInColumn(secondary, pairText, { type: "pair", pairId });
    if (!placed) {
      pairId -= 1;
      continue;
    }

    pairEffects.set(pairId, effect);
    if (effect === "dud") {
      ensureDud = false;
    }
  }

  if (!pairEffects.size) {
    return null;
  }

  return {
    columns,
    pairEffects
  };
}

function likenessCount(input, target) {
  let likeness = 0;
  for (let i = 0; i < Math.min(input.length, target.length); i += 1) {
    if (input[i] === target[i]) {
      likeness += 1;
    }
  }
  return likeness;
}

function createHackSession() {
  const wordsByLength = HACK_WORD_BANK.reduce((map, word) => {
    const key = String(word.length);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(word);
    return map;
  }, {});
  const chosenLength = chooseHackWordLength(wordsByLength);
  const sourceWords = wordsByLength[String(chosenLength)] || [];
  const activePool = sourceWords.length ? sourceWords : HACK_WORD_BANK;
  const password = activePool[Math.floor(Math.random() * activePool.length)];
  const decoys = shuffleCopy(activePool.filter((word) => word !== password)).slice(0, HACK_WORD_COUNT - 1);
  const candidates = shuffleCopy([password, ...decoys]);

  let board = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    board = buildHackBoard(candidates);
    if (board) {
      break;
    }
  }

  if (!board) {
    board = {
      columns: [createHackColumn(HACK_ADDRESS_LEFT_BASE), createHackColumn(HACK_ADDRESS_RIGHT_BASE)],
      pairEffects: new Map()
    };
  }

  return {
    password,
    candidates,
    columns: board.columns,
    pairEffects: board.pairEffects,
    attempts: HACK_ATTEMPTS_MAX,
    usedWords: new Set(),
    removedWords: new Set(),
    usedPairs: new Set(),
    solved: false,
    locked: false,
    logs: [t("hack_log_boot"), t("hack_log_ready")]
  };
}

function appendHackLog(message) {
  if (!state.easterEgg.hack) {
    return;
  }

  const lines = Array.isArray(message) ? message : [message];
  state.easterEgg.hack.logs.push(...lines);
  if (state.easterEgg.hack.logs.length > 14) {
    state.easterEgg.hack.logs.splice(0, state.easterEgg.hack.logs.length - 14);
  }
}

function clearHackLogAnimationTimer() {
  const animation = state.easterEgg.logAnimation;
  if (animation.timer) {
    clearTimeout(animation.timer);
    animation.timer = null;
  }
}

function resetHackLogAnimation(clearRendered = false) {
  const animation = state.easterEgg.logAnimation;
  animation.requestId += 1;
  clearHackLogAnimationTimer();
  if (clearRendered) {
    animation.displayedText = "";
    if (elements.hackLog) {
      elements.hackLog.textContent = "";
      elements.hackLog.scrollTop = 0;
    }
  }
}

function setHackLogRenderedText(text) {
  if (!elements.hackLog) {
    return;
  }

  elements.hackLog.textContent = text;
  elements.hackLog.scrollTop = elements.hackLog.scrollHeight;
  state.easterEgg.logAnimation.displayedText = text;
}

function sharedPrefixLength(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const max = Math.min(left.length, right.length);
  let idx = 0;
  while (idx < max && left[idx] === right[idx]) {
    idx += 1;
  }
  return idx;
}

function linePrefixLength(lines, count) {
  let length = 0;
  for (let i = 0; i < count; i += 1) {
    length += lines[i].length;
    if (i < count - 1) {
      length += 1;
    }
  }
  return length;
}

function sameLineSlice(leftLines, leftStart, rightLines, rightStart, count) {
  for (let i = 0; i < count; i += 1) {
    if (leftLines[leftStart + i] !== rightLines[rightStart + i]) {
      return false;
    }
  }
  return true;
}

function sharedShiftedLinePrefixLength(currentText, targetText) {
  const current = String(currentText || "");
  const target = String(targetText || "");
  if (!current || !target) {
    return 0;
  }

  const currentLines = current.split("\n");
  const targetLines = target.split("\n");
  const maxOverlap = Math.min(currentLines.length, targetLines.length);
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const currentStart = currentLines.length - overlap;
    if (!sameLineSlice(currentLines, currentStart, targetLines, 0, overlap)) {
      continue;
    }

    return linePrefixLength(targetLines, overlap);
  }

  return 0;
}

function hackLogCharDelay(character) {
  if (!character || character === "\n") {
    return HACK_LOG_TYPE_GAP_MS;
  }
  if (/[.,:;!?=]/.test(character)) {
    return HACK_LOG_TYPE_PUNCT_MS;
  }
  if (character === " ") {
    return HACK_LOG_TYPE_GAP_MS;
  }
  return HACK_LOG_TYPE_CHAR_MS;
}

function renderHackLogAnimated(targetText) {
  if (!elements.hackLog) {
    return;
  }

  const normalizedTarget = String(targetText || "");
  const animation = state.easterEgg.logAnimation;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (normalizedTarget === animation.displayedText && !animation.timer) {
    return;
  }

  const requestId = animation.requestId + 1;
  animation.requestId = requestId;
  clearHackLogAnimationTimer();

  if (reduceMotion) {
    setHackLogRenderedText(normalizedTarget);
    return;
  }

  const currentText = String(animation.displayedText || "");
  const charPrefixLength = sharedPrefixLength(currentText, normalizedTarget);
  const shiftedLinePrefixLength = sharedShiftedLinePrefixLength(currentText, normalizedTarget);
  const prefixLength = Math.max(charPrefixLength, shiftedLinePrefixLength);
  let nextIndex = prefixLength;
  setHackLogRenderedText(normalizedTarget.slice(0, prefixLength));

  const step = () => {
    if (animation.requestId !== requestId) {
      return;
    }

    if (nextIndex >= normalizedTarget.length) {
      animation.timer = null;
      return;
    }

    const nextChar = normalizedTarget[nextIndex];
    const nextText = `${animation.displayedText}${nextChar}`;
    setHackLogRenderedText(nextText);
    if (nextChar !== "\n") {
      playTypeTickSound();
    }
    nextIndex += 1;

    animation.timer = setTimeout(step, hackLogCharDelay(nextChar));
  };

  step();
}

function renderHackColumn(column, session) {
  const columnEl = document.createElement("div");
  columnEl.className = "hack-column";

  for (const line of column.lines) {
    const lineEl = document.createElement("div");
    lineEl.className = "hack-line";

    const addressEl = document.createElement("span");
    addressEl.className = "hack-addr";
    addressEl.textContent = line.address;

    const dumpEl = document.createElement("span");
    dumpEl.className = "hack-dump";

    let cursor = 0;
    for (const token of line.tokens) {
      if (token.start > cursor) {
        dumpEl.append(line.chars.slice(cursor, token.start).join(""));
      }

      if (token.type === "word") {
        if (session.removedWords.has(token.word)) {
          const dudSpan = document.createElement("span");
          dudSpan.className = "hack-dud";
          dudSpan.textContent = ".".repeat(token.text.length);
          dumpEl.appendChild(dudSpan);
        } else if (session.usedWords.has(token.word)) {
          const triedSpan = document.createElement("span");
          triedSpan.className = "hack-word-used";
          triedSpan.textContent = token.text;
          dumpEl.appendChild(triedSpan);
        } else {
          const wordButton = document.createElement("button");
          wordButton.type = "button";
          wordButton.className = "hack-word hack-token";
          wordButton.textContent = token.text;
          wordButton.disabled = session.solved || session.locked;
          wordButton.addEventListener("click", () => {
            handleHackWordSelection(token.word);
          });
          dumpEl.appendChild(wordButton);
        }
      }

      if (token.type === "pair") {
        if (session.usedPairs.has(token.pairId)) {
          const usedPairSpan = document.createElement("span");
          usedPairSpan.className = "hack-pair-used";
          usedPairSpan.textContent = ".".repeat(token.text.length);
          dumpEl.appendChild(usedPairSpan);
        } else {
          const pairButton = document.createElement("button");
          pairButton.type = "button";
          pairButton.className = "hack-pair hack-token";
          pairButton.textContent = token.text;
          pairButton.disabled = session.solved || session.locked;
          pairButton.addEventListener("click", () => {
            handleHackPairSelection(token.pairId, token.text);
          });
          dumpEl.appendChild(pairButton);
        }
      }

      cursor = token.end + 1;
    }

    if (cursor < line.chars.length) {
      dumpEl.append(line.chars.slice(cursor).join(""));
    }

    lineEl.appendChild(addressEl);
    lineEl.appendChild(dumpEl);
    columnEl.appendChild(lineEl);
  }

  return columnEl;
}

function renderHackOverlay() {
  if (!elements.hackMemory || !elements.hackAttempts || !elements.hackLog) {
    return;
  }

  const session = state.easterEgg.hack;
  if (!session) {
    return;
  }

  const pips = `${"\u25A0".repeat(session.attempts)}${"\u25A1".repeat(Math.max(0, HACK_ATTEMPTS_MAX - session.attempts))}`;
  elements.hackAttempts.textContent = pips;

  const memoryFragment = document.createDocumentFragment();
  const enterLine = document.createElement("p");
  enterLine.className = "hack-enter-line";
  enterLine.textContent = t("hack_enter_password");
  memoryFragment.appendChild(enterLine);

  const columnsWrap = document.createElement("div");
  columnsWrap.className = "hack-columns";
  for (const column of session.columns || []) {
    columnsWrap.appendChild(renderHackColumn(column, session));
  }
  memoryFragment.appendChild(columnsWrap);

  elements.hackMemory.innerHTML = "";
  elements.hackMemory.appendChild(memoryFragment);

  renderHackLogAnimated(session.logs.join("\n"));

  if (elements.hackRetryBtn) {
    elements.hackRetryBtn.hidden = !session.locked;
  }
  if (elements.hackOpenClassifiedBtn) {
    elements.hackOpenClassifiedBtn.hidden = !(session.solved || state.easterEgg.unlocked);
  }
}

function showHackOverlay() {
  if (!elements.hackOverlay || document.body.classList.contains("is-booting")) {
    return;
  }

  state.easterEgg.triggerClicks = 0;
  state.easterEgg.triggerWindowStart = 0;

  if (document.body.classList.contains("is-classified")) {
    hideClassifiedPage();
  }

  if (!state.easterEgg.hack || state.easterEgg.hack.locked || state.easterEgg.hack.solved) {
    state.easterEgg.hack = createHackSession();
  }

  if (!elements.hackOverlay.classList.contains("is-active")) {
    resetHackLogAnimation(true);
  }
  renderHackOverlay();
  document.body.classList.add("is-hacking");
  elements.hackOverlay.classList.add("is-active");
  elements.hackOverlay.setAttribute("aria-hidden", "false");
}

function hideHackOverlay() {
  document.body.classList.remove("is-hacking");
  if (!elements.hackOverlay) {
    return;
  }

  showClassifiedLoadOverlay(false);
  resetHackLogAnimation(true);
  elements.hackOverlay.classList.remove("is-success");
  elements.hackOverlay.classList.remove("is-active");
  elements.hackOverlay.setAttribute("aria-hidden", "true");
}

function startNewHackSession() {
  state.easterEgg.hack = createHackSession();
  resetHackLogAnimation(true);
  renderHackOverlay();
}

function handleHackPairSelection(pairId, pairText) {
  const session = state.easterEgg.hack;
  if (!session || session.solved || session.locked || session.usedPairs.has(pairId)) {
    return;
  }

  session.usedPairs.add(pairId);
  appendHackLog(`> ${pairText}`);

  const effect = session.pairEffects?.get(pairId) || "dud";
  const dudPool = session.candidates.filter((word) => {
    return word !== session.password && !session.usedWords.has(word) && !session.removedWords.has(word);
  });

  if (effect === "dud" && dudPool.length) {
    const dud = dudPool[Math.floor(Math.random() * dudPool.length)];
    session.removedWords.add(dud);
    appendHackLog(t("hack_dud_removed"));
  } else {
    session.attempts = HACK_ATTEMPTS_MAX;
    appendHackLog(t("hack_allowance_replenished"));
  }

  renderHackOverlay();
}

function handleHackWordSelection(word) {
  const session = state.easterEgg.hack;
  if (!session || session.solved || session.locked || session.usedWords.has(word) || session.removedWords.has(word)) {
    return;
  }

  session.usedWords.add(word);
  appendHackLog(`> ${word}`);

  if (word === session.password) {
    session.solved = true;
    state.easterEgg.unlocked = true;
    appendHackLog(t("hack_exact_match"));
    appendHackLog(t("hack_access_granted"));
    appendHackLog(t("hack_accessing_archive"));
    renderHackOverlay();
    beginClassifiedTransition();
    return;
  }

  session.attempts = Math.max(0, session.attempts - 1);
  appendHackLog(t("hack_entry_denied"));
  appendHackLog(t("hack_likeness", { n: likenessCount(word, session.password), total: session.password.length }));

  if (session.attempts === 0) {
    session.locked = true;
    appendHackLog(t("hack_lockout"));
  }

  renderHackOverlay();
}

function beginClassifiedTransition() {
  if (!elements.hackOverlay) {
    showClassifiedPage();
    return;
  }

  if (!elements.hackOverlay.classList.contains("is-active")) {
    showClassifiedPage();
    return;
  }

  if (elements.hackOverlay.classList.contains("is-success")) {
    return;
  }

  elements.hackOverlay.classList.add("is-success");
  // Close hack overlay first so classified loading never renders behind its blur layer.
  hideHackOverlay();
  showClassifiedLoadOverlay(true);

  const classifiedLoadMs = 950;
  setTimeout(() => {
    showClassifiedLoadOverlay(false);
    showClassifiedPage();
  }, classifiedLoadMs);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildClassifiedSearchCatalog(lists = state.minervaLists || []) {
  const entries = [];
  const source = Array.isArray(lists) ? lists : [];

  for (const listData of source) {
    const listNumber = Number(listData?.ListNumber);
    if (!Number.isFinite(listNumber)) {
      continue;
    }

    const inventory = Array.isArray(listData.Inventory) ? listData.Inventory : [];
    for (const item of inventory) {
      const name = String(item?.Name || "").trim();
      if (!name) {
        continue;
      }

      const price = Number(item?.Price);
      const wikiUrl = normalizeWikiUrl(item?.WikiUrl || "");
      entries.push({
        listNumber,
        name,
        normalizedName: normalizePlanName(name),
        normalizedRaw: normalizeSearchText(name),
        price: Number.isFinite(price) ? price : null,
        wikiUrl: wikiUrl || null
      });
    }
  }

  state.classifiedSearch.entries = entries;
}

function scoreClassifiedSearchEntry(entry, queryNorm, queryRaw) {
  if (!queryNorm && !queryRaw) {
    return 0;
  }

  const hasNorm = Boolean(queryNorm);
  const hasRaw = Boolean(queryRaw);
  let score = 0;
  if ((hasNorm && entry.normalizedName === queryNorm) || (hasRaw && entry.normalizedRaw === queryRaw)) {
    score += 120;
  } else if (
    (hasNorm && entry.normalizedName.startsWith(queryNorm)) ||
    (hasRaw && entry.normalizedRaw.startsWith(queryRaw))
  ) {
    score += 80;
  } else if (
    (hasNorm && entry.normalizedName.includes(queryNorm)) ||
    (hasRaw && entry.normalizedRaw.includes(queryRaw))
  ) {
    score += 56;
  } else {
    return 0;
  }

  const queryTokens = (hasNorm ? queryNorm : queryRaw).split(" ").filter(Boolean);
  const tokenMatches = queryTokens.reduce((sum, token) => {
    return sum + (entry.normalizedName.includes(token) ? 1 : 0);
  }, 0);
  score += tokenMatches * 8;

  return score;
}

function nextAvailabilityForList(listNumber, now = new Date()) {
  const listValue = Number(listNumber);
  if (!Number.isFinite(listValue) || listValue < 1) {
    return null;
  }

  const targetCycleIndex = mod(listValue - 1, CYCLE_WEEKS);
  const currentWeek = resolveFallbackWeekNumber(now);
  const currentCycleIndex = mod(currentWeek, CYCLE_WEEKS);

  let weekCandidate = currentWeek + mod(targetCycleIndex - currentCycleIndex, CYCLE_WEEKS);
  let cycle = cycleForWeek(weekCandidate);

  if (now >= cycle.eventEnd) {
    weekCandidate += CYCLE_WEEKS;
    cycle = cycleForWeek(weekCandidate);
  }

  const isActive = now >= cycle.eventStart && now < cycle.eventEnd;
  const msUntil = cycle.eventStart.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(msUntil / MS_DAY));
  const phase = mod(listValue - 1, 4);

  return {
    ...cycle,
    isActive,
    daysUntil,
    saleKey: phase === 3 ? "classified_sale_big" : "classified_sale_standard"
  };
}

function setClassifiedSearchCount(text = "") {
  if (!elements.classifiedSearchCount) {
    return;
  }
  const hasText = Boolean(text);
  elements.classifiedSearchCount.hidden = !hasText;
  elements.classifiedSearchCount.textContent = hasText ? text : "";
}

function syncClassifiedArchiveVisibility() {
  const detailOpen = Boolean(state.classifiedDetail.open && state.classifiedDetail.item);
  const searchOpen = Boolean(state.classifiedSearch.open);

  if (elements.classifiedSearchWrap) {
    elements.classifiedSearchWrap.hidden = detailOpen || !searchOpen;
  }
  if (elements.classifiedSearchResults) {
    elements.classifiedSearchResults.hidden = detailOpen || !searchOpen;
  }
  if (elements.classifiedMinervaLists) {
    elements.classifiedMinervaLists.hidden = detailOpen || searchOpen;
  }
  if (elements.classifiedInlineDetail) {
    elements.classifiedInlineDetail.hidden = !detailOpen;
  }
}

function refreshClassifiedArchiveCardBaseSize(force = false) {
  if (!elements.classifiedArchiveCard || (state.classifiedSearch.open && !force)) {
    return;
  }

  const rect = elements.classifiedArchiveCard.getBoundingClientRect();
  const cardWidth = Math.round(rect.width);
  if (cardWidth > 0) {
    state.classifiedSearch.baseArchiveWidth = cardWidth;
  }
}

function lockClassifiedArchiveCardSize() {
  if (!elements.classifiedArchiveCard) {
    return;
  }

  const rect = elements.classifiedArchiveCard.getBoundingClientRect();
  const measuredWidth = Math.round(rect.width);
  if (measuredWidth > 0 && !state.classifiedSearch.baseArchiveWidth) {
    state.classifiedSearch.baseArchiveWidth = measuredWidth;
  }

  const targetWidth = state.classifiedSearch.baseArchiveWidth || measuredWidth || 0;
  if (targetWidth > 0) {
    const nextWidth = `${targetWidth}px`;
    elements.classifiedArchiveCard.style.width = nextWidth;
    elements.classifiedArchiveCard.style.minWidth = nextWidth;
    elements.classifiedArchiveCard.style.maxWidth = nextWidth;
  }
}

function unlockClassifiedArchiveCardSize() {
  if (!elements.classifiedArchiveCard) {
    return;
  }
  elements.classifiedArchiveCard.style.removeProperty("width");
  elements.classifiedArchiveCard.style.removeProperty("min-width");
  elements.classifiedArchiveCard.style.removeProperty("max-width");
}

function setClassifiedSearchOpen(active, { focusInput = false, clearQuery = false } = {}) {
  const wasOpen = state.classifiedSearch.open;
  const open = Boolean(active);
  state.classifiedSearch.open = open;

  if (open && !wasOpen) {
    refreshClassifiedArchiveCardBaseSize(true);
    lockClassifiedArchiveCardSize();
  }

  syncClassifiedArchiveVisibility();

  if (!open) {
    setClassifiedSearchCount("");
    if (wasOpen) {
      unlockClassifiedArchiveCardSize();
      requestAnimationFrame(() => {
        refreshClassifiedArchiveCardBaseSize();
      });
    }
  }

  if (elements.classifiedSearchToggleBtn) {
    elements.classifiedSearchToggleBtn.classList.toggle("is-active", open);
    elements.classifiedSearchToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    const titleKey = open ? "classified_search_toggle_close_label" : "classified_search_toggle_open_label";
    elements.classifiedSearchToggleBtn.title = t(titleKey);
    elements.classifiedSearchToggleBtn.setAttribute("aria-label", t(titleKey));
  }
  if (elements.classifiedSearchToggleText) {
    const textKey = open ? "classified_search_toggle_close" : "classified_search_toggle_open";
    elements.classifiedSearchToggleText.textContent = t(textKey);
  }

  if (!open && clearQuery && elements.classifiedSearchInput) {
    elements.classifiedSearchInput.value = "";
    state.classifiedSearch.query = "";
  }

  if (open && !(state.classifiedDetail.open && state.classifiedDetail.item)) {
    renderClassifiedMinervaSearchResults();
    if (focusInput && elements.classifiedSearchInput) {
      elements.classifiedSearchInput.focus();
      elements.classifiedSearchInput.select();
    }
  }
}

function renderClassifiedMinervaSearchResults() {
  if (!elements.classifiedSearchResults || !elements.classifiedSearchInput) {
    return;
  }

  if (!state.classifiedSearch.open) {
    elements.classifiedSearchResults.innerHTML = "";
    setClassifiedSearchCount("");
    return;
  }

  const query = String(elements.classifiedSearchInput.value || "").trim();
  state.classifiedSearch.query = query;

  if (!query) {
    setClassifiedSearchCount("");
    elements.classifiedSearchResults.innerHTML = `<p class="classified-search-empty">${t("classified_search_prompt")}</p>`;
    return;
  }

  const queryNorm = normalizePlanName(query);
  const queryRaw = normalizeSearchText(query);
  const entries = Array.isArray(state.classifiedSearch.entries) ? state.classifiedSearch.entries : [];
  const now = new Date();

  const bestMatchByItem = new Map();
  for (const entry of entries) {
    const score = scoreClassifiedSearchEntry(entry, queryNorm, queryRaw);
    if (!score) {
      continue;
    }

    const availability = nextAvailabilityForList(entry.listNumber, now);
    if (!availability) {
      continue;
    }

    const candidate = {
      ...entry,
      score,
      availability
    };

    const itemKey = entry.normalizedName || entry.normalizedRaw || normalizeSearchText(entry.name);
    const existing = bestMatchByItem.get(itemKey);
    if (!existing) {
      bestMatchByItem.set(itemKey, candidate);
      continue;
    }

    const candidateStart = candidate.availability.eventStart.getTime();
    const existingStart = existing.availability.eventStart.getTime();
    if (
      candidateStart < existingStart ||
      (candidateStart === existingStart && candidate.score > existing.score) ||
      (
        candidateStart === existingStart &&
        candidate.score === existing.score &&
        (candidate.price ?? Number.MAX_SAFE_INTEGER) < (existing.price ?? Number.MAX_SAFE_INTEGER)
      )
    ) {
      bestMatchByItem.set(itemKey, candidate);
    }
  }

  const matches = [...bestMatchByItem.values()];

  if (!matches.length) {
    setClassifiedSearchCount(t("classified_search_results_count", { n: "0" }));
    elements.classifiedSearchResults.innerHTML = `<p class="classified-search-empty">${t("classified_search_no_results")}</p>`;
    return;
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.availability.daysUntil !== b.availability.daysUntil) return a.availability.daysUntil - b.availability.daysUntil;
    if ((a.price ?? Number.MAX_SAFE_INTEGER) !== (b.price ?? Number.MAX_SAFE_INTEGER)) {
      return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
    }
    return a.name.localeCompare(b.name);
  });

  const limited = matches.slice(0, 40);
  const fragment = document.createDocumentFragment();
  setClassifiedSearchCount(t("classified_search_results_count", { n: String(matches.length) }));

  for (const match of limited) {
    const row = document.createElement("article");
    row.className = "classified-search-row";

    const itemField = document.createElement("div");
    itemField.className = "classified-search-cell classified-search-item";

    const itemLabel = document.createElement("span");
    itemLabel.className = "classified-search-k";
    itemLabel.textContent = t("classified_search_item");
    itemField.appendChild(itemLabel);

    const itemValue = document.createElement("span");
    itemValue.className = "classified-search-v";
    if (isPlanOrPlanoItem(match.name)) {
      itemValue.appendChild(createIconTag(PLAN_ITEM_GLYPH));
    }
    if (match.wikiUrl) {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "minerva-item-trigger classified-item-trigger";
      trigger.textContent = match.name;
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        void openClassifiedInlineDetail({
          name: match.name,
          price: match.price,
          wikiUrl: match.wikiUrl
        });
      });
      itemValue.appendChild(trigger);
    } else {
      itemValue.append(match.name);
    }
    itemField.appendChild(itemValue);
    row.appendChild(itemField);

    const priceField = document.createElement("div");
    priceField.className = "classified-search-cell";
    priceField.innerHTML = `<span class="classified-search-k">${t("classified_search_price")}</span>`;
    const priceValue = document.createElement("span");
    priceValue.className = "classified-search-v";
    priceValue.appendChild(createIconTag(GOLD_BULLION_GLYPH));
    priceValue.append(match.price != null ? Number(match.price).toLocaleString() : "--");
    priceField.appendChild(priceValue);
    row.appendChild(priceField);

    const saleField = document.createElement("div");
    saleField.className = "classified-search-cell";
    saleField.innerHTML = `<span class="classified-search-k">${t("classified_search_sale")}</span>`;
    const saleValue = document.createElement("span");
    saleValue.className = "classified-search-v";
    saleValue.textContent = `${t("list_value", { n: String(match.listNumber).padStart(2, "0") })} - ${t(match.availability.saleKey)} - ${localizeLocation(match.availability.location)}`;
    saleField.appendChild(saleValue);
    row.appendChild(saleField);

    const availableField = document.createElement("div");
    availableField.className = "classified-search-cell";
    availableField.innerHTML = `<span class="classified-search-k">${t("classified_search_available")}</span>`;
    const availableValue = document.createElement("span");
    availableValue.className = "classified-search-v";
    const availableStamp = formatStamp(match.availability.eventStart);
    availableValue.textContent = match.availability.isActive
      ? `${availableStamp} (${t("classified_search_now")})`
      : availableStamp;
    availableField.appendChild(availableValue);
    row.appendChild(availableField);

    const daysField = document.createElement("div");
    daysField.className = "classified-search-cell";
    daysField.innerHTML = `<span class="classified-search-k">${t("classified_search_days")}</span>`;
    const daysValue = document.createElement("span");
    daysValue.className = "classified-search-v";
    daysValue.textContent = t("classified_days_value", { n: match.availability.daysUntil });
    daysField.appendChild(daysValue);
    row.appendChild(daysField);

    fragment.appendChild(row);
  }

  elements.classifiedSearchResults.innerHTML = "";
  elements.classifiedSearchResults.appendChild(fragment);
}

function renderClassifiedInlineDetail() {
  if (
    !elements.classifiedInlineDetail
    || !elements.classifiedInlineName
    || !elements.classifiedInlineWikiLink
    || !elements.classifiedInlineStatus
    || !elements.classifiedInlineContent
    || !elements.classifiedInlineImage
    || !elements.classifiedInlineWhereLabel
    || !elements.classifiedInlineWhereList
    || !elements.classifiedInlineUnlocksLabel
    || !elements.classifiedInlineUnlocks
  ) {
    return;
  }

  const isOpen = Boolean(state.classifiedDetail.open && state.classifiedDetail.item);
  syncClassifiedArchiveVisibility();
  if (!isOpen) {
    return;
  }

  const item = state.classifiedDetail.item || {};
  const detail = state.classifiedDetail.data;
  const itemName = String(item.name || item.Name || t("files_unknown_value"));
  const wikiUrl = normalizeWikiUrl(detail?.wikiUrl || item.url || item.WikiUrl || "");

  elements.classifiedInlineName.textContent = itemName;
  elements.classifiedInlineWikiLink.textContent = t("minerva_detail_open_source");
  elements.classifiedInlineWikiLink.href = wikiUrl || "#";
  elements.classifiedInlineWikiLink.hidden = !wikiUrl;
  elements.classifiedInlineWhereLabel.textContent = t("minerva_detail_where_label");
  elements.classifiedInlineUnlocksLabel.textContent = t("minerva_detail_unlocks_label");
  if (elements.classifiedInlineCloseBtn) {
    elements.classifiedInlineCloseBtn.textContent = t("minerva_detail_back");
  }

  if (state.classifiedDetail.loading) {
    elements.classifiedInlineStatus.hidden = false;
    elements.classifiedInlineStatus.textContent = t("minerva_detail_loading");
    elements.classifiedInlineContent.classList.remove("is-revealing");
    elements.classifiedInlineContent.hidden = true;
    return;
  }

  if (state.classifiedDetail.error || !detail) {
    elements.classifiedInlineStatus.hidden = false;
    elements.classifiedInlineStatus.textContent = state.classifiedDetail.error || t("minerva_detail_error");
    elements.classifiedInlineContent.classList.remove("is-revealing");
    elements.classifiedInlineContent.hidden = true;
    return;
  }

  const shouldAnimateContent = elements.classifiedInlineContent.hidden;
  elements.classifiedInlineStatus.hidden = true;
  elements.classifiedInlineContent.hidden = false;

  const fallbackImageUrl = state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE;
  const detailImageUrl = detail.imageUrl || fallbackImageUrl;

  if (detailImageUrl) {
    void queueImagePreload(detailImageUrl, { highPriority: true });
    elements.classifiedInlineImage.hidden = false;
    elements.classifiedInlineImage.dataset.fallbackSrc = fallbackImageUrl || detailImageUrl;
    elements.classifiedInlineImage.src = detailImageUrl;
    elements.classifiedInlineImage.alt = `${itemName} image`;
  } else {
    elements.classifiedInlineImage.hidden = true;
    elements.classifiedInlineImage.removeAttribute("data-fallback-src");
    elements.classifiedInlineImage.removeAttribute("src");
    elements.classifiedInlineImage.alt = "";
  }

  const whereElse = Array.isArray(detail.whereElse) && detail.whereElse.length
    ? detail.whereElse
    : [t("minerva_detail_no_other_sources")];
  const whereFragment = document.createDocumentFragment();
  for (const sourceLine of whereElse) {
    const li = document.createElement("li");
    li.textContent = sourceLine;
    whereFragment.appendChild(li);
  }
  elements.classifiedInlineWhereList.innerHTML = "";
  elements.classifiedInlineWhereList.appendChild(whereFragment);

  elements.classifiedInlineUnlocks.textContent = detail.unlocks || t("minerva_detail_no_unlocks");

  if (shouldAnimateContent) {
    restartMinervaDetailAnimation(elements.classifiedInlineContent, "is-revealing", 320);
  }
}

function closeClassifiedInlineDetail() {
  state.classifiedDetail.requestId += 1;
  state.classifiedDetail.loading = false;
  state.classifiedDetail.error = "";
  state.classifiedDetail.item = null;
  state.classifiedDetail.data = null;
  state.classifiedDetail.open = false;
  renderClassifiedInlineDetail();
  syncClassifiedArchiveVisibility();
  if (state.classifiedSearch.open) {
    renderClassifiedMinervaSearchResults();
  }
}

async function openClassifiedInlineDetail(item = {}) {
  const itemName = String(item?.name || item?.Name || "").trim();
  const itemUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || item?.wikiUrl || "");
  if (!itemName || !itemUrl) {
    return;
  }

  const numericPrice = Number(item?.price ?? item?.Price);
  const safePrice = Number.isFinite(numericPrice) ? numericPrice : null;

  const normalizedItem = {
    name: itemName,
    Name: itemName,
    price: safePrice,
    Price: safePrice,
    url: itemUrl,
    WikiUrl: itemUrl
  };

  const detailKey = minervaDetailKeyFromUrl(itemUrl);
  const cacheKey = `${state.lang}:${detailKey}`;
  const requestId = state.classifiedDetail.requestId + 1;
  state.classifiedDetail.requestId = requestId;
  state.classifiedDetail.error = "";
  state.classifiedDetail.item = normalizedItem;
  state.classifiedDetail.open = true;
  state.classifiedDetail.loading = false;
  renderClassifiedInlineDetail();
  syncClassifiedArchiveVisibility();

  const cachedDetail = state.minervaDetail.cache[cacheKey];
  if (cachedDetail) {
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    state.classifiedDetail.data = cachedDetail;
    renderClassifiedInlineDetail();
    return;
  }

  const immediateOffline = resolveOfflineMinervaDetailFromMap(normalizedItem, state.lang);
  if (immediateOffline) {
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    state.classifiedDetail.data = immediateOffline;
    state.minervaDetail.cache[cacheKey] = immediateOffline;
    renderClassifiedInlineDetail();
    return;
  }

  state.classifiedDetail.loading = true;
  state.classifiedDetail.data = null;
  renderClassifiedInlineDetail();

  let offlineDetail = null;
  try {
    offlineDetail = await resolveOfflineMinervaDetail(normalizedItem, state.lang);
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    if (offlineDetail) {
      state.classifiedDetail.loading = false;
      state.classifiedDetail.error = "";
      state.classifiedDetail.data = offlineDetail;
      state.minervaDetail.cache[cacheKey] = offlineDetail;
      renderClassifiedInlineDetail();
      return;
    }
  } catch {
    // Continue with online fallback.
  }

  try {
    const liveDetail = await fetchMinervaPlanDetail(normalizedItem, state.lang);
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }

    const normalizedLive = {
      wikiUrl: normalizeWikiUrl(liveDetail?.wikiUrl || itemUrl),
      imageUrl: liveDetail?.imageUrl || state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE,
      whereElse: Array.isArray(liveDetail?.whereElse)
        ? liveDetail.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
        : [],
      unlocks: sanitizeDetailText(liveDetail?.unlocks || "")
    };

    state.classifiedDetail.loading = false;
    state.classifiedDetail.error = "";
    state.classifiedDetail.data = normalizedLive;
    state.minervaDetail.cache[cacheKey] = normalizedLive;
    renderClassifiedInlineDetail();
  } catch {
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    state.classifiedDetail.loading = false;
    state.classifiedDetail.error = t("minerva_detail_error");
    state.classifiedDetail.data = null;
    renderClassifiedInlineDetail();
  }
}

function renderClassifiedMinervaLists(lists = state.minervaLists || []) {
  if (!elements.classifiedMinervaLists) {
    return;
  }

  const sortedLists = Array.isArray(lists)
    ? [...lists].sort((a, b) => Number(a.ListNumber) - Number(b.ListNumber))
    : [];

  if (!sortedLists.length) {
    elements.classifiedMinervaLists.innerHTML = `<p class="classified-minerva-empty">${t("classified_minerva_empty")}</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const listData of sortedLists) {
    const block = document.createElement("section");
    block.className = "classified-list-block";

    const heading = document.createElement("h4");
    heading.className = "classified-list-heading";
    heading.textContent = t("list_value", { n: String(listData.ListNumber).padStart(2, "0") });
    block.appendChild(heading);

    const items = Array.isArray(listData.Inventory) ? listData.Inventory : [];
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "classified-item-row";

      const nameWrap = document.createElement("span");
      nameWrap.className = "classified-item-name";
      if (isPlanOrPlanoItem(item.Name)) {
        nameWrap.appendChild(createIconTag(PLAN_ITEM_GLYPH));
      }

      const itemUrl = normalizeWikiUrl(item?.WikiUrl || "");
      if (itemUrl) {
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "minerva-item-trigger classified-item-trigger";
        trigger.textContent = item.Name;
        trigger.addEventListener("click", (event) => {
          event.preventDefault();
          void openClassifiedInlineDetail({
            Name: item.Name,
            Price: item.Price,
            WikiUrl: itemUrl
          });
        });
        nameWrap.appendChild(trigger);
      } else {
        nameWrap.append(item.Name);
      }

      const priceWrap = document.createElement("span");
      priceWrap.className = "classified-item-price";
      priceWrap.appendChild(createIconTag(GOLD_BULLION_GLYPH));
      priceWrap.append(Number(item.Price).toLocaleString());

      row.appendChild(nameWrap);
      row.appendChild(priceWrap);
      block.appendChild(row);
    }

    fragment.appendChild(block);
  }

  elements.classifiedMinervaLists.innerHTML = "";
  elements.classifiedMinervaLists.appendChild(fragment);
  refreshClassifiedArchiveCardBaseSize();
}

async function ensureClassifiedMinervaArchive() {
  const lists = await loadMinervaLists();
  renderClassifiedMinervaLists(lists);
  buildClassifiedSearchCatalog(lists);
  setClassifiedSearchOpen(state.classifiedSearch.open);
}

function showClassifiedPage({ updateHash = true } = {}) {
  closeIntelBotInviteModal();
  if (!state.easterEgg.unlocked && !state.easterEgg.hack?.solved) {
    return;
  }

  state.easterEgg.unlocked = true;
  hideSiloDossier({ updateHash: false });
  showClassifiedLoadOverlay(false);
  hideHackOverlay();
  hideFilesPage();

  if (elements.classifiedPage) {
    elements.classifiedPage.hidden = false;
    elements.classifiedPage.classList.remove("is-entering");
    void elements.classifiedPage.offsetWidth;
    elements.classifiedPage.classList.add("is-entering");
    setTimeout(() => {
      elements.classifiedPage?.classList.remove("is-entering");
    }, 780);
  }

  state.view = "classified";
  document.body.classList.add("is-classified");
  elements.mainTitle.textContent = t("classified_main_title");
  syncTopTabForCurrentView();
  renderFilesBotAdminPanel();
  if (updateHash) {
    setHashView("classified");
  }
  setClassifiedSearchOpen(false, { clearQuery: true });
  void ensureClassifiedMinervaArchive();
}

function hideClassifiedPage() {
  showIntelPage({ updateHash: true });
}

function handleSecretTriggerTap() {
  if (elements.hackOverlay?.classList.contains("is-active")) {
    state.easterEgg.triggerClicks = 0;
    state.easterEgg.triggerWindowStart = 0;
    return;
  }

  const now = Date.now();
  if (!state.easterEgg.triggerWindowStart || now - state.easterEgg.triggerWindowStart > HACK_TRIGGER_WINDOW_MS) {
    state.easterEgg.triggerWindowStart = now;
    state.easterEgg.triggerClicks = 0;
  }

  state.easterEgg.triggerClicks += 1;
  if (state.easterEgg.triggerClicks >= HACK_TRIGGER_CLICKS) {
    state.easterEgg.triggerClicks = 0;
    state.easterEgg.triggerWindowStart = 0;
    showHackOverlay();
  }
}

async function fetchTextWithTimeout(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSiloDataFromApi(timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(SILO_API_URL, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const codes = payload && typeof payload.codes === "object" ? payload.codes : {};
    const resetTargetRaw = String(payload?.resetTargetUtc || "").trim();
    const resetTargetMs = resetTargetRaw ? Date.parse(resetTargetRaw) : NaN;

    return {
      codes: {
        Alpha: typeof codes.Alpha === "string" ? codes.Alpha : null,
        Bravo: typeof codes.Bravo === "string" ? codes.Bravo : null,
        Charlie: typeof codes.Charlie === "string" ? codes.Charlie : null
      },
      isExpired: Boolean(payload?.isExpired),
      resetTargetUtc: Number.isFinite(resetTargetMs) ? resetTargetMs : null,
      source: String(payload?.source || "").trim() || "https://nukacrypt.com/"
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromCandidates(candidates, timeoutMs = 20000) {
  let lastError = new Error("No source candidates configured.");

  for (const candidate of candidates) {
    try {
      const text = await fetchTextWithTimeout(proxied(candidate), timeoutMs);
      return { text, source: candidate };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function extractSiloCode(text, label, stopLabels) {
  const upper = text.toUpperCase();
  const start = upper.indexOf(label);
  if (start === -1) {
    return null;
  }

  const afterStart = text.slice(start + label.length);
  let sectionEnd = afterStart.length;

  for (const stopLabel of stopLabels) {
    const idx = afterStart.toUpperCase().indexOf(stopLabel);
    if (idx >= 0 && idx < sectionEnd) {
      sectionEnd = idx;
    }
  }

  const block = afterStart.slice(0, sectionEnd);
  return block.match(/\b(\d{8})\b/)?.[1] || null;
}

function parseSiloResetCountdown(text) {
  const match = text.match(/Resets\s+in:\s*(\d+)d\s*(\d+)h\s*(\d+)m(?:\s*(\d+)s)?/i);
  if (!match) {
    return null;
  }

  return {
    days: Number(match[1]),
    hours: Number(match[2]),
    minutes: Number(match[3]),
    seconds: Number(match[4] || 0)
  };
}

function countdownToUtc(countdown, baseMs = Date.now()) {
  if (!countdown) {
    return null;
  }

  const totalMs = (((countdown.days * 24 + countdown.hours) * 60 + countdown.minutes) * 60 + countdown.seconds) * 1000;
  return baseMs + totalMs;
}

function parseSiloData(text) {
  const normalized = text.replace(/\u00A0/g, " ");

  return {
    codes: {
      Alpha: extractSiloCode(normalized, "ALPHA", ["BRAVO", "CHARLIE"]),
      Bravo: extractSiloCode(normalized, "BRAVO", ["CHARLIE"]),
      Charlie: extractSiloCode(normalized, "CHARLIE", ["RESETS IN", "RECENT NEWS", "NUKE CODES VALID", "CART", "VIEW ALL RESULTS"])
    },
    resetCountdown: parseSiloResetCountdown(normalized),
    isExpired: /Expired\s*-\s*Please\s+wait\s+for\s+the\s+codes\s+to\s+be\s+updated/i.test(normalized)
  };
}

function formatSiloCodeForDisplay(code) {
  const digits = typeof code === "string" ? code.replace(/\D/g, "") : "";
  const match = digits.match(/^(\d{3})(\d{2})(\d{3})$/);

  if (!match) {
    return "--- -- ---";
  }

  return `${match[1]} ${match[2]} ${match[3]}`;
}

function renderSiloFromState() {
  elements.siloCodes.innerHTML = "";

  if (state.silo.error) {
    elements.siloCodes.innerHTML = `<div class="error">${t("silo_error")}</div>`;
    if (state.siloDossier.open) {
      renderSiloDossier();
    }
    return;
  }

  const codes = state.silo.codes || {
    Alpha: null,
    Bravo: null,
    Charlie: null
  };
  const cards = [];

  for (const site of ["Alpha", "Bravo", "Charlie"]) {
    const card = document.createElement("div");
    card.className = "code-card";

    const siteLabel = document.createElement("div");
    siteLabel.className = "site";
    const siteIcon = createIconTag(SILO_SITE_GLYPHS[site] || "");
    siteLabel.appendChild(siteIcon);
    siteLabel.append(`SITE ${site.toUpperCase()}`);

    const codeValue = document.createElement("div");
    codeValue.className = "code";
    codeValue.textContent = formatSiloCodeForDisplay(codes[site]);

    card.appendChild(siteLabel);
    card.appendChild(codeValue);
    elements.siloCodes.appendChild(card);
    cards.push(card);
  }

  if (state.silo.isExpired) {
    const note = document.createElement("div");
    note.className = "error";
    note.textContent = t("silo_expired");
    elements.siloCodes.appendChild(note);
  }

  applyStaggeredReveal(cards, 55, 6);
  if (state.siloDossier.open) {
    renderSiloDossier();
  }
}

async function refreshSiloPanel() {
  const previousResetTarget = state.silo.resetTargetUtc;

  try {
    let nextSiloData;

    try {
      nextSiloData = await fetchSiloDataFromApi(12000);
    } catch (_apiError) {
      const { text, source } = await fetchFromCandidates(SOURCE_URLS.silo, 25000);
      const parsed = parseSiloData(text);
      nextSiloData = {
        codes: parsed.codes,
        isExpired: parsed.isExpired,
        resetTargetUtc: countdownToUtc(parsed.resetCountdown),
        source
      };
    }

    const hasAtLeastOne = Object.values(nextSiloData.codes || {}).some(Boolean);

    state.silo = {
      error: !hasAtLeastOne,
      codes: nextSiloData.codes,
      isExpired: nextSiloData.isExpired,
      resetTargetUtc: nextSiloData.resetTargetUtc || previousResetTarget || null,
      source: nextSiloData.source
    };

    renderSiloFromState();
    return { ok: hasAtLeastOne };
  } catch (error) {
    state.silo = {
      error: true,
      codes: null,
      isExpired: false,
      resetTargetUtc: previousResetTarget || null,
      source: state.silo.source || "https://nukacrypt.com/"
    };
    renderSiloFromState();
    return { ok: false };
  }
}

function normalizePlanName(name) {
  return String(name || "")
    .replace(/^Plan:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPlanOrPlanoItem(name) {
  return /\bplan(?:o)?\b/i.test(String(name || ""));
}

function createIconTag(glyph) {
  const icon = document.createElement("span");
  icon.className = "fo76-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = glyph;
  return icon;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWikiUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${WIKI_BASE}${value}`;
  }

  return `${WIKI_BASE}/${value.replace(/^\/+/, "")}`;
}

function normalizeWikiTitle(title) {
  return String(title || "")
    .trim()
    .replace(/\s+/g, "_");
}

function wikiApiForLang(lang) {
  return lang === "es" ? WIKI_API_BY_LANG.es : WIKI_API_BY_LANG.en;
}

function buildWikiPageUrl(title, lang = "en") {
  const normalizedTitle = normalizeWikiTitle(title);
  if (!normalizedTitle) {
    return "";
  }

  const basePath = lang === "es" ? `${WIKI_BASE}/es/wiki/` : `${WIKI_BASE}/wiki/`;
  return `${basePath}${encodeURIComponent(normalizedTitle)}`;
}

function wikiPageTitleFromUrl(url) {
  try {
    const parsed = new URL(normalizeWikiUrl(url));
    const path = decodeURIComponent(parsed.pathname || "");
    const page = path.replace(/^\/(?:es\/)?wiki\//i, "").trim();
    return page.replace(/\s+/g, "_");
  } catch (error) {
    return "";
  }
}

function minervaDetailKeyFromUrl(url) {
  const title = wikiPageTitleFromUrl(url);
  if (title) {
    return `${WIKI_BASE}/wiki/${title}`.toLowerCase();
  }
  return normalizeWikiUrl(url).toLowerCase();
}

function minervaDetailKeyCandidatesFromUrl(url) {
  const normalizedUrl = normalizeWikiUrl(url);
  if (!normalizedUrl) {
    return [];
  }

  const keys = new Set();
  keys.add(minervaDetailKeyFromUrl(normalizedUrl));
  keys.add(normalizedUrl.toLowerCase());

  try {
    const parsed = new URL(normalizedUrl);
    const canonicalPath = String(parsed.pathname || "").replace(/^\/es\/wiki\//i, "/wiki/");
    if (canonicalPath) {
      keys.add(`${WIKI_BASE}${canonicalPath}`.toLowerCase());
      const decodedTitle = decodeURIComponent(canonicalPath)
        .replace(/^\/wiki\//i, "")
        .trim()
        .replace(/\s+/g, "_");
      if (decodedTitle) {
        keys.add(`${WIKI_BASE}/wiki/${decodedTitle}`.toLowerCase());
        keys.add(`${WIKI_BASE}/wiki/${encodeURIComponent(decodedTitle)}`.toLowerCase());
      }
    }
  } catch (error) {
    // Ignore malformed URLs and keep collected candidates.
  }

  return [...keys].filter(Boolean);
}

function stripWikiMarkup(value) {
  return String(value || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^{}]*\}\}/g, " ")
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, "$2")
    .replace(/\[\[(?:File|Image):[^\]]+\]\]/gi, " ")
    .replace(/^\s*[*#;:]+\s*/gm, "")
    .replace(/'''?/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractWikiSection(wikitext, sectionName) {
  if (!wikitext) {
    return "";
  }

  const pattern = new RegExp(`==\\s*${escapeRegExp(sectionName)}\\s*==([\\s\\S]*?)(?=\\n==[^=]|$)`, "i");
  const match = wikitext.match(pattern);
  return match?.[1]?.trim() || "";
}

function extractFirstWikiSection(wikitext, sectionNames = []) {
  for (const sectionName of sectionNames) {
    const section = extractWikiSection(wikitext, sectionName);
    if (section) {
      return section;
    }
  }
  return "";
}

function extractWikiBullets(sectionText) {
  return String(sectionText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[*#]/.test(line))
    .map((line) => stripWikiMarkup(line.replace(/^[*#]+\s*/, "")))
    .filter(Boolean);
}

function restartMinervaDetailAnimation(element, className, durationMs = 320) {
  if (!element || !className) {
    return;
  }

  element.classList.remove(className);
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    return;
  }

  void element.offsetWidth;
  element.classList.add(className);
  setTimeout(() => {
    element.classList.remove(className);
  }, durationMs);
}

function isLikelyPlanImage(fileName) {
  if (!fileName) {
    return false;
  }
  return /plan/i.test(fileName) && !/(icon|caps|gold|weight|notrade|wiki\.png)/i.test(fileName);
}

function parseInfoboxImageFile(wikitext, images = []) {
  const imageField = String(wikitext || "").match(/^\|\s*image\s*=\s*(.+)$/im)?.[1] || "";
  const extracted = imageField
    .replace(/\[\[(?:File|Image):([^|\]]+)(?:\|[^\]]*)?\]\]/i, "$1")
    .replace(/_/g, " ")
    .trim();
  if (extracted) {
    return extracted;
  }

  const candidates = Array.isArray(images) ? images : [];
  return candidates.find(isLikelyPlanImage) || candidates[0] || "";
}

async function fetchJsonWithFallback(url, timeoutMs = 22000) {
  const candidates = [url, proxied(url)];
  let lastError = new Error("Unable to fetch JSON.");

  for (const candidate of candidates) {
    try {
      const text = await fetchTextWithTimeout(candidate, timeoutMs);
      const normalized = text.replace(/^\uFEFF/, "");
      return JSON.parse(normalized);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function resolveWikiTitleForLanguage(title, lang) {
  const normalizedTitle = normalizeWikiTitle(title);
  if (!normalizedTitle || lang !== "es") {
    return normalizedTitle;
  }

  const langlinksUrl = `${WIKI_API_BY_LANG.en}?action=query&prop=langlinks&lllang=es&titles=${encodeURIComponent(normalizedTitle)}&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithFallback(langlinksUrl);
  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const pageWithLanglink = pages.find((entry) => Array.isArray(entry?.langlinks) && entry.langlinks.length);
  const localizedTitle = pageWithLanglink?.langlinks?.[0]?.title || "";
  return normalizeWikiTitle(localizedTitle) || normalizedTitle;
}

function parseGoogleTranslateText(payload) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return "";
  }

  return payload[0]
    .map((entry) => (Array.isArray(entry) ? entry[0] : ""))
    .join("")
    .trim();
}

async function translateText(text, sourceLang, targetLang) {
  const value = String(text || "").trim();
  if (!value || sourceLang === targetLang) {
    return value;
  }

  const cacheKey = `${sourceLang}:${targetLang}:${value}`;
  const cached = state.minervaDetail.translationCache[cacheKey];
  if (cached) {
    return cached;
  }

  const translateUrl = `${GOOGLE_TRANSLATE_BASE}?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(value)}`;
  try {
    const payload = await fetchJsonWithFallback(translateUrl, 18000);
    const translated = parseGoogleTranslateText(payload) || value;
    state.minervaDetail.translationCache[cacheKey] = translated;
    return translated;
  } catch (error) {
    state.minervaDetail.translationCache[cacheKey] = value;
    return value;
  }
}

async function resolveWikiImageUrl(fileName, lang = "en") {
  if (!fileName) {
    return "";
  }

  const title = /^file:/i.test(fileName) ? fileName : `File:${fileName}`;
  const apiUrl = `${wikiApiForLang(lang)}?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithFallback(apiUrl);
  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const page = pages.find((entry) => Array.isArray(entry?.imageinfo) && entry.imageinfo.length) || null;
  return page?.imageinfo?.[0]?.url || "";
}

function extractOtherSourcesFromLocations(sectionText) {
  const bulletSources = extractWikiBullets(sectionText)
    .map((line) => {
      const parts = line
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !/\bminerva\b/i.test(part));
      return sanitizeDetailText(parts.join(" ").trim());
    })
    .filter(Boolean);
  if (bulletSources.length) {
    return [...new Set(bulletSources)];
  }

  const fallbackLines = stripWikiMarkup(sectionText)
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/\bminerva\b/i.test(line) && !/^(locations?|ubicaciones?|lugares?)?:?$/i.test(line))
    .map((line) => sanitizeDetailText(line))
    .filter(Boolean);
  return [...new Set(fallbackLines)];
}

function sanitizeDetailText(value) {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }

  const categoryMatch = text.match(/\s(?:Category|Categor(?:i|\u00ED)a|Cat(?:e|\u00E9)gorie|Kategorie):/i);
  if (categoryMatch && typeof categoryMatch.index === "number" && categoryMatch.index > 0) {
    text = text.slice(0, categoryMatch.index).trim();
  }

  const i18nTailMatch = text.match(/\s(?:[a-z]{2,3}(?:-[a-z0-9]+)?):\s*(?:Plan|Plano|Sch(?:e|\u00E9)ma|\u0421\u0445\u0435\u043C\u0430)/i);
  if (i18nTailMatch && typeof i18nTailMatch.index === "number" && i18nTailMatch.index > 0) {
    text = text.slice(0, i18nTailMatch.index).trim();
  }

  return text.replace(/\s+/g, " ").trim();
}

function extractUnlocksSummary(sectionText) {
  const bullets = extractWikiBullets(sectionText);
  if (bullets.length) {
    return sanitizeDetailText(bullets.join(" "));
  }

  const summary = stripWikiMarkup(sectionText).replace(/^(?:unlocks?|desbloquea|desbloqueos?):?\s*/i, "").trim();
  return sanitizeDetailText(summary);
}

async function loadMinervaDetailFallback() {
  const embeddedPayload = typeof window !== "undefined" ? window.MINERVA_DETAIL_FALLBACK : null;
  if (embeddedPayload && typeof embeddedPayload === "object") {
    const embeddedByKey = embeddedPayload && typeof embeddedPayload.byKey === "object" && embeddedPayload.byKey
      ? embeddedPayload.byKey
      : {};
    if (typeof embeddedPayload?.defaultImageUrl === "string" && embeddedPayload.defaultImageUrl.trim()) {
      state.minervaDetail.fallbackImageUrl = embeddedPayload.defaultImageUrl.trim();
    }
    state.minervaDetail.fallbackByKey = embeddedByKey;
    prewarmMinervaDetailImages(embeddedByKey);
    return embeddedByKey;
  }

  if (state.minervaDetail.fallbackByKey) {
    return state.minervaDetail.fallbackByKey;
  }

  if (state.minervaDetail.fallbackPromise) {
    return state.minervaDetail.fallbackPromise;
  }

  state.minervaDetail.fallbackPromise = (async () => {
    try {
      const response = await fetch(MINERVA_DETAIL_FALLBACK_PATH, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load ${MINERVA_DETAIL_FALLBACK_PATH}: ${response.status}`);
      }

      const raw = await response.text();
      const payload = JSON.parse(String(raw || "").replace(/^\uFEFF/, ""));
      if (typeof payload?.defaultImageUrl === "string" && payload.defaultImageUrl.trim()) {
        state.minervaDetail.fallbackImageUrl = payload.defaultImageUrl.trim();
      }

      const byKey = payload && typeof payload.byKey === "object" && payload.byKey ? payload.byKey : {};
      state.minervaDetail.fallbackByKey = byKey;
      prewarmMinervaDetailImages(byKey);
      return byKey;
    } catch (error) {
      state.minervaDetail.fallbackByKey = {};
      prewarmMinervaDetailImages({});
      return state.minervaDetail.fallbackByKey;
    } finally {
      state.minervaDetail.fallbackPromise = null;
    }
  })();

  return state.minervaDetail.fallbackPromise;
}

function resolveOfflineMinervaDetailFromMap(item, lang = state.lang, byKey = state.minervaDetail.fallbackByKey) {
  if (!byKey || typeof byKey !== "object") {
    return null;
  }

  const normalizedUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
  if (!normalizedUrl) {
    return null;
  }

  const keyCandidates = minervaDetailKeyCandidatesFromUrl(normalizedUrl);
  const entry = keyCandidates
    .map((key) => byKey[key])
    .find((candidate) => candidate && typeof candidate === "object");
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const langKey = lang === "es" ? "es" : "en";
  const localized = entry[langKey] || entry.en || entry.es || {};
  const whereElse = Array.isArray(localized.whereElse)
    ? localized.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
    : [];
  const unlocks = sanitizeDetailText(localized.unlocks);

  const preferredWikiUrl = langKey === "es"
    ? (entry.wikiUrlEs || entry.wikiUrlEn || normalizedUrl)
    : (entry.wikiUrlEn || entry.wikiUrlEs || normalizedUrl);

  return {
    wikiUrl: normalizeWikiUrl(preferredWikiUrl),
    imageUrl: String(entry.imageUrl || state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE),
    whereElse,
    unlocks
  };
}

async function resolveOfflineMinervaDetail(item, lang = state.lang) {
  const byKey = await loadMinervaDetailFallback();
  return resolveOfflineMinervaDetailFromMap(item, lang, byKey);
}

function prewarmMinervaDetailCache(items = []) {
  const byKey = state.minervaDetail.fallbackByKey;
  if (!byKey || typeof byKey !== "object") {
    return;
  }

  prewarmMinervaDetailImages(byKey);

  for (const item of items) {
    const normalizedUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
    if (!normalizedUrl) {
      continue;
    }

    const detailKey = minervaDetailKeyFromUrl(normalizedUrl);
    for (const lang of ["en", "es"]) {
      const cacheKey = `${lang}:${detailKey}`;
      if (state.minervaDetail.cache[cacheKey]) {
        continue;
      }
      const detail = resolveOfflineMinervaDetailFromMap({ ...item, url: normalizedUrl }, lang, byKey);
      if (detail) {
        state.minervaDetail.cache[cacheKey] = detail;
        if (detail.imageUrl) {
          void queueImagePreload(detail.imageUrl);
        }
      }
    }
  }
}

async function fetchMinervaPlanDetail(item, requestedLang = state.lang) {
  const wikiUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
  const sourceTitle = wikiPageTitleFromUrl(wikiUrl);
  if (!wikiUrl || !sourceTitle) {
    throw new Error("Missing wiki URL.");
  }

  const targetLang = requestedLang === "es" ? "es" : "en";
  let resolvedTitle = sourceTitle;

  if (targetLang === "es") {
    try {
      resolvedTitle = await resolveWikiTitleForLanguage(sourceTitle, "es");
    } catch (error) {
      resolvedTitle = sourceTitle;
    }
  }

  const parseWikiPage = async (lang, title) => {
    const parseUrl = `${wikiApiForLang(lang)}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|images|displaytitle&format=json&formatversion=2&origin=*`;
    const data = await fetchJsonWithFallback(parseUrl);
    if (data?.error || !data?.parse) {
      throw new Error(data?.error?.info || "Missing wiki parse payload.");
    }
    return data;
  };

  let contentLang = targetLang;
  let parseData;
  try {
    parseData = await parseWikiPage(targetLang, resolvedTitle);
  } catch (error) {
    if (targetLang !== "es") {
      throw error;
    }
    parseData = await parseWikiPage("en", sourceTitle);
    contentLang = "en";
    resolvedTitle = sourceTitle;
  }

  const wikitext = String(parseData?.parse?.wikitext || "");
  const images = Array.isArray(parseData?.parse?.images) ? parseData.parse.images : [];

  const sectionTitles = DETAIL_SECTION_TITLES[contentLang] || DETAIL_SECTION_TITLES.en;
  const locationsSection = extractFirstWikiSection(wikitext, sectionTitles.locations);
  const unlocksSection = extractFirstWikiSection(wikitext, sectionTitles.unlocks);

  let whereElse = extractOtherSourcesFromLocations(locationsSection);
  let unlocks = extractUnlocksSummary(unlocksSection);

  if (targetLang === "es" && contentLang !== "es") {
    if (whereElse.length) {
      whereElse = await Promise.all(whereElse.map((line) => translateText(line, "en", "es")));
    }
    if (unlocks) {
      unlocks = await translateText(unlocks, "en", "es");
    }
  }

  const imageFile = parseInfoboxImageFile(wikitext, images);
  const imageUrl = imageFile ? await resolveWikiImageUrl(imageFile, contentLang) : "";
  const detailWikiUrl = buildWikiPageUrl(resolvedTitle, contentLang) || wikiUrl;

  return {
    wikiUrl: detailWikiUrl,
    imageUrl,
    whereElse,
    unlocks
  };
}

function syncMinervaSubviewVisibility() {
  const hasSubviewOpen = Boolean(state.minervaDetail.open || state.minervaLocation.open);
  if (elements.minervaPanel) {
    elements.minervaPanel.classList.toggle("is-detail-open", hasSubviewOpen);
  }
  if (elements.minervaDetailView) {
    elements.minervaDetailView.hidden = !state.minervaDetail.open;
  }
  if (elements.minervaLocationView) {
    elements.minervaLocationView.hidden = !state.minervaLocation.open;
  }
}

function setMinervaDetailOpen(active) {
  const nextOpen = Boolean(active);
  const wasOpen = state.minervaDetail.open;

  state.minervaDetail.open = nextOpen;
  if (nextOpen) {
    state.minervaLocation.open = false;
    state.minervaLocation.countdownTargetMs = null;
    state.minervaLocation.countdownMode = "";
    elements.minervaLocationView?.classList.remove("is-entering");
  }

  syncMinervaSubviewVisibility();

  if (elements.minervaDetailView) {
    if (nextOpen && !wasOpen) {
      restartMinervaDetailAnimation(elements.minervaDetailView, "is-entering", 360);
    }
    if (!nextOpen) {
      elements.minervaDetailView.classList.remove("is-entering");
      elements.minervaDetailStatus?.classList.remove("is-revealing");
      elements.minervaDetailContent?.classList.remove("is-revealing");
    }
  }
}

function setMinervaLocationOpen(active) {
  const nextOpen = Boolean(active);
  const wasOpen = state.minervaLocation.open;

  state.minervaLocation.open = nextOpen;
  if (nextOpen) {
    state.minervaDetail.open = false;
    elements.minervaDetailView?.classList.remove("is-entering");
    elements.minervaDetailStatus?.classList.remove("is-revealing");
    elements.minervaDetailContent?.classList.remove("is-revealing");
  }

  syncMinervaSubviewVisibility();

  if (elements.minervaLocationView) {
    if (nextOpen && !wasOpen) {
      restartMinervaDetailAnimation(elements.minervaLocationView, "is-entering", 360);
    }
    if (!nextOpen) {
      elements.minervaLocationView.classList.remove("is-entering");
      state.minervaLocation.countdownTargetMs = null;
      state.minervaLocation.countdownMode = "";
    }
  }
}

function openMinervaLocationView() {
  setMinervaLocationOpen(true);
  renderMinervaLocationView();
}

function closeMinervaLocationView() {
  setMinervaLocationOpen(false);
}

function renderMinervaDetailView() {
  if (!elements.minervaDetailView) {
    return;
  }

  if (!state.minervaDetail.open || !state.minervaDetail.item) {
    setMinervaDetailOpen(false);
    return;
  }

  setMinervaDetailOpen(true);

  const item = state.minervaDetail.item;
  const detail = state.minervaDetail.data;
  const wikiUrl = normalizeWikiUrl(detail?.wikiUrl || item.url || item.WikiUrl || "");

  elements.minervaDetailName.textContent = item.name || item.Name || "--";
  elements.minervaDetailWikiLink.textContent = t("minerva_detail_open_source");
  elements.minervaDetailWikiLink.href = wikiUrl || "#";
  elements.minervaDetailWikiLink.hidden = !wikiUrl;

  if (state.minervaDetail.loading) {
    const shouldAnimateStatus = elements.minervaDetailStatus.hidden;
    elements.minervaDetailStatus.hidden = false;
    elements.minervaDetailStatus.textContent = t("minerva_detail_loading");
    elements.minervaDetailContent.classList.remove("is-revealing");
    elements.minervaDetailContent.hidden = true;
    if (shouldAnimateStatus) {
      restartMinervaDetailAnimation(elements.minervaDetailStatus, "is-revealing", 220);
    }
    return;
  }

  if (state.minervaDetail.error || !detail) {
    const shouldAnimateStatus = elements.minervaDetailStatus.hidden;
    elements.minervaDetailStatus.hidden = false;
    elements.minervaDetailStatus.textContent = state.minervaDetail.error || t("minerva_detail_error");
    elements.minervaDetailContent.classList.remove("is-revealing");
    elements.minervaDetailContent.hidden = true;
    if (shouldAnimateStatus) {
      restartMinervaDetailAnimation(elements.minervaDetailStatus, "is-revealing", 220);
    }
    return;
  }

  const shouldAnimateContent = elements.minervaDetailContent.hidden;
  elements.minervaDetailStatus.hidden = true;
  elements.minervaDetailStatus.classList.remove("is-revealing");
  elements.minervaDetailContent.hidden = false;

  const fallbackImageUrl = state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE;
  const detailImageUrl = detail.imageUrl || fallbackImageUrl;

  if (detailImageUrl) {
    void queueImagePreload(detailImageUrl, { highPriority: true });
    elements.minervaDetailImage.hidden = false;
    elements.minervaDetailImage.dataset.fallbackSrc = fallbackImageUrl || detailImageUrl;
    elements.minervaDetailImage.src = detailImageUrl;
    elements.minervaDetailImage.alt = `${item.name || item.Name} image`;
  } else {
    elements.minervaDetailImage.hidden = true;
    elements.minervaDetailImage.removeAttribute("data-fallback-src");
    elements.minervaDetailImage.removeAttribute("src");
    elements.minervaDetailImage.alt = "";
  }

  const whereElse = Array.isArray(detail.whereElse) && detail.whereElse.length
    ? detail.whereElse
    : [t("minerva_detail_no_other_sources")];
  const whereFragment = document.createDocumentFragment();
  for (const sourceLine of whereElse) {
    const li = document.createElement("li");
    li.textContent = sourceLine;
    whereFragment.appendChild(li);
  }
  elements.minervaDetailWhereList.innerHTML = "";
  elements.minervaDetailWhereList.appendChild(whereFragment);

  elements.minervaDetailUnlocks.textContent = detail.unlocks || t("minerva_detail_no_unlocks");
  if (shouldAnimateContent) {
    restartMinervaDetailAnimation(elements.minervaDetailContent, "is-revealing", 320);
  }
}

function closeMinervaDetail() {
  state.minervaDetail.requestId += 1;
  state.minervaDetail.loading = false;
  state.minervaDetail.error = "";
  state.minervaDetail.item = null;
  state.minervaDetail.data = null;
  setMinervaDetailOpen(false);
}

async function openMinervaDetail(item) {
  const normalizedUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
  if (!normalizedUrl) {
    return;
  }

  const detailKey = minervaDetailKeyFromUrl(normalizedUrl);
  const cacheKey = `${state.lang}:${detailKey}`;
  const requestId = state.minervaDetail.requestId + 1;
  state.minervaDetail.requestId = requestId;
  state.minervaDetail.error = "";
  state.minervaDetail.item = { ...item, url: normalizedUrl };
  setMinervaDetailOpen(true);

  const cachedDetail = state.minervaDetail.cache[cacheKey];
  if (cachedDetail) {
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }
    state.minervaDetail.loading = false;
    state.minervaDetail.data = cachedDetail;
    renderMinervaDetailView();
    return;
  }

  const immediateOffline = resolveOfflineMinervaDetailFromMap({ ...item, url: normalizedUrl }, state.lang);
  if (immediateOffline) {
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }
    state.minervaDetail.loading = false;
    state.minervaDetail.data = immediateOffline;
    state.minervaDetail.cache[cacheKey] = immediateOffline;
    renderMinervaDetailView();
    return;
  }

  state.minervaDetail.loading = true;
  state.minervaDetail.data = null;
  renderMinervaDetailView();

  let offlineDetail = null;
  try {
    offlineDetail = await resolveOfflineMinervaDetail({ ...item, url: normalizedUrl }, state.lang);
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }
    if (offlineDetail) {
      state.minervaDetail.loading = false;
      state.minervaDetail.error = "";
      state.minervaDetail.data = offlineDetail;
      state.minervaDetail.cache[cacheKey] = offlineDetail;
      renderMinervaDetailView();
      return;
    }
  } catch (error) {
    // Continue with online fallback.
  }

  try {
    const liveDetail = await fetchMinervaPlanDetail({ ...item, url: normalizedUrl }, state.lang);
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }

    const normalizedLive = {
      wikiUrl: normalizeWikiUrl(liveDetail?.wikiUrl || normalizedUrl),
      imageUrl: liveDetail?.imageUrl || state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE,
      whereElse: Array.isArray(liveDetail?.whereElse)
        ? liveDetail.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
        : [],
      unlocks: sanitizeDetailText(liveDetail?.unlocks || "")
    };

    state.minervaDetail.loading = false;
    state.minervaDetail.error = "";
    state.minervaDetail.data = normalizedLive;
    state.minervaDetail.cache[cacheKey] = normalizedLive;
    renderMinervaDetailView();
    return;
  } catch (error) {
    // Fall through to final error.
  }

  if (state.minervaDetail.requestId !== requestId) {
    return;
  }
  state.minervaDetail.loading = false;
  state.minervaDetail.error = t("minerva_detail_error");
  renderMinervaDetailView();
}

function normalizeLocation(raw) {
  const value = String(raw || "").toLowerCase();
  if (value.includes("foundation")) return "Foundation";
  if (value.includes("crater")) return "Crater";
  if (value.includes("fort atlas")) return "Fort Atlas";
  if (value.includes("whitespring")) return "The Whitespring";
  return "--";
}

function localizeLocation(location) {
  if (!location || location === "--") {
    return "--";
  }
  return location;
}

function inferLocationFromMapImage(imagePath) {
  const value = String(imagePath || "").toLowerCase();
  if (!value) {
    return "--";
  }

  for (const hint of MINERVA_LOCATION_IMAGE_HINTS) {
    if (value.includes(hint.token)) {
      return hint.location;
    }
  }

  return "--";
}

async function loadMinervaLists() {
  if (Array.isArray(state.minervaLists) && state.minervaLists.length) {
    return state.minervaLists;
  }

  if (Array.isArray(window.MINERVA_LISTS) && window.MINERVA_LISTS.length) {
    state.minervaLists = window.MINERVA_LISTS;
    return state.minervaLists;
  }

  try {
    const response = await fetch("data/minerva-lists.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load data/minerva-lists.json: ${response.status}`);
    }

    const data = await response.json();
    state.minervaLists = Array.isArray(data) ? data : [];
    return state.minervaLists;
  } catch (error) {
    state.minervaLists = [];
    return state.minervaLists;
  }
}

function inferListNumber(items, lists) {
  if (!items.length || !lists.length) {
    return null;
  }

  const itemNames = new Set(items.map((item) => normalizePlanName(item.name)));
  let bestScore = 0;
  let bestListNumber = null;

  for (const list of lists) {
    const inventory = Array.isArray(list.Inventory) ? list.Inventory : [];
    const score = inventory.reduce((sum, entry) => {
      return sum + (itemNames.has(normalizePlanName(entry.Name)) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestListNumber = Number(list.ListNumber);
    }
  }

  const threshold = Math.min(3, itemNames.size);
  return bestScore >= threshold ? bestListNumber : null;
}

function parseMinervaInfoApiDateAt18(dateValue) {
  const normalized = String(dateValue || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const [year, month, day] = normalized.split("-").map((part) => Number(part));
  return buildEasternDate(year, month, day, 12, 0);
}

function normalizeMinervaInfoImagePath(fileName) {
  const cleaned = String(fileName || "").trim();
  if (!cleaned) {
    return "";
  }
  return `${MINERVA_INFO_LOCAL_IMAGE_BASE}/${cleaned}`;
}

function parseMinervaInfoApi(payload, lists = []) {
  const itemsRaw = Array.isArray(payload?.data?.items) ? payload.data.items : [];
  if (!itemsRaw.length) {
    return null;
  }

  const firstItem = itemsRaw[0];
  const location = normalizeLocation(firstItem?.location_name || "");
  const eventStart = parseMinervaInfoApiDateAt18(firstItem?.date_start);
  const eventEnd = parseMinervaInfoApiDateAt18(firstItem?.date_end);
  const now = new Date();
  const active = Boolean(eventStart && eventEnd && now >= eventStart && now <= eventEnd);
  const locationMapImage = normalizeMinervaInfoImagePath(firstItem?.location_img)
    || MINERVA_LOCATION_MAP_BY_LOCATION[location]
    || "";

  const items = itemsRaw.map((item) => {
    const price = Number(item?.gold);
    return {
      name: String(item?.item || "").trim() || "--",
      price: Number.isFinite(price) ? price : null,
      url: normalizeWikiUrl(item?.wiki_url || "")
    };
  }).filter((item) => item.name && item.name !== "--");

  let listNumber = Number(firstItem?.id_list);
  if (!Number.isFinite(listNumber) || listNumber < 1) {
    listNumber = inferListNumber(items, lists);
  }

  return {
    location,
    listNumber,
    active,
    nextChange: null,
    eventStart,
    eventEnd,
    items,
    mode: "live_info",
    locationMapImage
  };
}

async function fetchMinervaInfoData(lists = []) {
  const dateValue = new Date().toISOString().slice(0, 10);
  const bodyParams = new URLSearchParams({
    accion: "getLista",
    fecha: dateValue
  });

  const directUrl = SOURCE_URLS.minervaInfoApi[0];
  const candidates = [
    {
      url: directUrl,
      options: {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: bodyParams.toString()
      }
    },
    {
      url: proxied(directUrl),
      options: {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: bodyParams.toString()
      }
    }
  ];

  for (const candidate of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(candidate.url, {
        ...candidate.options,
        signal: controller.signal
      });
      if (!response.ok) {
        continue;
      }
      const text = await response.text();
      const parsed = JSON.parse(String(text || "").replace(/^\uFEFF/, ""));
      const data = parseMinervaInfoApi(parsed, lists);
      if (data) {
        return data;
      }
    } catch (error) {
      // continue with fallback candidate
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

function parseMinervaLive(text, lists) {
  const statusLine = text.match(/She is[^\n]+/i)?.[0]?.trim() || "";
  const locationRaw = statusLine.match(/(Foundation|Crater|Fort Atlas|(?:The\s+)?Whitespring)/i)?.[1] || "";
  const location = normalizeLocation(locationRaw);
  const isActive = statusLine ? !/not available/i.test(statusLine) : false;

  const nextChange = text.match(/At\s+([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9:]{1,5}\s*[AP]M)\s+Bethesda Time/i)?.[1] || null;

  const itemRegex = /\[!\[Image\s+\d+\]\([^)]+\)\s+([^!\n]+?)\s+!\[Image\s+\d+\]\([^)]+\)\s+(\d{2,5})\]\((https?:\/\/[^)\s]+)\)/gi;
  const seen = new Set();
  const items = [];
  let match;

  while ((match = itemRegex.exec(text)) !== null) {
    let name = match[1].trim();
    if (!/^Plan:\s*/i.test(name)) {
      name = `Plan: ${name}`;
    }

    const price = Number(match[2]);
    const url = match[3];
    const key = `${name}|${price}`;

    if (!seen.has(key)) {
      seen.add(key);
      items.push({ name, price, url });
    }
  }

  const listNumber = inferListNumber(items, lists);

  return {
    location,
    listNumber,
    active: isActive,
    nextChange,
    eventStart: null,
    eventEnd: null,
    items,
    mode: "live",
    locationMapImage: MINERVA_LOCATION_MAP_BY_LOCATION[location] || ""
  };
}

function mod(value, base) {
  return ((value % base) + base) % base;
}

function buildFallbackCycleDate(weekNumber, dayOffset = 0) {
  const shifted = new Date(FALLBACK_MINERVA_ANCHOR_DATE_UTC);
  shifted.setUTCDate(shifted.getUTCDate() + weekNumber * 7 + dayOffset);
  return buildEasternDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    12,
    0
  );
}

function resolveFallbackWeekNumber(now = new Date()) {
  const anchorStart = buildFallbackCycleDate(0);
  let weekNumber = Math.floor((now.getTime() - anchorStart.getTime()) / MS_WEEK);

  while (now < buildFallbackCycleDate(weekNumber)) {
    weekNumber -= 1;
  }
  while (now >= buildFallbackCycleDate(weekNumber + 1)) {
    weekNumber += 1;
  }

  return weekNumber;
}

function cycleForWeek(weekNumber) {
  const cycleIndex = mod(weekNumber, CYCLE_WEEKS);
  const listNumber = cycleIndex + 1;
  const phase = cycleIndex % 4;
  const location = CYCLE_LOCATIONS[phase];

  const weekStart = buildFallbackCycleDate(weekNumber);
  let eventStart = weekStart;
  let eventEnd;

  if (phase === 3) {
    eventStart = buildFallbackCycleDate(weekNumber, 3);
    eventEnd = buildFallbackCycleDate(weekNumber, 7);
  } else {
    eventEnd = buildFallbackCycleDate(weekNumber, 2);
  }

  return {
    listNumber,
    location,
    eventStart,
    eventEnd
  };
}

function buildFallbackMinerva(lists) {
  const now = new Date();
  const currentWeek = resolveFallbackWeekNumber(now);

  let cycle = cycleForWeek(currentWeek);
  const isActive = now >= cycle.eventStart && now < cycle.eventEnd;

  if (!isActive && now >= cycle.eventEnd) {
    cycle = cycleForWeek(currentWeek + 1);
  }

  const listData = lists.find((entry) => Number(entry.ListNumber) === cycle.listNumber);
  const inventory = Array.isArray(listData?.Inventory) ? listData.Inventory : [];

  const items = inventory.map((item) => ({
    name: item.Name,
    price: Number(item.Price),
    url: item.WikiUrl ? `${WIKI_BASE}${item.WikiUrl}` : null
  }));

  return {
    location: cycle.location,
    listNumber: cycle.listNumber,
    active: isActive,
    nextChange: null,
    eventStart: cycle.eventStart,
    eventEnd: cycle.eventEnd,
    items,
    mode: "fallback",
    locationMapImage: MINERVA_LOCATION_MAP_BY_LOCATION[cycle.location] || ""
  };
}

function renderMinervaFromState() {
  elements.minervaSummary.classList.remove("error");

  if (state.minerva.error) {
    elements.minervaSummary.textContent = t("minerva_error_summary");
    elements.minervaSummary.classList.add("error");
    elements.minervaItems.innerHTML = `<tr><td colspan="2" class="error">${t("minerva_error_items")}</td></tr>`;
    elements.minervaLocation.textContent = "--";
    elements.minervaList.textContent = "--";
    elements.minervaWindow.textContent = "--";
    if (state.minervaLocation.open) {
      renderMinervaLocationView();
    }
    if (state.minervaDetail.open) {
      renderMinervaDetailView();
    }
    return;
  }

  if (!state.minerva.data) {
    elements.minervaSummary.textContent = t("minerva_scanning");
    elements.minervaItems.innerHTML = `<tr><td colspan="2">${t("minerva_awaiting")}</td></tr>`;
    elements.minervaLocation.textContent = "--";
    elements.minervaList.textContent = "--";
    elements.minervaWindow.textContent = "--";
    if (state.minervaLocation.open) {
      renderMinervaLocationView();
    }
    if (state.minervaDetail.open) {
      renderMinervaDetailView();
    }
    return;
  }

  const data = state.minerva.data;
  const locationText = localizeLocation(data.location || "--");
  const summaryText = data.active
    ? t("minerva_active_at", { location: locationText })
    : t("minerva_transit_to", { location: locationText });

  elements.minervaSummary.textContent = summaryText;
  elements.minervaLocation.textContent = locationText;
  elements.minervaList.textContent = data.listNumber
    ? t("list_value", { n: String(data.listNumber).padStart(2, "0") })
    : "--";

  elements.minervaWindow.textContent = formatMinervaWindowStatus(data);

  if (!Array.isArray(data.items) || !data.items.length) {
    elements.minervaItems.innerHTML = `<tr><td colspan="2" class="error">${t("minerva_no_items")}</td></tr>`;
    if (state.minervaLocation.open) {
      renderMinervaLocationView();
    }
    if (state.minervaDetail.open) {
      renderMinervaDetailView();
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  const rows = [];
  for (const item of data.items) {
    const itemName = item.name || item.Name || "--";
    const itemUrl = normalizeWikiUrl(item.url || item.WikiUrl || "");

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    if (isPlanOrPlanoItem(itemName)) {
      nameCell.appendChild(createIconTag(PLAN_ITEM_GLYPH));
    }

    if (itemUrl) {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "minerva-item-trigger";
      trigger.textContent = itemName;
      trigger.addEventListener("click", () => {
        void openMinervaDetail({
          name: itemName,
          url: itemUrl,
          price: item.price
        });
      });
      nameCell.appendChild(trigger);

      const link = document.createElement("a");
      link.className = "minerva-item-external";
      link.href = itemUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "\u2197";
      link.title = t("minerva_detail_open_source");
      link.setAttribute("aria-label", t("minerva_detail_open_source"));
      nameCell.appendChild(link);
    } else {
      nameCell.append(itemName);
    }

    const priceCell = document.createElement("td");
    const priceValue = Number(item.price);
    const priceText = Number.isFinite(priceValue) ? priceValue.toLocaleString() : "--";
    priceCell.appendChild(createIconTag(GOLD_BULLION_GLYPH));
    priceCell.append(priceText);

    row.appendChild(nameCell);
    row.appendChild(priceCell);
    fragment.appendChild(row);
    rows.push(row);
  }

  elements.minervaItems.innerHTML = "";
  elements.minervaItems.appendChild(fragment);
  prewarmMinervaDetailCache(data.items);
  applyStaggeredReveal(rows, 22, 24);
  if (state.minervaLocation.open) {
    renderMinervaLocationView();
  }
  if (state.minervaDetail.open) {
    renderMinervaDetailView();
  }
}

async function refreshMinervaPanel() {
  const lists = await loadMinervaLists();

  const liveInfoData = await fetchMinervaInfoData(lists);
  if (liveInfoData) {
    state.minerva = {
      error: false,
      data: liveInfoData
    };
    renderMinervaFromState();
    return { ok: true, source: "live" };
  }

  if (lists.length) {
    const fallbackData = buildFallbackMinerva(lists);
    state.minerva = {
      error: false,
      data: fallbackData
    };
    renderMinervaFromState();
    return { ok: true, source: "fallback" };
  }

  state.minerva = {
    error: true,
    data: null
  };
  renderMinervaFromState();
  return { ok: false, source: "none" };
}

function applyLanguage(lang, persist = true) {
  state.lang = lang === "es" ? "es" : "en";
  document.documentElement.lang = state.lang;
  document.title = t("title_doc");

  elements.bootTitle.textContent = t("boot_title");
  elements.bootSubtitle.textContent = t("boot_subtitle");
  elements.bootLine1.textContent = t("boot_line_1");
  elements.bootLine2.textContent = t("boot_line_2");
  elements.bootLine3.textContent = t("boot_line_3");
  elements.bootReady.textContent = t("boot_ready");
  elements.bootHint.textContent = t("boot_hint_initializing");
  elements.syncTitle.textContent = t("sync_title");
  elements.classifiedLoadTitle.textContent = t("classified_loading_title");
  elements.hackTitle.textContent = t("hack_title");
  elements.hackSubtitle.textContent = t("hack_subtitle");
  elements.hackAttemptsLabel.textContent = t("hack_attempts_label");
  elements.hackAbortBtn.textContent = t("hack_abort");
  elements.hackRetryBtn.textContent = t("hack_retry");
  elements.hackOpenClassifiedBtn.textContent = t("hack_open_files");

  elements.microText.textContent = t("micro_text");
  if (elements.tabStatusText) {
    elements.tabStatusText.textContent = t("tab_status");
  } else {
    elements.tabStatus.textContent = t("tab_status");
  }
  elements.tabIntel.textContent = t("tab_intel");
  elements.tabData.textContent = t("tab_data");
  if (elements.discordBotInviteLabel) {
    elements.discordBotInviteLabel.textContent = t("discord_bot_invite_label");
  }
  if (elements.discordBotInviteHint) {
    elements.discordBotInviteHint.textContent = t("discord_bot_invite_hint");
  }
  if (elements.discordBotInviteBtn) {
    elements.discordBotInviteBtn.removeAttribute("title");
    elements.discordBotInviteBtn.setAttribute("aria-label", t("discord_bot_invite_title"));
  }
  if (elements.intelBotInviteBadge) {
    elements.intelBotInviteBadge.textContent = t("discord_bot_modal_badge");
  }
  if (elements.intelBotInviteTitle) {
    elements.intelBotInviteTitle.textContent = t("discord_bot_modal_title");
  }
  if (elements.intelBotInviteBody) {
    elements.intelBotInviteBody.textContent = t("discord_bot_modal_body");
  }
  if (elements.intelBotInviteCancelBtn) {
    elements.intelBotInviteCancelBtn.textContent = t("discord_bot_modal_cancel");
  }
  if (elements.intelBotInviteConfirmBtn) {
    elements.intelBotInviteConfirmBtn.textContent = t("discord_bot_modal_confirm");
  }
  elements.langLabel.textContent = t("lang_label");
  renderFilesDecisionTabBadge();
  renderIntelBotInviteModal();

  elements.labelUtc.textContent = t("label_utc");
  elements.labelLastSync.textContent = t("label_last_sync");
  elements.labelDataLink.textContent = t("label_data_link");
  elements.refreshBtn.textContent = t("refresh_button");

  elements.siloTitle.textContent = t("silo_title");
  elements.siloHint.textContent = t("silo_hint");
  elements.siloSourcePrefix.textContent = t("silo_source_prefix");
  elements.siloSourceSuffix.textContent = t("silo_source_suffix");
  if (elements.siloDossierOverlay) {
    if (state.siloDossier.open) {
      renderSiloDossier();
    } else {
      elements.siloDossierEyebrow.textContent = t("silo_dossier_eyebrow");
      elements.siloDossierTitle.textContent = t("silo_dossier_title");
      elements.siloDossierSummary.textContent = t("silo_dossier_loading");
      elements.siloDossierSourceLink.textContent = t("silo_dossier_open_source");
      elements.siloDossierCloseBtn.textContent = t("silo_dossier_close");
      elements.siloDossierResetLabel.textContent = t("silo_dossier_reset_label");
      elements.siloDossierCountdownLabel.textContent = t("silo_dossier_countdown_label");
      elements.siloDossierStatusLabel.textContent = t("silo_dossier_status_label");
      elements.siloDossierSignalLabel.textContent = t("silo_dossier_signal_label");
      elements.siloDossierBackBtn.textContent = t("silo_dossier_back");
    }
  } else {
    state.siloDossier.open = false;
  }

  elements.minervaTitle.textContent = t("minerva_title");
  elements.minervaLocationLabel.textContent = t("minerva_location_label");
  elements.minervaListLabel.textContent = t("minerva_list_label");
  elements.minervaWindowLabel.textContent = t("minerva_window_label");
  elements.minervaInventoryTitle.textContent = t("minerva_inventory_title");
  elements.tableItemHeader.textContent = t("table_item_header");
  elements.tablePriceHeader.textContent = t("table_price_header");
  elements.minervaSourcePrefix.textContent = t("minerva_source_prefix");
  elements.minervaSourceSuffix.textContent = t("minerva_source_suffix");
  elements.minervaLocationTitle.textContent = t("minerva_location_view_title");
  elements.minervaLocationBackBtn.textContent = t("minerva_location_view_back");
  elements.minervaLocationMapLabel.textContent = t("minerva_location_map_label");
  elements.minervaLocationMapPrevBtn?.setAttribute("aria-label", t("minerva_location_map_prev"));
  elements.minervaLocationMapNextBtn?.setAttribute("aria-label", t("minerva_location_map_next"));
  elements.minervaLocationArrivesLabel.textContent = t("minerva_location_arrives");
  elements.minervaLocationLeavesLabel.textContent = t("minerva_location_leaves");
  elements.minervaDetailBackBtn.textContent = t("minerva_detail_back");
  elements.minervaDetailWikiLink.textContent = t("minerva_detail_open_source");
  elements.minervaDetailWhereLabel.textContent = t("minerva_detail_where_label");
  elements.minervaDetailUnlocksLabel.textContent = t("minerva_detail_unlocks_label");
  if (!state.minervaLocation.open) {
    elements.minervaLocationStatus.textContent = t("minerva_location_status_unknown");
    elements.minervaLocationArrives.textContent = "--";
    elements.minervaLocationLeaves.textContent = "--";
    elements.minervaLocationCountdownLabel.textContent = t("minerva_location_countdown_arrives");
    elements.minervaLocationCountdown.textContent = "--";
  }
  if (elements.minervaDetailStatus && !state.minervaDetail.open) {
    elements.minervaDetailStatus.textContent = t("minerva_detail_loading");
  }
  elements.classifiedTitle.textContent = t("classified_title");
  elements.classifiedWarning.textContent = t("classified_warning");
  elements.classifiedBackBtn.textContent = t("classified_back");
  elements.classifiedCard1Title.textContent = t("classified_card1_title");
  elements.classifiedCard1Body.textContent = t("classified_card1_body");
  elements.classifiedCard2Title.textContent = t("classified_card2_title");
  elements.classifiedCard2Body.textContent = t("classified_card2_body");
  elements.classifiedCard3Title.textContent = t("classified_card3_title");
  elements.classifiedCard3Body.textContent = t("classified_card3_body");
  elements.classifiedMinervaTitle.textContent = t("classified_minerva_title");
  elements.classifiedMinervaHint.textContent = t("classified_minerva_hint");
  elements.classifiedSearchLabel.textContent = t("classified_search_label");
  elements.classifiedSearchInput.placeholder = t("classified_search_placeholder");
  elements.classifiedSearchHint.textContent = t("classified_search_hint");
  setClassifiedSearchOpen(state.classifiedSearch.open);
  if (elements.classifiedInlineStatus && !state.classifiedDetail.open) {
    elements.classifiedInlineStatus.textContent = t("minerva_detail_loading");
  }

  elements.filesUnauthorizedTitle.textContent = t("files_unauthorized_title");
  elements.filesUnauthorizedSubtitle.textContent = t("files_unauthorized_subtitle");
  elements.filesUnauthorizedBadge.textContent = t("files_unauthorized_badge");
  elements.filesUnauthorizedKicker.textContent = t("files_unauthorized_kicker");
  elements.filesUnauthorizedStateLabel.textContent = t("files_unauthorized_state_label");
  elements.filesUnauthorizedStateValue.textContent = t("files_unauthorized_state_value");
  elements.filesUnauthorizedGateLabel.textContent = t("files_unauthorized_gate_label");
  elements.filesUnauthorizedGateValue.textContent = t("files_unauthorized_gate_value");
  elements.filesUnauthorizedTraceLabel.textContent = t("files_unauthorized_trace_label");
  elements.filesUnauthorizedTraceValue.textContent = t("files_unauthorized_trace_value");
  elements.filesUnauthorizedDirectiveTitle.textContent = t("files_unauthorized_directive_title");
  elements.filesUnauthorizedDirectiveLine1.textContent = t("files_unauthorized_directive_line_1");
  elements.filesUnauthorizedDirectiveLine2.textContent = t("files_unauthorized_directive_line_2");
  elements.filesUnauthorizedDirectiveLine3.textContent = t("files_unauthorized_directive_line_3");
  elements.filesRestrictedBadge.textContent = t("files_restricted_badge");
  elements.filesRestrictedIncident.textContent = t("files_restricted_incident", { code: "FR-000000" });
  elements.filesRestrictedTitle.textContent = t("files_restricted_title");
  elements.filesRestrictedSubtitle.textContent = t("files_restricted_subtitle");
  elements.filesRestrictedIdentityLabel.textContent = t("files_restricted_identity_label");
  elements.filesRestrictedDiscordLabel.textContent = t("files_restricted_discord_label");
  elements.filesRestrictedClearanceLabel.textContent = t("files_restricted_clearance_label");
  elements.filesRestrictedStatusLabel.textContent = t("files_restricted_status_label");
  elements.filesRestrictedTimeLabel.textContent = t("files_restricted_time_label");
  elements.filesRestrictedIdentityValue.textContent = t("files_unknown_value");
  elements.filesRestrictedDiscordValue.textContent = t("files_unknown_value");
  elements.filesRestrictedClearanceValue.textContent = t("files_session_clearance_unauthorized");
  elements.filesRestrictedStatusValue.textContent = getFilesAccessRequestStatusLabel(state.files.me?.accessRequestStatus || "none");
  elements.filesRestrictedTimeValue.textContent = t("files_unknown_value");
  elements.filesRestrictedDirectiveTitle.textContent = t("files_restricted_directive_title");
  elements.filesRestrictedDirectiveLine1.textContent = t("files_restricted_directive_line_1");
  elements.filesRestrictedDirectiveLine2.textContent = t("files_restricted_directive_line_2");
  elements.filesRestrictedDirectiveLine3.textContent = t("files_restricted_directive_line_3");
  elements.filesRestrictedReasonLabel.textContent = t("files_restricted_reason_label");
  elements.filesRestrictedReasonInput.placeholder = t("files_restricted_reason_placeholder");
  elements.filesRestrictedReasonHint.textContent = t("files_restricted_reason_hint");
  elements.filesRestrictedRetryBtn.textContent = t("files_restricted_retry_button");
  elements.filesRestrictedLogoutBtn.textContent = t("files_logout_button");
  elements.filesDeniedBadge.textContent = t("files_denied_badge");
  elements.filesDeniedTitle.textContent = t("files_denied_title");
  elements.filesDeniedSubtitle.textContent = t("files_denied_subtitle");
  if (elements.filesDeniedReasonLabel) {
    elements.filesDeniedReasonLabel.textContent = t("files_denied_reason_label");
  }
  if (elements.filesDeniedReasonValue) {
    elements.filesDeniedReasonValue.textContent = t("files_unknown_value");
  }
  elements.filesDeniedStatusLabel.textContent = t("files_denied_status_label");
  elements.filesDeniedStatusValue.textContent = t("files_denied_status_value");
  elements.filesDeniedNextWindowLabel.textContent = t("files_denied_next_window_label");
  elements.filesDeniedNextWindowValue.textContent = t("files_unknown_value");
  elements.filesDeniedCountdownLabel.textContent = t("files_denied_countdown_label");
  elements.filesDeniedCountdownValue.textContent = t("files_unknown_value");
  elements.filesDeniedDirectiveTitle.textContent = t("files_denied_directive_title");
  elements.filesDeniedDirectiveLine1.textContent = t("files_denied_directive_line_1");
  elements.filesDeniedDirectiveLine2.textContent = t("files_denied_directive_line_2");
  elements.filesDeniedDirectiveLine3.textContent = t("files_denied_directive_line_3");
  if (elements.filesDeniedDirectiveLine4) {
    elements.filesDeniedDirectiveLine4.textContent = t("files_denied_directive_line_4");
  }
  elements.filesDeniedLogoutBtn.textContent = t("files_logout_button");
  if (elements.filesDisclaimerGateBadge) {
    elements.filesDisclaimerGateBadge.textContent = t("files_disclaimer_gate_badge");
  }
  if (elements.filesDisclaimerGateTitle) {
    elements.filesDisclaimerGateTitle.textContent = t("files_disclaimer_gate_title");
  }
  if (elements.filesDisclaimerGateIntro) {
    elements.filesDisclaimerGateIntro.textContent = t("files_disclaimer_gate_intro");
  }
  if (elements.filesDisclaimerGateBody1) {
    elements.filesDisclaimerGateBody1.textContent = t("files_disclaimer_modal_body_1");
  }
  if (elements.filesDisclaimerGateBody2) {
    elements.filesDisclaimerGateBody2.textContent = t("files_disclaimer_modal_body_2");
  }
  if (elements.filesDisclaimerAgreeBtn) {
    elements.filesDisclaimerAgreeBtn.textContent = t("files_disclaimer_gate_agree_button");
  }
  if (elements.filesDisclaimerDeclineBtn) {
    elements.filesDisclaimerDeclineBtn.textContent = t("files_disclaimer_gate_decline_button");
  }
  if (elements.filesDisclaimerDeclinedTitle) {
    elements.filesDisclaimerDeclinedTitle.textContent = t("files_disclaimer_gate_declined_title");
  }
  if (elements.filesDisclaimerDeclinedMessage) {
    elements.filesDisclaimerDeclinedMessage.textContent = t("files_disclaimer_gate_declined_message");
  }
  if (elements.filesDisclaimerContactBtn) {
    elements.filesDisclaimerContactBtn.textContent = t("files_disclaimer_gate_contact_button");
  }
  if (elements.filesDisclaimerContactTitle) {
    elements.filesDisclaimerContactTitle.textContent = t("files_disclaimer_gate_contact_title");
  }
  if (elements.filesDisclaimerContactHint) {
    elements.filesDisclaimerContactHint.textContent = t("files_disclaimer_gate_contact_hint");
  }
  if (elements.filesDisclaimerContactLabel) {
    elements.filesDisclaimerContactLabel.textContent = t("files_disclaimer_gate_contact_label");
  }
  if (elements.filesDisclaimerContactInput) {
    elements.filesDisclaimerContactInput.placeholder = t("files_disclaimer_gate_contact_placeholder");
  }
  if (elements.filesDisclaimerContactCancelBtn) {
    elements.filesDisclaimerContactCancelBtn.textContent = t("files_disclaimer_gate_contact_cancel_button");
  }
  if (elements.filesDisclaimerContactSendBtn) {
    elements.filesDisclaimerContactSendBtn.textContent = t("files_disclaimer_gate_contact_send_button");
  }
  if (elements.filesDisclaimerAcceptLoaderText) {
    elements.filesDisclaimerAcceptLoaderText.textContent = t("files_disclaimer_gate_accept_loading");
  }
  if (!state.files.accessRequestMessage) {
    elements.filesRestrictedRequestFeedback.hidden = true;
    elements.filesRestrictedRequestFeedback.textContent = "";
    elements.filesRestrictedRequestFeedback.classList.remove("is-error", "is-success");
  }
  elements.filesNotAuthorizedMessage.textContent = t("files_not_authorized_message");
  elements.filesLoginBtn.textContent = t("files_login_button");
  elements.filesLogoutBtn.textContent = t("files_logout_button");
  elements.filesSessionLogoutBtn.textContent = t("files_logout_button");
  elements.filesSessionTitle.textContent = t("files_profile_title");
  elements.filesSessionUserLabel.textContent = t("files_session_user_label");
  elements.filesSessionIdLabel.textContent = t("files_session_id_label");
  elements.filesSessionClearanceLabel.textContent = t("files_session_clearance_label");
  elements.filesSessionStateLabel.textContent = t("files_session_state_label");
  elements.filesSessionBadge.textContent = t("files_unknown_value");
  elements.filesSessionUser.textContent = t("files_unknown_value");
  elements.filesSessionId.textContent = t("files_unknown_value");
  elements.filesSessionClearance.textContent = t("files_unknown_value");
  elements.filesSessionState.textContent = t("files_unknown_value");
  elements.filesSessionBadge.classList.remove("is-admin");
  elements.filesSessionClearance.classList.remove("is-admin");
  if (elements.filesAdminToolsTitle) {
    elements.filesAdminToolsTitle.textContent = t("files_admin_tools_title");
  }
  if (elements.filesAdminConsoleModalBtnText) {
    elements.filesAdminConsoleModalBtnText.textContent = t("files_admin_console_title");
  }
  if (elements.filesAccessControlModalBtnText) {
    elements.filesAccessControlModalBtnText.textContent = t("files_admin_requests_title");
  }
  if (elements.filesBotAdminModalBtnText) {
    elements.filesBotAdminModalBtnText.textContent = t("files_bot_admin_modal_title");
  }
  if (elements.filesBotAdminFloatingBtnLabel) {
    elements.filesBotAdminFloatingBtnLabel.textContent = t("files_bot_admin_fab_label");
  }
  if (elements.filesBotAdminFloatingBtnHint) {
    elements.filesBotAdminFloatingBtnHint.textContent = t("files_bot_admin_fab_hint");
  }
  if (elements.filesBotAdminFloatingBtn) {
    elements.filesBotAdminFloatingBtn.removeAttribute("title");
    elements.filesBotAdminFloatingBtn.setAttribute("aria-label", t("files_bot_admin_modal_title"));
  }
  if (elements.filesUploadModalCloseBtn) {
    elements.filesUploadModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  if (elements.filesAdminRequestsModalCloseBtn) {
    elements.filesAdminRequestsModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  if (elements.filesBotAdminModalCloseBtn) {
    elements.filesBotAdminModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  elements.filesUploadTitle.textContent = t("files_admin_console_title");
  elements.filesAdminRequestsTitle.textContent = t("files_admin_requests_title");
  elements.filesAdminRequestsHint.textContent = t("files_admin_requests_hint");
  if (elements.filesBotAdminBadge) {
    elements.filesBotAdminBadge.textContent = t("files_bot_admin_modal_badge");
  }
  if (elements.filesBotAdminTitle) {
    elements.filesBotAdminTitle.textContent = t("files_bot_admin_modal_title");
  }
  if (elements.filesBotAdminHint) {
    elements.filesBotAdminHint.textContent = t("files_bot_admin_modal_hint");
  }
  if (elements.filesBotAdminStatusLabel) {
    elements.filesBotAdminStatusLabel.textContent = t("files_bot_admin_summary_status");
  }
  if (elements.filesBotAdminServersLabel) {
    elements.filesBotAdminServersLabel.textContent = t("files_bot_admin_summary_servers");
  }
  if (elements.filesBotAdminUsersLabel) {
    elements.filesBotAdminUsersLabel.textContent = t("files_bot_admin_summary_users");
  }
  if (elements.filesBotAdminChannelsLabel) {
    elements.filesBotAdminChannelsLabel.textContent = t("files_bot_admin_summary_channels");
  }
  if (elements.filesBotAdminSearchLabel) {
    elements.filesBotAdminSearchLabel.textContent = t("files_bot_admin_search_label");
  }
  if (elements.filesBotAdminSearchInput) {
    elements.filesBotAdminSearchInput.placeholder = t("files_bot_admin_search_placeholder");
  }
  elements.filesAdminRequestsSearchLabel.textContent = t("files_admin_requests_search_label");
  elements.filesAdminRequestsSearchInput.placeholder = t("files_admin_requests_search_placeholder");
  elements.filesAdminRequestsFilterLabel.textContent = t("files_admin_requests_filter_label");
  elements.filesAdminRequestsFilterPending.textContent = t("files_admin_requests_filter_pending");
  elements.filesAdminRequestsFilterApproved.textContent = t("files_admin_requests_filter_approved");
  elements.filesAdminRequestsFilterDeclined.textContent = t("files_admin_requests_filter_declined");
  elements.filesAdminRequestsFilterAuthorized.textContent = t("files_admin_requests_filter_authorized");
  elements.filesAdminRequestsFilterAll.textContent = t("files_admin_requests_filter_all");
  if (elements.filesAdminRequestsFilter?.options?.length >= 5) {
    elements.filesAdminRequestsFilter.options[0].textContent = t("files_admin_requests_filter_pending");
    elements.filesAdminRequestsFilter.options[1].textContent = t("files_admin_requests_filter_approved");
    elements.filesAdminRequestsFilter.options[2].textContent = t("files_admin_requests_filter_declined");
    elements.filesAdminRequestsFilter.options[3].textContent = t("files_admin_requests_filter_authorized");
    elements.filesAdminRequestsFilter.options[4].textContent = t("files_admin_requests_filter_all");
  }
  syncFilesAdminRequestsFilterMenu();
  elements.filesAdminRequestsRefreshBtn.textContent = t("files_admin_requests_refresh_button");
  renderFilesBotAdminPanel();
  elements.filesBrowserTitle.textContent = t("files_file_index_title");
  elements.filesSearchLabel.textContent = t("files_search_label");
  elements.filesSearchInput.placeholder = t("files_search_placeholder");
  elements.filesSearchHint.textContent = t("files_search_hint");
  if (elements.filesGroupManagerToggleText) {
    const managerTextKey = state.files.groupManager.open
      ? "files_group_manager_toggle_close"
      : "files_group_manager_toggle_open";
    elements.filesGroupManagerToggleText.textContent = t(managerTextKey);
  }
  elements.filesUploadFileLabel.textContent = t("files_upload_file_label");
  if (elements.filesUploadImageLabel) {
    elements.filesUploadImageLabel.textContent = t("files_upload_image_label");
  }
  if (elements.filesUploadGroupLabel) {
    elements.filesUploadGroupLabel.textContent = t("files_upload_group_label");
  }
  elements.filesUploadDescLabel.textContent = t("files_upload_description_label");
  elements.filesUploadBtn.textContent = t("files_upload_button");
  if (elements.filesGroupInput) {
    elements.filesGroupInput.placeholder = t("files_upload_group_placeholder");
  }
  syncFilesGroupSuggestions();
  elements.filesDescriptionInput.placeholder = t("files_upload_description_placeholder");
  elements.filesEmptyState.textContent = t("files_empty_state");
  elements.filesDeleteTitle.textContent = t("files_delete_modal_title");
  elements.filesDeleteMessage.textContent = t("files_delete_modal_body", { name: t("files_unknown_value") });
  elements.filesDeleteCancelBtn.textContent = t("files_delete_modal_cancel");
  elements.filesDeleteConfirmBtn.textContent = t("files_delete_modal_confirm");
  if (elements.filesGroupRenameTitle) {
    elements.filesGroupRenameTitle.textContent = t("files_group_rename_modal_title");
  }
  if (elements.filesGroupRenameMessage) {
    elements.filesGroupRenameMessage.textContent = t("files_group_rename_modal_body", { group: t("files_group_default") });
  }
  if (elements.filesGroupRenameLabel) {
    elements.filesGroupRenameLabel.textContent = t("files_group_rename_modal_label");
  }
  if (elements.filesGroupRenameInput) {
    elements.filesGroupRenameInput.placeholder = t("files_group_rename_modal_placeholder");
  }
  if (elements.filesGroupRenameCancelBtn) {
    elements.filesGroupRenameCancelBtn.textContent = t("files_group_rename_modal_cancel");
  }
  if (elements.filesGroupRenameConfirmBtn) {
    elements.filesGroupRenameConfirmBtn.textContent = t("files_group_rename_modal_confirm");
  }
  if (elements.filesDisclaimerBtnText) {
    elements.filesDisclaimerBtnText.textContent = t("files_disclaimer_button");
  }
  if (elements.filesDisclaimerTitle) {
    elements.filesDisclaimerTitle.textContent = t("files_disclaimer_modal_title");
  }
  if (elements.filesDisclaimerBody1) {
    elements.filesDisclaimerBody1.textContent = t("files_disclaimer_modal_body_1");
  }
  if (elements.filesDisclaimerBody2) {
    elements.filesDisclaimerBody2.textContent = t("files_disclaimer_modal_body_2");
  }
  if (elements.filesDisclaimerCloseBtn) {
    elements.filesDisclaimerCloseBtn.textContent = t("files_disclaimer_modal_close");
  }

  if (elements.minervaAwaiting) {
    elements.minervaAwaiting.textContent = t("minerva_awaiting");
  }

  elements.footerText.textContent = t("footer_text");

  updateClock();
  renderSiloFromState();
  renderMinervaFromState();
  if (state.minervaLocation.open) {
    renderMinervaLocationView();
  }
  if (state.minervaDetail.open && state.minervaDetail.item) {
    void openMinervaDetail(state.minervaDetail.item);
  }
  setSignal(state.signalKey);
  if (state.easterEgg.hack && elements.hackOverlay.classList.contains("is-active")) {
    renderHackOverlay();
  }

  if (state.minervaLists?.length) {
    renderClassifiedMinervaLists(state.minervaLists);
    buildClassifiedSearchCatalog(state.minervaLists);
  } else {
    renderClassifiedMinervaLists([]);
    buildClassifiedSearchCatalog([]);
  }
  if (state.classifiedDetail.open && state.classifiedDetail.item) {
    void openClassifiedInlineDetail(state.classifiedDetail.item);
  } else {
    renderClassifiedInlineDetail();
  }
  renderFilesAccessView();
  setFilesSearchOpen(state.files.search.open);
  renderFilesDeleteModal();
  renderFilesAdminModals();
  renderFilesGroupRenameModal();
  renderFilesDisclaimerModal();
  if (document.body.classList.contains("is-classified")) {
    elements.mainTitle.textContent = t("classified_main_title");
  } else if (document.body.classList.contains("is-files")) {
    elements.mainTitle.textContent = t("files_main_title");
  } else {
    elements.mainTitle.textContent = t("main_title");
  }

  syncTopTabForCurrentView();

  elements.langSelect.value = state.lang;
  syncLanguageMenu();
  setLanguageMenuOpen(false);
  if (persist) {
    localStorage.setItem(STORAGE_LANG_KEY, state.lang);
  }
}

async function refreshIntel() {
  const syncStartedAt = performance.now();
  elements.refreshBtn.disabled = true;
  setSignal("syncing");
  showSyncOverlay(true);

  try {
    const [siloStatus, minervaStatus] = await Promise.all([
      refreshSiloPanel(),
      refreshMinervaPanel()
    ]);

    if (siloStatus.ok && minervaStatus.ok) {
      setSignal(minervaStatus.source === "live" ? "online" : "online_fallback");
    } else if (siloStatus.ok || minervaStatus.ok) {
      setSignal("partial");
    } else {
      setSignal("offline");
    }

    elements.lastRefresh.textContent = formatLastSync();
  } finally {
    const elapsed = performance.now() - syncStartedAt;
    const minSyncAnimationMs = 850;
    if (elapsed < minSyncAnimationMs) {
      await sleep(minSyncAnimationMs - elapsed);
    }

    showSyncOverlay(false);
    elements.refreshBtn.disabled = false;
  }
}

async function startBootSequence() {
  if (!elements.bootOverlay) {
    document.body.classList.remove("is-booting");
    document.body.classList.add("is-ready");
    return;
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const timing = prefersReducedMotion
    ? { pre: 20, bloom: 70, step: 90, ready: 110, post: 80, fade: 160 }
    : { pre: 90, bloom: 180, step: 240, ready: 280, post: 220, fade: 380 };

  const bootSteps = [
    { text: elements.bootLine1?.textContent || t("boot_line_1"), progress: 32 },
    { text: elements.bootLine2?.textContent || t("boot_line_2"), progress: 62 },
    { text: elements.bootLine3?.textContent || t("boot_line_3"), progress: 88 },
    { text: elements.bootReady?.textContent || t("boot_ready"), progress: 100, ready: true }
  ];

  if (elements.bootLog) {
    elements.bootLog.replaceChildren();
  }
  if (elements.bootBar) {
    elements.bootBar.style.width = "0%";
  }
  if (elements.bootPercent) {
    elements.bootPercent.textContent = "0%";
  }
  if (elements.bootHint) {
    elements.bootHint.textContent = t("boot_hint_initializing");
  }

  await sleep(timing.pre);
  elements.bootOverlay.classList.add("is-blooming");
  await sleep(timing.bloom);
  elements.bootOverlay.classList.add("is-boot-running");

  for (const step of bootSteps) {
    if (elements.bootLog) {
      const line = document.createElement("div");
      line.className = `boot-log-line${step.ready ? " is-ready" : ""}`;
      line.textContent = step.ready
        ? `[OK ${step.progress}%] ${step.text}`
        : `[${String(step.progress).padStart(2, "0")}%] ${step.text}`;
      elements.bootLog.appendChild(line);
      elements.bootLog.scrollTop = elements.bootLog.scrollHeight;
    }
    if (elements.bootBar) {
      elements.bootBar.style.width = `${step.progress}%`;
    }
    if (elements.bootPercent) {
      elements.bootPercent.textContent = `${step.progress}%`;
    }
    if (elements.bootHint) {
      elements.bootHint.textContent = step.text;
    }
    await sleep(step.ready ? timing.ready : timing.step);
  }

  await sleep(timing.post);
  elements.bootOverlay.classList.add("is-hidden");

  await sleep(timing.fade);
  elements.bootOverlay.remove();
  document.body.classList.remove("is-booting");
  document.body.classList.add("is-ready");
}

function wireEvents() {
  const hackInteractiveRoot = elements.hackOverlay?.querySelector(".hack-core") || null;
  const intelBotInviteRoot = elements.intelBotInviteCore || null;
  const filesBotAdminLeaveModalRoot = elements.filesBotAdminLeaveOverlay?.querySelector(".files-bot-admin-leave-core") || null;
  const filesGroupRenameModalRoot = elements.filesGroupRenameOverlay?.querySelector(".files-group-rename-core") || null;
  const filesDisclaimerModalRoot = elements.filesDisclaimerOverlay?.querySelector(".files-disclaimer-core") || null;
  const filesUploadModalRoot = elements.filesUploadOverlay?.querySelector(".files-admin-modal-core") || null;
  const filesAdminRequestsModalRoot = elements.filesAdminRequestsOverlay?.querySelector(".files-admin-modal-core") || null;
  const filesBotAdminModalRoot = elements.filesBotAdminOverlay?.querySelector(".files-admin-modal-core") || null;
  const shouldBlockBackgroundForActiveOverlay = (target) => {
    if (document.body.classList.contains("is-syncing") && elements.syncOverlay?.classList.contains("is-active")) {
      return true;
    }
    if (document.body.classList.contains("is-classified-loading") && elements.classifiedLoadOverlay?.classList.contains("is-active")) {
      return true;
    }
    if (elements.intelBotInviteOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(intelBotInviteRoot instanceof Node)) {
        return true;
      }
      return !intelBotInviteRoot.contains(target);
    }
    if (elements.filesBotAdminLeaveOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesBotAdminLeaveModalRoot instanceof Node)) {
        return true;
      }
      return !filesBotAdminLeaveModalRoot.contains(target);
    }
    if (elements.filesGroupRenameOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesGroupRenameModalRoot instanceof Node)) {
        return true;
      }
      return !filesGroupRenameModalRoot.contains(target);
    }
    if (elements.filesDisclaimerOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesDisclaimerModalRoot instanceof Node)) {
        return true;
      }
      return !filesDisclaimerModalRoot.contains(target);
    }
    if (elements.filesUploadOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesUploadModalRoot instanceof Node)) {
        return true;
      }
      return !filesUploadModalRoot.contains(target);
    }
    if (elements.filesAdminRequestsOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesAdminRequestsModalRoot instanceof Node)) {
        return true;
      }
      return !filesAdminRequestsModalRoot.contains(target);
    }
    if (elements.filesBotAdminOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesBotAdminModalRoot instanceof Node)) {
        return true;
      }
      return !filesBotAdminModalRoot.contains(target);
    }
    if (elements.siloDossierOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node)) {
        return true;
      }
      return target !== elements.siloDossierOverlay && !elements.siloDossierOverlay.contains(target);
    }
    if (!document.body.classList.contains("is-hacking")) {
      return false;
    }
    if (!elements.hackOverlay?.classList.contains("is-active")) {
      return false;
    }
    if (!(target instanceof Node) || !hackInteractiveRoot) {
      return true;
    }
    return !hackInteractiveRoot.contains(target);
  };
  const blockBackgroundForActiveOverlay = (event) => {
    if (!shouldBlockBackgroundForActiveOverlay(event.target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  document.addEventListener("pointerdown", () => {
    primeAudioContext();
  }, { passive: true });
  document.addEventListener("keydown", () => {
    primeAudioContext();
  });

  elements.refreshBtn.addEventListener("click", () => {
    void refreshIntel();
  });
  elements.langSelect.addEventListener("change", (event) => {
    applyLanguage(event.target.value);
  });
  elements.langToggleBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = elements.langDropdown?.classList.contains("is-open");
    setLanguageMenuOpen(!isOpen);
  });
  elements.langOptions?.forEach((option) => {
    option.addEventListener("click", () => {
      const targetLang = option.dataset.lang === "es" ? "es" : "en";
      elements.langSelect.value = targetLang;
      elements.langSelect.dispatchEvent(new Event("change", { bubbles: true }));
      setLanguageMenuOpen(false);
    });
  });
  elements.discordBotInviteBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    openIntelBotInviteModal();
  });
  elements.intelBotInviteCancelBtn?.addEventListener("click", () => {
    closeIntelBotInviteModal();
  });
  elements.intelBotInviteConfirmBtn?.addEventListener("click", () => {
    closeIntelBotInviteModal();
  });
  elements.intelBotInviteOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.intelBotInviteOverlay) {
      closeIntelBotInviteModal();
    }
  });
  elements.siloDossierCloseBtn?.addEventListener("click", () => {
    hideSiloDossier({ updateHash: true });
  });
  elements.siloDossierBackBtn?.addEventListener("click", () => {
    hideSiloDossier({ updateHash: true });
  });
  elements.siloDossierOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.siloDossierOverlay) {
      hideSiloDossier({ updateHash: true });
    }
  });
  elements.minervaLocationCardBtn?.addEventListener("click", openMinervaLocationView);
  elements.minervaLocationBackBtn?.addEventListener("click", closeMinervaLocationView);
  elements.minervaLocationMapPrevBtn?.addEventListener("click", () => {
    cycleMinervaLocationSlide(-1);
  });
  elements.minervaLocationMapNextBtn?.addEventListener("click", () => {
    cycleMinervaLocationSlide(1);
  });
  if (elements.tabStatus) {
    elements.tabStatus.classList.add("secret-trigger");
    elements.tabStatus.addEventListener("click", () => {
      showFilesPage({ updateHash: true });
    });
  }
  if (elements.tabIntel) {
    elements.tabIntel.classList.add("secret-trigger");
    elements.tabIntel.addEventListener("click", () => {
      showIntelPage({ updateHash: true });
    });
  }
  if (elements.tabData) {
    elements.tabData.classList.add("secret-trigger");
    elements.tabData.addEventListener("click", handleSecretTriggerTap);
  }
  elements.filesLoginForm?.addEventListener("submit", (event) => {
    if (!openDiscordLoginPopup()) {
      return;
    }
    event.preventDefault();
  });
  elements.filesLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.filesSessionLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.filesRestrictedLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.filesDeniedLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.filesRestrictedRetryBtn?.addEventListener("click", () => {
    void handleFilesAccessRequest();
  });
  elements.filesDisclaimerAgreeBtn?.addEventListener("click", () => {
    void submitFilesDisclaimerDecision("accepted");
  });
  elements.filesDisclaimerDeclineBtn?.addEventListener("click", () => {
    void submitFilesDisclaimerDecision("declined");
  });
  elements.filesDisclaimerContactBtn?.addEventListener("click", () => {
    openFilesDisclaimerContactView();
  });
  elements.filesDisclaimerContactCancelBtn?.addEventListener("click", () => {
    closeFilesDisclaimerContactView({ clearText: false });
  });
  elements.filesDisclaimerContactSendBtn?.addEventListener("click", () => {
    void submitFilesDisclaimerReevaluation();
  });
  elements.filesDisclaimerContactInput?.addEventListener("input", () => {
    state.files.disclaimerGate.contactText = String(elements.filesDisclaimerContactInput?.value || "");
    if (elements.filesDisclaimerContactInput) {
      elements.filesDisclaimerContactInput.classList.remove("is-invalid");
    }
    if (state.files.disclaimerGate.messageKind === "error" && state.files.disclaimerGate.message) {
      const required = t("files_disclaimer_gate_contact_required");
      const tooLong = t("files_disclaimer_gate_contact_too_long");
      if (state.files.disclaimerGate.message === required || state.files.disclaimerGate.message === tooLong) {
        setFilesDisclaimerGateFeedback("", "");
        renderFilesAccessView();
      }
    }
  });
  elements.filesRestrictedReasonInput?.addEventListener("input", () => {
    const value = String(elements.filesRestrictedReasonInput.value || "").trim();
    if (value) {
      elements.filesRestrictedReasonInput.classList.remove("is-invalid");
      if (state.files.accessRequestMessageKind === "error") {
        const reasonRequired = t("files_restricted_reason_required");
        const reasonTooLong = t("files_restricted_reason_too_long");
        if (state.files.accessRequestMessage === reasonRequired || state.files.accessRequestMessage === reasonTooLong) {
          setFilesRestrictedRequestFeedback("", "");
          renderFilesAccessView();
        }
      }
    }
  });
  elements.filesUploadForm?.addEventListener("submit", (event) => {
    void handleFilesUpload(event);
  });
  elements.filesGroupRenameInput?.addEventListener("input", () => {
    state.files.groupRename.value = String(elements.filesGroupRenameInput?.value || "");
    if (state.files.groupRename.messageKind === "error" && state.files.groupRename.message) {
      setFilesGroupRenameFeedback("", "");
      renderFilesGroupRenameModal();
    }
  });
  elements.filesGroupRenameForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleFilesRenameGroupSubmit();
  });
  elements.filesGroupRenameCancelBtn?.addEventListener("click", () => {
    closeFilesGroupRenameModal();
  });
  elements.filesGroupRenameOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesGroupRenameOverlay) {
      closeFilesGroupRenameModal();
    }
  });
  elements.filesAdminConsoleModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "upload";
    setFilesAdminModalOpen(isOpen ? "" : "upload");
  });
  elements.filesAccessControlModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "requests";
    setFilesAdminModalOpen(isOpen ? "" : "requests");
  });
  elements.filesBotAdminModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "bot";
    setFilesAdminModalOpen(isOpen ? "" : "bot");
  });
  elements.filesBotAdminFloatingBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "bot";
    setFilesAdminModalOpen(isOpen ? "" : "bot");
  });
  elements.filesUploadModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesAdminRequestsModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesBotAdminModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesDisclaimerBtn?.addEventListener("click", () => {
    if (state.files.disclaimerModal.open) {
      closeFilesDisclaimerModal();
      return;
    }
    openFilesDisclaimerModal();
  });
  elements.filesDisclaimerCloseBtn?.addEventListener("click", () => {
    closeFilesDisclaimerModal();
  });
  elements.filesDisclaimerOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesDisclaimerOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesDisclaimerModal();
    }
  });
  elements.filesUploadOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesUploadOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesAdminRequestsOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesAdminRequestsOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesBotAdminOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesBotAdminOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesAdminRequestsSearchInput?.addEventListener("input", () => {
    state.files.adminRequests.query = String(elements.filesAdminRequestsSearchInput.value || "");
    renderFilesAdminRequestsPanel();
  });
  elements.filesBotAdminSearchInput?.addEventListener("input", () => {
    state.files.botAdmin.query = String(elements.filesBotAdminSearchInput.value || "");
    renderFilesBotAdminPanel();
  });
  elements.filesAdminRequestsFilterBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = elements.filesAdminRequestsFilterDropdown?.classList.contains("is-open");
    setFilesAdminRequestsFilterMenuOpen(!isOpen);
  });
  elements.filesAdminRequestsFilterOptions?.forEach((option) => {
    option.addEventListener("click", () => {
      const nextFilter = normalizeFilesAdminRequestsFilter(option.dataset.filter || "pending");
      setFilesAdminRequestsFilterValue(nextFilter, { render: true, closeMenu: true });
    });
  });
  elements.filesAdminRequestsFilter?.addEventListener("change", () => {
    setFilesAdminRequestsFilterValue(elements.filesAdminRequestsFilter.value, { render: true, closeMenu: false });
  });
  elements.filesAdminRequestsRefreshBtn?.addEventListener("click", () => {
    void refreshFilesAdminRequests();
  });
  elements.filesBotAdminRefreshBtn?.addEventListener("click", () => {
    void refreshFilesBotAdminOverview();
  });
  elements.filesBotAdminSyncBtn?.addEventListener("click", () => {
    const trigger = elements.filesBotAdminSyncBtn;
    if (trigger instanceof HTMLElement) {
      trigger.dataset.filesBotAction = "sync";
      trigger.dataset.actionKey = "sync";
      void handleFilesBotAdminAction(trigger);
      trigger.removeAttribute("data-files-bot-action");
      trigger.removeAttribute("data-action-key");
    }
  });
  elements.filesBotAdminInviteLink?.addEventListener("click", (event) => {
    const inviteLink = normalizeFilesBotAdminOverview(state.files.botAdmin.overview)?.inviteLink
      || state.publicConfig.botInviteLink
      || "";
    if (!inviteLink) {
      event.preventDefault();
      setFilesBotAdminFeedback(t("files_bot_admin_invite_unavailable"), "error");
      renderFilesBotAdminPanel();
    }
  });
  elements.filesBotAdminServerList?.addEventListener("click", handleFilesBotAdminServerListClick);
  elements.filesSearchToggleBtn?.addEventListener("click", () => {
    const nextOpen = !state.files.search.open;
    setFilesSearchOpen(nextOpen, { focusInput: nextOpen, clearQuery: !nextOpen });
  });
  elements.filesGroupManagerToggleBtn?.addEventListener("click", () => {
    const nextOpen = !state.files.groupManager.open;
    setFilesGroupManagerOpen(nextOpen, { focusInput: nextOpen, clearSelection: !nextOpen });
  });
  elements.filesSearchInput?.addEventListener("input", () => {
    state.files.search.query = String(elements.filesSearchInput.value || "");
    renderFilesList();
    if (state.files.groupManager.open) {
      renderFilesGroupManagerPanel();
    }
  });
  elements.filesSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setFilesSearchOpen(false, { clearQuery: true });
    }
  });
  elements.filesUploadInput?.addEventListener("change", () => {
    if (elements.filesUploadInput?.files?.length) {
      const hadMissingFileError = state.files.uploadMissingFileError;
      setFilesUploadInputInvalid(false, { isMissingFileError: false });
      if (hadMissingFileError) {
        setFilesUploadFeedback("", "");
      }
      renderFilesAccessView();
    }
  });
  elements.filesImageInput?.addEventListener("change", () => {
    if (elements.filesImageInput?.files?.length) {
      setFilesUploadFeedback("", "");
      renderFilesAccessView();
    }
  });
  elements.filesGroupInput?.addEventListener("input", () => {
    if (state.files.uploadMessageKind === "error") {
      setFilesUploadFeedback("", "");
      renderFilesAccessView();
    }
    syncFilesGroupSuggestions();
  });
  elements.filesUploadPanel?.addEventListener("click", handleFilesListClick);
  elements.filesList?.addEventListener("click", handleFilesListClick);
  elements.filesList?.addEventListener("keydown", handleFilesListKeydown);
  elements.filesList?.addEventListener("input", handleFilesListInput);
  elements.filesList?.addEventListener("change", handleFilesListChange);
  elements.filesList?.addEventListener("submit", handleFilesListSubmit);
  elements.filesGroupManagerWrap?.addEventListener("click", handleFilesListClick);
  elements.filesGroupManagerWrap?.addEventListener("input", handleFilesListInput);
  elements.filesGroupManagerWrap?.addEventListener("change", handleFilesListChange);
  elements.filesSearchResults?.addEventListener("click", handleFilesListClick);
  elements.filesAdminRequestsList?.addEventListener("click", handleFilesAdminRequestsListClick);
  elements.filesAdminRequestsList?.addEventListener("input", handleFilesAdminRequestsListInput);
  elements.filesDeleteCancelBtn?.addEventListener("click", () => {
    closeFilesDeleteModal();
  });
  elements.filesDeleteConfirmBtn?.addEventListener("click", () => {
    void confirmFilesDeleteModal();
  });
  elements.filesDeleteOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesDeleteOverlay) {
      closeFilesDeleteModal();
    }
  });
  elements.filesBotAdminLeaveCancelBtn?.addEventListener("click", () => {
    closeFilesBotAdminLeaveModal();
  });
  elements.filesBotAdminLeaveConfirmBtn?.addEventListener("click", () => {
    void confirmFilesBotAdminLeaveModal();
  });
  elements.filesBotAdminLeaveOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesBotAdminLeaveOverlay) {
      closeFilesBotAdminLeaveModal();
    }
  });
  elements.hackAbortBtn.addEventListener("click", hideHackOverlay);
  elements.hackRetryBtn.addEventListener("click", startNewHackSession);
  elements.hackOpenClassifiedBtn.addEventListener("click", showClassifiedPage);
  elements.classifiedBackBtn.addEventListener("click", hideClassifiedPage);
  elements.minervaDetailBackBtn?.addEventListener("click", closeMinervaDetail);
  elements.minervaDetailImage?.addEventListener("error", () => {
    const fallbackSrc = elements.minervaDetailImage?.dataset?.fallbackSrc
      || state.minervaDetail.fallbackImageUrl
      || MINERVA_DETAIL_FALLBACK_IMAGE;
    if (!fallbackSrc) {
      return;
    }

    const currentSrc = elements.minervaDetailImage.getAttribute("src") || "";
    if (currentSrc === fallbackSrc) {
      return;
    }

    elements.minervaDetailImage.src = fallbackSrc;
  });
  elements.minervaLocationMapImage?.addEventListener("error", () => {
    elements.minervaLocationMapImage.src = "assets/images/minerva-route-map.svg";
    elements.minervaLocationMapImage.alt = "Appalachia route map";
    if (elements.minervaLocationPinsWrap) {
      elements.minervaLocationPinsWrap.hidden = false;
    }
    syncMinervaLocationMapPins(state.minerva.data?.location || "--");
  });
  elements.classifiedSearchInput.addEventListener("input", () => {
    renderClassifiedMinervaSearchResults();
  });
  elements.classifiedSearchToggleBtn?.addEventListener("click", () => {
    const nextOpen = !state.classifiedSearch.open;
    setClassifiedSearchOpen(nextOpen, { focusInput: nextOpen, clearQuery: !nextOpen });
  });
  elements.classifiedSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setClassifiedSearchOpen(false, { clearQuery: true });
    }
  });
  elements.classifiedInlineCloseBtn?.addEventListener("click", () => {
    closeClassifiedInlineDetail();
  });
  elements.classifiedInlineImage?.addEventListener("error", () => {
    const fallbackSrc = elements.classifiedInlineImage?.dataset?.fallbackSrc
      || state.minervaDetail.fallbackImageUrl
      || MINERVA_DETAIL_FALLBACK_IMAGE;
    if (!fallbackSrc) {
      return;
    }

    const currentSrc = elements.classifiedInlineImage.getAttribute("src") || "";
    if (currentSrc === fallbackSrc) {
      return;
    }

    elements.classifiedInlineImage.src = fallbackSrc;
  });
  document.addEventListener("beforeinput", (event) => {
    if (!isTypingTarget(event.target)) {
      return;
    }

    const inputType = String(event.inputType || "");
    if (
      inputType.startsWith("insert")
      || inputType.startsWith("delete")
      || inputType === "historyUndo"
      || inputType === "historyRedo"
    ) {
      playTypeTickSound();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (!isTypingTarget(event.target)) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = String(event.key || "");
    if (key.length === 1 || key === "Backspace" || key === "Delete" || key === "Enter") {
      playTypeTickSound();
    }
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (elements.langDropdown && target instanceof Node && !elements.langDropdown.contains(target)) {
      setLanguageMenuOpen(false);
    }
    if (elements.filesAdminRequestsFilterDropdown && target instanceof Node && !elements.filesAdminRequestsFilterDropdown.contains(target)) {
      setFilesAdminRequestsFilterMenuOpen(false);
    }
    if (target instanceof Node) {
      const openGroupDropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-dropdown].is-open"));
      for (const dropdown of openGroupDropdowns) {
        if (!(dropdown instanceof HTMLElement)) {
          continue;
        }
        if (!dropdown.contains(target)) {
          setFilesGroupSuggestMenuOpen(dropdown, false);
        }
      }
    }
  });
  document.addEventListener("touchmove", blockBackgroundForActiveOverlay, { passive: false });
  document.addEventListener("wheel", blockBackgroundForActiveOverlay, { passive: false });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (elements.langDropdown?.classList.contains("is-open")) {
      setLanguageMenuOpen(false);
      return;
    }

    if (elements.intelBotInviteOverlay?.classList.contains("is-active")) {
      closeIntelBotInviteModal();
      return;
    }

    if (elements.filesBotAdminLeaveOverlay?.classList.contains("is-active")) {
      closeFilesBotAdminLeaveModal();
      return;
    }

    if (elements.filesAdminRequestsFilterDropdown?.classList.contains("is-open")) {
      setFilesAdminRequestsFilterMenuOpen(false);
      return;
    }

    const openGroupDropdown = document.querySelector("[data-files-group-suggest-dropdown].is-open");
    if (openGroupDropdown instanceof HTMLElement) {
      setFilesGroupSuggestMenuOpen(openGroupDropdown, false);
      return;
    }

    if (elements.filesDisclaimerOverlay?.classList.contains("is-active")) {
      if (!isDesktopModalViewport()) {
        closeFilesDisclaimerModal();
      }
      return;
    }

    if (elements.hackOverlay.classList.contains("is-active")) {
      hideHackOverlay();
      return;
    }

    if (elements.siloDossierOverlay?.classList.contains("is-active")) {
      hideSiloDossier({ updateHash: true });
      return;
    }

    if (elements.filesDeleteOverlay?.classList.contains("is-active")) {
      closeFilesDeleteModal();
      return;
    }

    if (elements.filesGroupRenameOverlay?.classList.contains("is-active")) {
      closeFilesGroupRenameModal();
      return;
    }

    if (
      elements.filesUploadOverlay?.classList.contains("is-active")
      || elements.filesAdminRequestsOverlay?.classList.contains("is-active")
      || elements.filesBotAdminOverlay?.classList.contains("is-active")
    ) {
      if (!isDesktopModalViewport()) {
        closeFilesAdminModal();
      }
      return;
    }

    if (state.files.disclaimerGate.contactOpen && elements.filesDisclaimerGateView && !elements.filesDisclaimerGateView.hidden) {
      closeFilesDisclaimerContactView({ clearText: false });
      return;
    }

    if (document.body.classList.contains("is-files") && state.files.search.open) {
      setFilesSearchOpen(false, { clearQuery: true });
      return;
    }

    if (document.body.classList.contains("is-classified")) {
      hideClassifiedPage();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.view === "files" && document.body.classList.contains("is-files")) {
      void pollFilesIdentityLive({ force: true });
    }
  });
  window.addEventListener("resize", () => {
    renderFilesAdminModals();
    if (state.classifiedSearch.open) {
      unlockClassifiedArchiveCardSize();
      refreshClassifiedArchiveCardBaseSize(true);
      lockClassifiedArchiveCardSize();
      return;
    }
    refreshClassifiedArchiveCardBaseSize();
  });
  window.addEventListener("hashchange", () => {
    applyViewFromHash();
  });
  window.addEventListener("message", handleDiscordAuthPopupMessage);
}

async function init() {
  setupBackgroundParallax();
  wireEvents();

  const initialLang = detectInitialLanguage();
  applyLanguage(initialLang, false);
  void loadPublicConfig();
  state.files.me = buildGuestFilesProfile();
  if (!getHashView()) {
    setHashView("intel", { replace: true });
  }
  applyViewFromHash();
  if (state.view !== "files") {
    void refreshFilesIdentityBadgeOnly();
  }
  prewarmStaticSiteImages();
  prewarmMinervaDetailImages();
  void loadMinervaDetailFallback();
  setSignal("booting");

  await startBootSequence();

  updateClock();
  setInterval(updateClock, 1000);
  await refreshIntel();
}

init();
