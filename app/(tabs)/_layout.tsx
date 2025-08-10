import { Tabs } from 'expo-router';
import { BookOpen, FileText, Compass, Settings, Plus } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

function ExploreTabButton() {
  const router = useRouter();
  
  return (
    <TouchableOpacity
      style={styles.exploreButton}
      onPress={() => router.push('/explore')}
    >
      <Compass size={32} color="#FFF" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 90,
          paddingBottom: 25,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reader"
        options={{
          title: 'Reader',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '',
          tabBarButton: (props) => (
            <View style={styles.exploreTabContainer}>
              <ExploreTabButton />
              <View style={styles.exploreLabel}>
                <Text style={styles.exploreLabelText}>Explore</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  exploreTabContainer: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  exploreButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  exploreLabel: {
    marginTop: 8,
  },
  exploreLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
});