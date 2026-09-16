import * as SecureStore from 'expo-secure-store';

/**
 * The Anthropic API key, stored in the platform keychain (not SQLite, not
 * plain storage) since it is a credential, not app data. Kept in its own
 * tiny module so nothing else needs to know it's SecureStore specifically.
 */
const KEY = 'anthropic_api_key';

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (trimmed) await SecureStore.setItemAsync(KEY, trimmed);
  else await SecureStore.deleteItemAsync(KEY);
}
