// The default admin Id. Change this to sysadmin or president's information
export const adminId = "000000000";
export const adminName = "Admin";
export const adminUsername = "admin";
export const defaultAdminPassword = "admin";
export const cookieSecret = 'k334tm3443rebp5p432pk2543kpkp524254';

export const failsBeforeLockout = 5;
export const lockoutLength = 30; // in seconds
export const nukeOnRestart = false; // debugging purposes
export const usernameRegex = /^[\d\w]{4,}$/; // succeeds if match, allows letters, numbers, and underscores
export const nameRegex = /^[a-zA-Z'\s]*$/; // succeeds if match, allows letters and spaces

export const labMonitorPassphrase = "labMonitor2015";
export const execPassphrase = "execsAreExecs";
export const adminPassphrase = "adminzRule";

export const internalPort = 8181;
export const externalPort = 8182;