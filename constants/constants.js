const {
    //
    DEV_ID,
    AUTH_KEY,
    NODE_ENV,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_AUTH,
    PORT,
  } = process.env;
  const isProd = NODE_ENV === 'production';
  
  export const API = {
    BASE_URL: 'https://api.smitegame.com/smiteapi.svc',
    RESPONSE_FORMAT: 'Json',
    SESSION_ID: 'session_id',
    JSON: 'Json',
  };
  
  export const METHODS = {
    TEST_SESSION: 'testsession',
    CREATE_SESSION: 'createsession',
    GET_PLAYER: 'getplayer',
    GET_MATCH_HISTORY: 'getmatchhistory',
    GET_MATCH_DETAILS: 'getmatchdetails',
    GET_DATA_USED: 'getdataused',
    PING: 'ping',
    GET_PATCH_INFO: 'getpatchinfo',
    GET_ITEMS: 'getitems',
    GET_HIREZ_SERVER_STATUS: 'gethirezserverstatus',
    GET_GODS: 'getgods',
    GET_GOD_ALT_ABILTIES: 'getgodaltabilities',
    GET_GOD_SKINS: 'getgodskins',
    GET_PLAYERID_BY_NAME: 'getplayeridbyname',
    GET_PLAYERIDS_BY_GAMER_TAG: 'getplayeridsbygamertag',
    GET_TOP_MATCHES: 'gettopmatches',
    GET_MATCH_IDS_BY_QUEUE: 'getmatchidsbyqueue',
    GET_MATCH_DETAILS_BATCH: 'getmatchdetailsbatch'
  };
  
  export const QUEUE_IDS = {
    NORMAL_CONQUEST: 426,
    RANKED_CONQUEST_PC: 451,
    RANKED_CONQUEST_CONTROLLER: 504,
  };
  
  export const LANGS = {
    ENGLISH: 1,
    GERMAN: 2,
    FRENCH: 3,
    CHINESE: 5,
    SPANISH: 7,
    SPANISH_LATAM: 9,
    PORTUGUESE: 10,
    RUSSIAN: 11,
    POLISH: 12,
    TURKISH: 13,
  };

  export const EXTRACT_LIST = [
    "Match",
    "Role",
    "Win_Status",
    "Reference_Name",
    "GodId",
    "Gold_Earned",
    "ActiveId1",
    "ActiveId2",
    "ItemId1",
    "ItemId2",
    "ItemId3",
    "ItemId4",
    "ItemId5",
    "ItemId6",
    "Deaths",
    "Kills_Player",
    "Assists"
  ]

  export const ROLES = [
    "Solo",
    "Jungle",
    "Carry",
    "Mid",
    "Support"
  ]

  export const WIN_STATUS = 'Winner'
  export const LOSE_STATUS = 'Loser'
  
  
  export const SMITE_API_KEYS = {
    HZ_PLAYER_NAME: 'hz_player_name',
    MATCH: 'Match',
    ENTRY_DATETIME: 'Entry_Datetime',
    WIN_STATUS: 'Win_Status',
    MAP_GAME: 'Map_Game',
    MATCH_DURATION: 'Match_Duration',
    REFERENCE_NAME: 'Reference_Name',
    NAME: 'name',
    PLAYER_ID: 'playerId',
    PARTY_ID: 'PartyId',
    PLAYER_NAME: 'playerName',
    ID: 'Id',
  };
  
  export const ERRORS = {
    CLIENT_NOT_READY: 'SmiteQL connection is not ready. Call async function SmiteQL.ready()',
    SESSION_EXPIRED: 'SmiteQL session is expired. Make a new session with SmiteApi.createSession().',
    PATCH_VERSION_NOT_SET: 'Patch version has not been set.',
    SCAN_MATCH_HISTORY_FAILURE: 'Options must contain one of: [index, limit] but not both',
  };
  
  export const SERVER = {
    PORT: PORT || 8080,
  };
  
  export const REDIS = {
    HOST: isProd ? REDIS_HOST : '127.0.0.1',
    PORT: isProd ? REDIS_PORT : '6379',
    AUTH: isProd ? REDIS_AUTH : '',
  };
  
  export const MOMENT = {
    HUMAN_TIME_FORMAT: 'MMMM Do YYYY, h:mm:ss a',
    SMITE_API_FORMAT: 'YYYYMMDDHHmmss',
  };
  
  export const PORTALS = {
    HIREZ: '1',
    STEAM: '5',
    PS4: '9',
    XBOX: '10',
    SWITCH: '22',
    DISCORD: '25',
    EPIC: '28',
    // reverse mapping
    1: 'HIREZ',
    5: 'STEAM',
    9: 'PS4',
    10: 'XBOX',
    22: 'SWITCH',
    25: 'DISCORD',
    28: 'EPIC',
  };
  
  export const REGEX = {
    // matches all words between encasing double underscore
    // '__dhko__' -> 'dhko'
    // '__a_b__' -> 'a_b'
    MATCH_BETWEEN_DOUBLE_UNDERSCRORE: /(?:__)(.*?)(?:__)/,
  };
  
  export const RETURN_MESSAGES = {
    // match details [0]
    PROFILE_HIDDEN: 'Player Privacy Flag set for this player.',
  };