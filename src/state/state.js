// DOM references and shared mutable app state.

const main = document.querySelector("#main-content");
const appShell = document.querySelector("#app-shell");
const nav = document.querySelector("#sidebar-nav");
const toast = document.querySelector("#toast");
const profileMenu = document.querySelector("#profile-menu");
const profileToggle = document.querySelector("#profile-toggle");
const farmPopover = document.querySelector("#farm-popover");
const farmSwitcher = document.querySelector("#farm-switcher");
const sidebar = document.querySelector("#sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const importFile = document.querySelector("#import-file");
const authScreen = document.querySelector("#auth-screen");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSuccess = document.querySelector("#auth-success");
const authSubmitButton = document.querySelector("#auth-submit-btn");
const farmNameGroup = document.querySelector("#farm-name-group");
const authFarmName = document.querySelector("#auth-farm-name");
const signOutButton = document.querySelector("#sign-out");
const importLocalDataButton = document.querySelector("#import-local-data");
let toastTimer;
let listState = {};
let isSupabaseMode = false;
let isSignUpMode = false;
let sb = null;
let currentUser = null;
let currentFarmName = "Green Valley Farm";
let currentFarmId = null;
let farms = [];
let farmProfile = createDefaultFarmProfile();
let farmProfileStatus = "idle";
let farmRegion = loadLocalFarmRegion();
let weatherState = { status: "loading", data: null, error: "" };
let holidaySyncState = { status: "idle", error: "" };
let currentRole = null; // role of the signed-in user in the current farm (cloud mode only)
let pendingInvitations = []; // farm invitations waiting for the signed-in user
let teamState = { farmId: null, status: "idle", members: [], invitations: [], error: "" };

let store = loadStore();
