import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

// Screens
import EmployeeDashboardScreen from '../screens/employee/EmployeeDashboardScreen';
import MobileCheckInScreen from '../screens/employee/MobileCheckInScreen';
import ManagementDashboardScreen from '../screens/management/ManagementDashboardScreen';
import EmployeesScreen from '../screens/management/EmployeesScreen';
import AttendanceScreen from '../screens/management/AttendanceScreen';
import KioskScreen from '../screens/management/KioskScreen';
import PayrollScreen from '../screens/management/PayrollScreen';
import SuperAdminDashboardScreen from '../screens/superadmin/SuperAdminDashboardScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const { role } = useContext(AuthContext);

  const getScreenOptions = (iconName) => ({
    headerShown: false,
    tabBarActiveTintColor: COLORS.emerald500,
    tabBarInactiveTintColor: COLORS.slate400,
    tabBarStyle: {
      backgroundColor: COLORS.navy800,
      borderTopColor: COLORS.slate700,
      height: 60,
      paddingBottom: 8,
    },
    tabBarIcon: ({ color, size }) => (
      <Ionicons name={iconName} size={size} color={color} />
    ),
  });

  if (role === 'EMPLOYEE') {
    return (
      <Tab.Navigator>
        <Tab.Screen
          name="EmployeeDashboard"
          component={EmployeeDashboardScreen}
          options={getScreenOptions('home-outline')}
        />
        <Tab.Screen
          name="MobileCheckIn"
          component={MobileCheckInScreen}
          options={getScreenOptions('camera-outline')}
        />
      </Tab.Navigator>
    );
  }

  if (['ADMIN', 'HR', 'MANAGER'].includes(role)) {
    return (
      <Tab.Navigator>
        <Tab.Screen
          name="ManagementDashboard"
          component={ManagementDashboardScreen}
          options={getScreenOptions('stats-chart-outline')}
        />
        <Tab.Screen
          name="Employees"
          component={EmployeesScreen}
          options={getScreenOptions('people-outline')}
        />
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={getScreenOptions('calendar-outline')}
        />
        <Tab.Screen
          name="Kiosk"
          component={KioskScreen}
          options={getScreenOptions('scan-outline')}
        />
        <Tab.Screen
          name="Payroll"
          component={PayrollScreen}
          options={getScreenOptions('cash-outline')}
        />
      </Tab.Navigator>
    );
  }

  if (role === 'SUPERADMIN') {
    return (
      <Tab.Navigator>
        <Tab.Screen
          name="SuperAdminDashboard"
          component={SuperAdminDashboardScreen}
          options={getScreenOptions('shield-checkmark-outline')}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="EmployeeDashboard"
        component={EmployeeDashboardScreen}
        options={getScreenOptions('home-outline')}
      />
    </Tab.Navigator>
  );
}
