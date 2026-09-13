import * as Network from 'expo-network';

export async function hasInternetConnection() {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function onNetworkAvailable(callback: () => void | Promise<void>) {
  let lastConnected = false;
  const subscription = Network.addNetworkStateListener(state => {
    const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (connected && !lastConnected) void callback();
    lastConnected = connected;
  });
  return () => subscription.remove();
}
