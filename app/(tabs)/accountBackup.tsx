// import React, { useEffect, useState } from 'react';
// import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
// import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import { createAccount, deleteAccount, fetchAccounts, updateAccountBalance, updateAccountName } from '../services/backendService';
// import { Account } from '../types/types';

// import { Ionicons } from '@expo/vector-icons';
// import AccountCard from '../components/AccountsPage/AccountCard';
// import AddAccountModal from '../components/AccountsPage/AddAccountModal';
// import AddMoneyModal from '../components/AccountsPage/AddMoneyModal';
// import EditAccountModal from '../components/AccountsPage/EditAccountModal';
// import { useAuth } from '../context/AuthContext';
// import { useTheme } from '../context/ThemeContext';

// const Accounts: React.FC = () => {
//   const isDark = useColorScheme() === 'dark';
//   const [accounts, setAccounts] = useState<Account[]>([]);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [addMoneyModalVisible, setaddMoneyModalVisible] = useState(false);
//   const [addAccountModalVisible, setAddAccountModalVisible] = useState(false);
//   const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
//   const [editName, setEditName] = useState('');
//   const [editBalance, setEditBalance] = useState('');
//   const [addAmount, setAddAmount] = useState('');
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const { isDarkMode } = useTheme();
//   const insets = useSafeAreaInsets();

//   const {userId, isLoading} = useAuth();
//   const loadAccounts = async () => {
//     try {
//       const data: Account[] = await fetchAccounts();
//       setAccounts(data);
//     } catch (err) {
//       console.error('Failed to fetch accounts:', err);
//     }
//   };
  
//   const handleAddAccount = async (name: string, balance: number) => {
//     try {
//       const newAccount = await createAccount(name, balance, userId);
      
//       setAccounts(prev => [...prev, newAccount]);
      
//       setAddAccountModalVisible(false);
//     } catch (err) {
//       console.error('Failed to add account:', err);
//     }
//   };
  
  
//   const handleCardPress = (account: Account) => {
//     if (isEditMode) {
//       setModalVisible(true);
//       setSelectedAccount(account);
//       setEditName(account.account_name);
//       setEditBalance(account.balance.toString());
//     }
//   };
  
//   const handleAddMoneyPress = (account: Account) => {
//     setSelectedAccount(account);
//     setAddAmount('');
//     setaddMoneyModalVisible(true);
//   };
  
//   const handleSave = () => {
//     if (!selectedAccount) return;
//     const newBalance = parseFloat(editBalance) || 0;

//     setAccounts(prev =>
//       prev.map(acc =>
//         acc.id === selectedAccount.id
//         ? { ...acc, account_name: editName, balance: newBalance }
//         : acc
//       )
//     );
//     if (selectedAccount.account_name !== editName) updateAccountName(selectedAccount.account_name, editName);
//     updateAccountBalance(selectedAccount.account_name, newBalance);
//     setModalVisible(false);
//     setSelectedAccount(null);
//   };
  
//   const handleAddMoney = () => {
//     if (!selectedAccount) return;
//     const amount = parseFloat(addAmount) || 0;
//     setAccounts(prev =>
//       prev.map(acc =>
//         acc.id === selectedAccount.id
//         ? { ...acc, balance: acc.balance + amount }
//         : acc
//       )
//     );
//     updateAccountBalance(selectedAccount.account_name, selectedAccount.balance + amount);
//     setaddMoneyModalVisible(false);
//    setSelectedAccount(null);
//   };
  
//   const handleCancel = () => {
//     setModalVisible(false);
//     setaddMoneyModalVisible(false);
//     setSelectedAccount(null);
//   };
  
//   const refreshData = async () => {
//     setIsRefreshing(true);
//     try {
//       await loadAccounts();
//     } catch (err) {
//       throw err;
//     }
//     finally {
//       setIsRefreshing(false);
//     }
//   }
//   const toggleEditMode = () => {
//     setIsEditMode(!isEditMode);
//   };
  
//   const handleDeleteAccount = (accountId: number) => {
//     Alert.alert(
//       'Delete Account',
//       'Are you sure you want to delete this account?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteAccount(accountId);
//               setAccounts(prev => prev.filter(acc => acc.id !== accountId));
//             } catch (err) {
//               console.error('Failed to delete account:', err);
//             }
//           },
//         },
//       ]
//     );
//   };
  
//   const formatBalance = (balance: number): string => {
//     return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(balance);
//   };
  
//   useEffect(() => {
//     loadAccounts();
//   }, []);

