let filesLiveIdentityPollTimer = null;
let filesLiveIdentityPollInFlight = false;
let filesAdminRequestsFeedbackTimer = null;
let filesEditModalFeedbackTimer = null;
let filesPublicSharesFeedbackTimer = null;
let filesUploadFeedbackTimer = null;
let filesDownloadRefreshTimer = null;
let filesDisclaimerAcceptTransitionTimer = null;
let discordAuthPopupWindow = null;
let discordAuthPopupPollTimer = null;
let filesDescriptionEditors = [];
let visitCounterEyeMotionFrame = 0;
let visitCounterEyeEntryTimer = null;
let visitCounterEyes = [];

const STRINGS = globalThis.FALLOUT_CODEX_STRINGS || { en: {}, es: {} };

const state = {
  lang: "en",
  signalKey: "booting",
  view: "intel",
  publicConfig: {
    botInviteLink: ""
  },
  visitCounter: {
    total: null,
    counted: false,
    loading: false
  },
  intelBotInvite: {
    open: false
  },
  intelEmail: {
    open: false,
    feed: "silo",
    busy: false,
    statusLoading: false,
    statusLoaded: false,
    unsubscribeBusy: false,
    testBusyKind: "",
    subscriptions: {
      silo: null,
      minerva: null
    },
    cooldowns: {
      silo: null,
      minerva: null
    },
    adminSubscriptions: {
      open: false,
      loading: false,
      busyKey: "",
      entries: [],
      error: ""
    },
    message: "",
    messageKind: "",
    opener: null
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
  classifiedPlayers: {
    open: false,
    loading: false,
    error: "",
    data: null,
    history: [],
    range: "48h",
    chartPoints: [],
    chartLayout: null,
    hoverIndex: -1,
    requestId: 0
  },
  classifiedNukaIntel: {
    open: false,
    loading: false,
    error: "",
    activeKey: "dailyOps",
    data: null,
    fingerprint: "",
    checkedAt: 0,
    requestId: 0
  },
  classifiedAxolotl: {
    open: false
  },
  fo76Events: {
    open: false,
    loading: false,
    error: "",
    data: null,
    requestId: 0
  },
  fo76RoadMap: {
    open: false,
    lensZoom: 2.5
  },
  fo76MinervaList: {
    open: false,
    loading: false,
    error: "",
    listNumber: null,
    eventTitle: "",
    list: null,
    opener: null,
    detail: {
      loading: false,
      error: "",
      item: null,
      data: null,
      requestId: 0
    }
  },
  fo76EventInfo: {
    open: false,
    event: null,
    detail: null
  },
  files: {
    me: null,
    localAccessExpired: false,
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
    replace: {
      fileId: ""
    },
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
    cautionModal: {
      open: false,
      fileId: "",
      versionId: "",
      fileName: "",
      kind: ""
    },
    shareModal: {
      open: false,
      fileId: "",
      fileName: "",
      mode: "choice",
      busy: false,
      feedback: "",
      feedbackKind: "",
      sourceButton: null
    },
    publicShares: {
      loading: false,
      list: [],
      adminList: [],
      maxActive: 3,
      mode: "mine",
      message: "",
      messageKind: "",
      busyActionKey: ""
    },
    editModal: {
      fileId: "",
      focusField: "",
      message: "",
      messageKind: "",
      busy: false
    },
    botAdmin: {
      loading: false,
      overview: null,
      query: "",
      filter: "all",
      sort: "members",
      selectedGuildId: "",
      diagnosticsOpen: false,
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
    functionsModal: {
      open: false,
      fileName: "",
      functions: ""
    },
    disclaimerModal: {
      open: false
    }
  },
  drops: {
    list: [],
    loading: false,
    error: "",
    uploadBusy: false,
    uploadMessage: "",
    uploadMessageKind: "",
    virusTotalConfigured: false,
    uploadLimitBytes: 0,
    retentionMaxHours: 0,
    expiryMode: "hours",
    uploadProgress: {
      active: false,
      fileName: "",
      loadedBytes: 0,
      totalBytes: 0,
      percent: 0,
      phase: ""
    },
    deleteModal: {
      open: false,
      shareId: "",
      shareName: "",
      deleting: false
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

const elements = globalThis.FALLOUT_CODEX_ELEMENTS || {};

const minervaImagePreloadCache = new Map();
