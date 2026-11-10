import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import InsuranceProvidersScreen from './src/screens/InsuranceProvidersScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { UserProfile, loadProfile, saveProfile } from './src/services/profileService';
import { AuthSession, formatIndianMobile, logout, restoreSession } from './src/services/authService';
import { colors } from './src/theme';
import {
  CreditCard,
  InsuranceProvider,
  InsuranceType,
  PaymentAllocation,
  PaymentScope,
} from './src/types';
import { applyPayments, loadCards } from './src/services/cardService';
import { confirmAction, showMessage } from './src/utils/notify';

/**
 * Minimal two-screen navigation. When the app grows beyond a few screens,
 * switch to React Navigation (`npx expo install @react-navigation/native ...`).
 */
type Route =
  | { name: 'dashboard' }
  | { name: 'payment'; scope: PaymentScope }
  | { name: 'insurance'; type: InsuranceType }
  | { name: 'profile' };

export default function App() {
  /** undefined = still checking for a saved session, null = logged out */
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  useEffect(() => {
    restoreSession()
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

  // Load the user's cards whenever someone logs in.
  const token = session?.token;
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    loadCards()
      .then(setCards)
      .catch(() => Alert.alert('Error', 'Could not load your cards.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Load the profile (name + photo) for the logged-in number.
  const phone = session?.phone;
  useEffect(() => {
    if (!phone) return;
    loadProfile(phone)
      .then(setProfile)
      .catch(() => setProfile({ phone, name: '', photoUri: null, updatedAt: new Date().toISOString() }));
  }, [phone]);

  const handleSaveProfile = useCallback(async (next: UserProfile) => {
    setProfile(await saveProfile(next));
  }, []);

  const handleLogout = useCallback(async () => {
    const ok = await confirmAction('Log out', 'Are you sure you want to log out?', 'Log out');
    if (!ok) return;
    await logout();
    setCards([]);
    setProfile(null);
    setRoute({ name: 'dashboard' });
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setCards(await loadCards());
    } catch {
      Alert.alert('Error', 'Could not refresh your cards.');
    }
  }, []);

  const handlePaid = useCallback((allocations: PaymentAllocation[]) => {
    setCards((prev) => applyPayments(prev, allocations));
  }, []);

  const goToDashboard = useCallback(() => setRoute({ name: 'dashboard' }), []);

  const totalPoints = cards.reduce((s, c) => s + c.rewardPoints, 0);

  // TODO: replace with navigation to the policy renewal details screen.
  const handleProviderSelected = useCallback((provider: InsuranceProvider) => {
    showMessage(provider.name, 'Policy renewal with this insurance company is coming soon.');
  }, []);

  if (session === undefined) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={[styles.fill, styles.center]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (session === null) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoginScreen onLoggedIn={setSession} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* Dashboard stays mounted so its scroll position and selected card are kept. */}
      <View style={[styles.fill, route.name !== 'dashboard' && styles.hidden]}>
        <DashboardScreen
          cards={cards}
          loading={loading}
          onRefresh={refresh}
          onPay={(scope) => setRoute({ name: 'payment', scope })}
          onRenewInsurance={(type) => setRoute({ name: 'insurance', type })}
          displayName={profile?.name || formatIndianMobile(session.phone)}
          profileName={profile?.name ?? ''}
          photoUri={profile?.photoUri ?? null}
          onOpenProfile={() => setRoute({ name: 'profile' })}
        />
      </View>
      {route.name === 'profile' && profile && (
        <View style={styles.fill}>
          <ProfileScreen
            profile={profile}
            loggedInAt={session.loggedInAt}
            onBack={goToDashboard}
            onSave={handleSaveProfile}
            onLogout={handleLogout}
          />
        </View>
      )}
      {route.name === 'payment' && (
        <View style={styles.fill}>
          <PaymentScreen
            cards={cards}
            initialScope={route.scope}
            onBack={goToDashboard}
            onPaid={handlePaid}
          />
        </View>
      )}
      {route.name === 'insurance' && (
        <View style={styles.fill}>
          <InsuranceProvidersScreen
            key={route.type}
            type={route.type}
            rewardPoints={totalPoints}
            onBack={goToDashboard}
            onContinue={handleProviderSelected}
          />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  hidden: { display: 'none' },
});