//   return (
//     <SafeAreaProvider>
//     <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
//       {/* Top Label + Edit Button */}
//       <View className="relative py-3">
//         <Text className="text-3xl font-bold text-textLight dark:text-textDark text-center">
//           Accounts
//         </Text>
//         <TouchableOpacity
//           onPress={toggleEditMode}
//           className="absolute right-4 top-7 -translate-y-1/2 px-6 py-1 rounded-lg bg-accentTeal items-center"
//           >
//           <Text className={`text-base font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
//             {isEditMode ? 'Done' : 'Edit'}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Cards scrollable */}
//       <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}
//       refreshControl={
//         <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
//       }>
//         {accounts.map(account => (
//           <View key={account.id} className="relative mb-3">
//             <AccountCard
//               account={account}
//               onPress={() => handleCardPress(account)}
//               onAddPress={() => handleAddMoneyPress(account)}
//               formatBalance={formatBalance}
//             />
//             {isEditMode && (
//               <TouchableOpacity
//                 onPress={() => handleDeleteAccount(account.id)}
//                 className="absolute top-0 right-0 w-6 h-6 rounded-full bg-accentRed justify-center items-center"
//               >
//                 <Ionicons name="remove" size={16} color="white" />
//               </TouchableOpacity>
//             )}
//           </View>
//         ))}
//       </ScrollView>

//       {/* Add Account button fixed at bottom */}
//       { isEditMode && (
//         <View className="p-2 bg-background dark:bg-backgroundDark border-t border-borderLight dark:border-borderDark"
//         style={{ paddingBottom: insets.bottom + 65 }}>
//         <TouchableOpacity
//           className="bg-backgroundMuted dark:bg-white p-5 rounded-xl shadow-sm flex-row justify-center items-center"
//           onPress={() => setAddAccountModalVisible(true)}
//         >
//           <Text className={`text-lg font-semibold text-accentTeal ${isDark ? 'text-textLight' : 'text-textDark'} mb-1`}>
//             Add Account
//           </Text>
//         </TouchableOpacity>
//       </View>
      
//       )}

//       {/* Modals */}

//       <EditAccountModal
//         visible={modalVisible}
//         name={editName}
//         balance={editBalance}
//         onChangeName={setEditName}
//         onChangeBalance={setEditBalance}
//         onCancel={handleCancel}
//         onSave={handleSave}
//       />
//       <AddMoneyModal
//         visible={addMoneyModalVisible}
//         accountName={selectedAccount?.account_name}
//         amount={addAmount}
//         onChangeAmount={setAddAmount}
//         onCancel={handleCancel}
//         onAdd={handleAddMoney}
//       />
//       <AddAccountModal
//         visible={addAccountModalVisible}
//         onCancel={() => setAddAccountModalVisible(false)}
//         onSave={handleAddAccount}
//         />
//     </SafeAreaView>
//   </SafeAreaProvider>
//   );
// };

// export default Accounts;


// import { useState } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   TextInput,
//   Modal,
// } from 'react-native';
// import { CreditCard, PiggyBank, TrendingUp, MoreVertical, Plus, Edit2, Trash2 } from 'lucide-react-native';

// interface Account {
//   id: number;
//   name: string;
//   type: 'checking' | 'savings' | 'credit' | 'investment';
//   balance: number;
//   icon: any;
//   colorClass: string;
// }

// const initialAccounts: Account[] = [
//   { id: 1, name: 'Main Checking', type: 'checking', balance: 5420.50, icon: CreditCard, colorClass: 'bg-accentBlue' },
//   { id: 2, name: 'Savings', type: 'savings', balance: 8250.25, icon: PiggyBank, colorClass: 'bg-accentTeal' },
//   { id: 3, name: 'Credit Card', type: 'credit', balance: -1220.00, icon: CreditCard, colorClass: 'bg-accentRed' },
//   { id: 4, name: 'Investment', type: 'investment', balance: 15320.80, icon: TrendingUp, colorClass: 'bg-accentPurple' },
// ];

// interface AccountsProps {
//   onEditAccount: (accountId: number) => void;
// }

// export default function Accounts({ onEditAccount }: AccountsProps) {
//   const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [editingAccount, setEditingAccount] = useState<number | null>(null);
//   const [newAccountName, setNewAccountName] = useState('');
//   const [newAccountBalance, setNewAccountBalance] = useState('');

//   const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

//   const deleteAccount = (id: number) => {
//     setAccounts(accounts.filter(acc => acc.id !== id));
//     setEditingAccount(null);
//   };

//   return (
//     <View className="flex-1 bg-backgroundDark">
//       <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
//         <View className="p-6 space-y-6">
//           {/* Header */}
//           <View className="flex-row items-center justify-between mb-6">
//             <View>
//               <Text className="text-2xl font-semibold text-textDark">My Accounts</Text>
//               <Text className="text-secondaryDark mt-1">Manage your financial accounts</Text>
//             </View>
//             <TouchableOpacity
//               onPress={() => setShowAddModal(true)}
//               className="w-10 h-10 bg-accentBlue rounded-full items-center justify-center active:opacity-80"
//             >
//               <Plus color="#FFFFFF" size={20} />
//             </TouchableOpacity>
//           </View>

//           {/* Total Balance */}
//           <View className="bg-accentBlue rounded-2xl p-6 mb-6">
//             <Text className="text-textDark/70 text-sm mb-2">Total Net Worth</Text>
//             <Text className="text-textDark text-3xl font-semibold mb-4">
//               ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//             </Text>
//             <View className="flex-row gap-4">
//               <View>
//                 <Text className="text-textDark/70 text-xs">Accounts</Text>
//                 <Text className="text-textDark text-xl font-medium mt-1">{accounts.length}</Text>
//               </View>
//             </View>
//           </View>

