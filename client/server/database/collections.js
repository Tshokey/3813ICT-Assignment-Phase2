const { getDb } = require("./db")

/**
 * Get users collection
 */
function getUsersCollection() {
  return getDb().collection("users")
}

/**
 * Get groups collection
 */
function getGroupsCollection() {
  return getDb().collection("groups")
}

/**
 * Get channels collection
 */
function getChannelsCollection() {
  return getDb().collection("channels")
}

/**
 * Get messages collection
 */
function getMessagesCollection() {
  return getDb().collection("messages")
}

/**
 * Get user reports collection
 */
function getUserReportsCollection() {
  return getDb().collection("userReports")
}

module.exports = {
  getUsersCollection,
  getGroupsCollection,
  getChannelsCollection,
  getMessagesCollection,
  getUserReportsCollection,
}
