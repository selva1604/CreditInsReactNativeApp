import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import InsuranceProvidersScreen from './src/screens/InsuranceProvidersScreen';
import {
  CreditCard,
  InsuranceProvider,
  InsuranceType,
  PaymentAllocation,
  PaymentScope,
} from './src/types';
import { applyPayments, loadCards } from './src/services/cardService';
import { showMessage } from './src/utils/notify';

/**
 * Minimal two-screen navigation. When the app grows beyond a few screens,
 * switch to React Navigation (`npx expo install @react-navigation/native ...`).
 */
type Route =
  | { name: 'dashboard' }
  | { name: 'payment'; scope: PaymentScope }
  | { name: 'insurance'; type: InsuranceType };

export default function App() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  useEffect(() => {
    loadCards()
      .then(setCards)
      .catch(() => Alert.alert('Error', 'Could not load your cards.'))
      .finally(() => setLoading(false));
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
        />
      </View>
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
  hidden: { display: 'none' },
});
