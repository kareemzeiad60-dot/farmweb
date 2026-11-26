// Commit changes to the local browser store or to Supabase.

async function commit(nextStore, cloudChanges = []) {
  if (isSupabaseMode) {
    if (!sb || !currentUser || !currentFarmId) {
      showToast("Choose a farm before changing cloud records.");
      return false;
    }
    const targetFarmId = currentFarmId;
    const targetUserId = currentUser.id;
    try {
      await persistCloudChanges(cloudChanges, targetFarmId, targetUserId);
    } catch (error) {
      console.error("Could not sync farm data with Supabase.", error);
      showToast(`Changes were not synced: ${error.message || "Cloud service request failed."}`);
      return false;
    }
    if (currentFarmId === targetFarmId && currentUser?.id === targetUserId) store = nextStore;
    return true;
  }

  const previous = store;
  store = nextStore;
  try {
    localStorage.setItem(storageKey, JSON.stringify(store));
  } catch (error) {
    store = previous;
    console.error("Could not save farm data.", error);
    showToast("Changes were not saved. Check this browser's storage settings.");
    return false;
  }
  return true;
}