//           {/* Accounts List */}
//           <View>
//             <Text className="text-textDark text-base font-medium mb-3">All Accounts</Text>
//             {accounts.map((account) => {
//               const Icon = account.icon;
//               return (
//                 <View key={account.id} className="mb-4">
//                   <View className="bg-surfaceDark rounded-2xl p-4 border border-borderDark">
//                     <View className="flex-row items-center justify-between">
//                       <View className="flex-row items-center flex-1">
//                         <View className={`w-12 h-12 ${account.colorClass} rounded-xl items-center justify-center`}>
//                           <Icon color="#FFFFFF" size={24} />
//                         </View>
//                         <View className="flex-1 ml-4">
//                           <Text className="text-textDark font-medium">{account.name}</Text>
//                           <Text className="text-secondaryDark text-sm capitalize mt-0.5">{account.type}</Text>
//                         </View>
//                         <View className="items-end">
//                           <Text className={`text-lg font-medium ${account.balance < 0 ? 'text-accentRed' : 'text-textDark'}`}>
//                             ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                           </Text>
//                           {account.balance < 0 && (
//                             <Text className="text-xs text-accentRed mt-0.5">Outstanding</Text>
//                           )}
//                         </View>
//                       </View>
//                       <TouchableOpacity
//                         onPress={() => setEditingAccount(editingAccount === account.id ? null : account.id)}
//                         className="w-8 h-8 items-center justify-center ml-2 active:opacity-70"
//                       >
//                         <MoreVertical color="#9CA3AF" size={20} />
//                       </TouchableOpacity>
//                     </View>
//                   </View>
                  
//                   {editingAccount === account.id && (
//                     <View className="bg-inputDark rounded-lg mt-3 border border-borderDark overflow-hidden">
//                       <TouchableOpacity
//                         className="flex-row items-center px-4 py-3 active:bg-borderDark"
//                         onPress={() => {
//                           setEditingAccount(null);
//                           onEditAccount(account.id);
//                         }}
//                       >
//                         <Edit2 color="#D1D5DB" size={16} />
//                         <Text className="text-secondaryDark text-sm ml-2">Edit</Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         className="flex-row items-center px-4 py-3 active:bg-borderDark"
//                         onPress={() => deleteAccount(account.id)}
//                       >
//                         <Trash2 color="#EF4444" size={16} />
//                         <Text className="text-accentRed text-sm ml-2">Delete</Text>
//                       </TouchableOpacity>
//                     </View>
//                   )}
//                 </View>
//               );
//             })}
//           </View>
//         </View>
//       </ScrollView>

//       {/* Add Account Modal */}
//       <Modal
//         visible={showAddModal}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setShowAddModal(false)}
//       >
//         <TouchableOpacity
//           className="flex-1 bg-black/70 justify-end"
//           activeOpacity={1}
//           onPress={() => setShowAddModal(false)}
//         >
//           <TouchableOpacity
//             className="bg-surfaceDark rounded-t-3xl p-6 border-t border-borderDark"
//             activeOpacity={1}
//             onPress={(e) => e.stopPropagation()}
//           >
//             <View className="w-12 h-1 bg-borderDark rounded-full self-center mb-6" />
//             <Text className="text-xl font-semibold text-textDark mb-4">Add New Account</Text>
            
//             <View className="mb-4">
//               <Text className="text-sm text-secondaryDark mb-2">Account Name</Text>
//               <TextInput
//                 className="w-full px-4 py-3 bg-inputDark border border-borderDark rounded-xl text-textDark"
//                 placeholder="e.g., Emergency Fund"
//                 placeholderTextColor="#AAAAAA"
//                 value={newAccountName}
//                 onChangeText={setNewAccountName}
//               />
//             </View>

//             <View className="mb-4">
//               <Text className="text-sm text-secondaryDark mb-2">Account Type</Text>
//               <View className="w-full px-4 py-3 bg-inputDark border border-borderDark rounded-xl">
//                 <Text className="text-textDark">Checking</Text>
//               </View>
//             </View>

//             <View className="mb-4">
//               <Text className="text-sm text-secondaryDark mb-2">Balance</Text>
//               <TextInput
//                 className="w-full px-4 py-3 bg-inputDark border border-borderDark rounded-xl text-textDark"
//                 placeholder="0.00"
//                 placeholderTextColor="#AAAAAA"
//                 keyboardType="decimal-pad"
//                 value={newAccountBalance}
//                 onChangeText={setNewAccountBalance}
//               />
//             </View>

//             <TouchableOpacity className="w-full bg-accentBlue py-4 rounded-xl items-center active:opacity-80">
//               <Text className="text-textDark text-base font-semibold">Add Account</Text>
//             </TouchableOpacity>
//           </TouchableOpacity>
//         </TouchableOpacity>
//       </Modal>
//     </View>
//   );
// }