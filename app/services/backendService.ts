import { CategoryAggregation, CategoryIconInfo, Goal, GoalContribution, Transaction } from "../types/types";
import { supabase } from "../utils/supabase";

export const createTransaction = async (payload: any) => {
  const { data, error } = await supabase
    .from('Transactions')
    .insert([payload])
    .select();
  if (error) throw error;
  return data;
};

// Create a money transfer between two accounts (balance update only, no transactions)
export const createTransfer = async (payload: {
  from_account: string;
  to_account: string;
  amount: number;
  user_id: string;
}): Promise<void> => {
  // Fetch current balances
  const { data: accounts, error: fetchError } = await supabase
    .from('Accounts')
    .select('account_name, balance')
    .in('account_name', [payload.from_account, payload.to_account]);

  if (fetchError) throw fetchError;

  const sourceAccount = accounts?.find(a => a.account_name === payload.from_account);
  const destAccount = accounts?.find(a => a.account_name === payload.to_account);

  if (!sourceAccount || !destAccount) {
    throw new Error('One or both accounts not found');
  }

  // Update source account balance
  const { error: sourceError } = await supabase
    .from('Accounts')
    .update({ balance: sourceAccount.balance - Math.abs(payload.amount) })
    .eq('account_name', payload.from_account);

  if (sourceError) throw sourceError;

  // Update destination account balance
  const { error: destError } = await supabase
    .from('Accounts')
    .update({ balance: destAccount.balance + Math.abs(payload.amount) })
    .eq('account_name', payload.to_account);

  if (destError) throw destError;
};

// Delete a transfer (deletes both linked transactions and reverses account balances)
export const deleteTransfer = async (transfer_id: string, user_id: string) => {
  // First, fetch the transfer transactions to get amounts and accounts
  const { data: transactions, error: fetchError } = await supabase
    .from('Transactions')
    .select('id, amount, account_name')
    .eq('transfer_id', transfer_id)
    .eq('user_id', user_id);

  if (fetchError) throw fetchError;
  if (!transactions || transactions.length === 0) {
    throw new Error('Transfer not found');
  }

  // Fetch current account balances for the affected accounts
  const accountNames = transactions.map(t => t.account_name);
  const { data: accounts, error: accountsError } = await supabase
    .from('Accounts')
    .select('account_name, balance')
    .in('account_name', accountNames);

  if (accountsError) throw accountsError;

  // Reverse the balance changes for each transaction
  for (const transaction of transactions) {
    const account = accounts?.find(a => a.account_name === transaction.account_name);
    if (account) {
      // Reverse: if transaction was -100 (outgoing), add 100 back; if +100 (incoming), subtract 100
      const newBalance = account.balance - transaction.amount;
      await updateAccountBalance(account.account_name, newBalance);
    }
  }

  // Now delete the transactions
  const { data, error } = await supabase
    .from('Transactions')
    .delete()
    .eq('transfer_id', transfer_id)
    .eq('user_id', user_id)
    .select();

  if (error) throw error;
  return data;
};



export async function getUserCurrency() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('Profiles')
    .select('currency')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching currency:', error.message);
    return null;
  }

  return data.currency; // Returns e.g., "USD"
}


export async function updateUserCurrency(newCurrency: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from('Profiles')
    .update({ 
      currency: newCurrency,
      updated_at: new Date().toISOString() // Manual update if you didn't add the Postgres Trigger
    })
    .eq('id', user.id)
    .select(); // Returns the updated row

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ============ Income & Savings Settings ============

export interface IncomeSettings {
  use_dynamic_income: boolean;
  manual_income: number;
  monthly_savings_target: number;
}

export async function getIncomeSettings(): Promise<IncomeSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('Profiles')
    .select('use_dynamic_income, manual_income, monthly_savings_target')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching income settings:', error.message);
    return null;
  }

  return {
    use_dynamic_income: data.use_dynamic_income ?? true,
    manual_income: data.manual_income ?? 0,
    monthly_savings_target: data.monthly_savings_target ?? 0,
  };
}

export async function updateIncomeSettings(settings: Partial<IncomeSettings>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from('Profiles')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export const fetchCategories = async () => {
    const { data, error } = await supabase.from("Categories").select("*");
    if (error) throw error;
    return data ?? [];
};

export const bulkCreateCategories = async (
  userId: string,
  categories: Array<{
    category_name: string;
    icon: string;
    color: string;
    budget_amount?: number | null;
  }>
) => {
  const payload = categories.map((cat, index) => ({
    ...cat,
    user_id: userId,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from('Categories')
    .insert(payload)
    .select();

  if (error) throw error;
  return data;
};

export const fetchAccounts = async () => {
  const { data, error } = await supabase.from("Accounts").select("*");
  if (error) throw error;
  return data ?? [];
}

export const fetchAccountNames = async () => {
  const { data, error } = await supabase.from("Accounts").select("account_name");
  if (error) throw error;
  return data ?? [];
}

export const fetchTransactions = async (
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
    .from("Transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching transactions:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching transactions:", err);
    return [];
  }
};

export const fetchFilteredTransactions = async (options: {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<Transaction[]> => {
  try {
    let query = supabase
      .from("Transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (options.category) {
      query = query.eq("category_name", options.category);
    }
    if (options.startDate) {
      query = query.gte("created_at", options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte("created_at", options.endDate.toISOString());
    }

    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching filtered transactions:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching filtered transactions:", err);
    return [];
  }
};


export const fetchTotalBalance = async (): Promise<number> => {
    const { data, error } = await supabase.rpc('fetch_total_balance');
    if (error) throw error;
    return data ?? 0;
  };

export const fetchCheckingBalance = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('Accounts')
      .select('balance')
      .eq('type', 'checking');
    if (error) throw error;
    return (data ?? []).reduce((sum, acc) => sum + (acc.balance || 0), 0);
  };
  
  // Fetch only Income category
export const fetchIncomeTransactionsTotal = async (startDate: Date, endDate: Date): Promise<number> => {
  const { data, error } = await supabase
    .from("Transactions")
    .select("amount")
    .eq("category_name", "Income")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());
    
    if (error) throw error;
    
    const total = data?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
    return total;
  };
  
  // Modified: Fetch transactions excluding Income and Transfer
  export const fetchTransactionsByDateRange = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    const { data, error } = await supabase
    .from("Transactions")
    .select("*")
    .neq("category_name", "Income")  // Exclude Income
    .neq("category_name", "Transfer")  // Exclude Transfer
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
};


// Fetch total for all transactions EXCLUDING Income
export const fetchTotalExpenses = async (startDate: Date, endDate: Date): Promise<number> => {
  const { data, error } = await supabase.rpc("get_transaction_total", {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
    p_exclude_category: "Income" // Excludes Income to get expenses
  });

  if (error) {
    console.error("Error fetching total expense transactions:", error);
    throw error;
  }
  
  return data ?? 0;
};

// 2. Fetch Total Income (Matching your second function's structure)
export const fetchTotalIncome = async (startDate: Date, endDate: Date): Promise<number> => {
  const { data, error } = await supabase.rpc("get_transaction_total", {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
    p_category_name: "Income" // Only sums "Income"
  });
  
  if (error) {
    console.error("Error fetching total income:", error);
    throw error;
  }
  
  return data ?? 0;
};



// Modified: Fetch category aggregates excluding Income and Transfer
export const fetchCategoryAggregates = async (startDate: Date, endDate: Date): Promise<CategoryAggregation[]> => {
  const { data, error } = await supabase.rpc('fetch_category_aggregates', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });
  if (error) throw error;

  // Filter out Income and Transfer categories
  return (data ?? []).filter((cat: CategoryAggregation) =>
    cat.category_name !== 'Income' && cat.category_name !== 'Transfer'
  );
};




export const createAccount = async (accountName: string, balance: number, type: string, user_id: string, sort_order?: number) => {
  const { data, error } = await supabase
  .from('Accounts')
  .insert({ account_name: accountName, balance: balance, user_id: user_id, type: type, sort_order: sort_order ?? 1 })
  .select()
  .single();

  if (error) throw error;
  return data;
}

export const updateTransaction = async (id: number, newAmount: number, newDescription: string, 
  newAccount: string,newCategory: string, newDate: string) => {
  const { data, error } = await supabase
    .from('Transactions')
    .update({ 
      amount: newAmount, 
      description: newDescription, 
      account_name: newAccount,
      category_name: newCategory, // Update the category
      created_at: newDate         // Update the timestamp
    })
    .eq('id', id)
    .select();
  
    if (error) {
      console.error("Error updating transaction:", error.message);
    throw error;
  }
  return data;
}

export const updateAccountName = async (accountName: string, newName: string) => {
  const { data, error } = await supabase
  .from('Accounts')
  .update({ account_name: newName })
  .eq('account_name', accountName)
  .select();
  
  if (error) throw error;
  return data;
}


export const updateAccountType = async (accountName: string, newType: string) => {
  const { data, error } = await supabase
    .from('Accounts')
    .update({ type: newType })
    .eq('account_name', accountName)
    .select();

  if (error) throw error;
  return data;
}

export const updateAccountBalance = async (accountName: string, newBalance: number) => {
    const { data, error } = await supabase
    .from('Accounts')
      .update({ balance: newBalance })
      .eq('account_name', accountName)
      .select();

      if (error) throw error;
      return data;
    }

export const updateAccountSortOrder = async (accountId: number, newSortOrder: number) => {
  const { data, error } = await supabase
    .from('Accounts')
    .update({ sort_order: newSortOrder })
    .eq('id', accountId)
    .select();

  if (error) throw error;
  return data;
}

export const reorderAccountPosition = async (
  accountId: number,
  oldPosition: number,
  newPosition: number,
  allAccounts: { id: number; sort_order?: number }[]
) => {
  if (oldPosition === newPosition) return;

  const updates: { id: number; sort_order: number }[] = [];

  if (newPosition < oldPosition) {
    // Moving up: shift accounts between newPosition and oldPosition-1 down by 1
    for (const acc of allAccounts) {
      const pos = acc.sort_order ?? 0;
      if (acc.id === accountId) {
        updates.push({ id: acc.id, sort_order: newPosition });
      } else if (pos >= newPosition && pos < oldPosition) {
        updates.push({ id: acc.id, sort_order: pos + 1 });
      }
    }
  } else {
    // Moving down: shift accounts between oldPosition+1 and newPosition up by 1
    for (const acc of allAccounts) {
      const pos = acc.sort_order ?? 0;
      if (acc.id === accountId) {
        updates.push({ id: acc.id, sort_order: newPosition });
      } else if (pos > oldPosition && pos <= newPosition) {
        updates.push({ id: acc.id, sort_order: pos - 1 });
      }
    }
  }

  if (updates.length > 0) {
    await updateAccountsOrder(updates);
  }
}

export const shiftAccountsForInsert = async (
  insertPosition: number,
  allAccounts: { id: number; sort_order?: number }[]
) => {
  // Shift all accounts at insertPosition or higher by +1 to make room
  const updates: { id: number; sort_order: number }[] = [];

  for (const acc of allAccounts) {
    const pos = acc.sort_order ?? 0;
    if (pos >= insertPosition) {
      updates.push({ id: acc.id, sort_order: pos + 1 });
    }
  }

  if (updates.length > 0) {
    await updateAccountsOrder(updates);
  }
}

    export const deleteTransaction = async (id: number, user_id: string) => {
  const { data, error } = await supabase
  .from('Transactions')
  .delete()
  .eq('id', id)
  .eq('user_id', user_id)
  .select();
  
  if (error) throw error;
  return data;
}

export const deleteAccount = async (id: number) => {
  const { data, error } = await supabase
  .from('Accounts')
  .delete()
  .eq('id', id)
  .select();
  
  if (error) throw error;
  return data;
} 

export const upsertCategory = async (payload: { 
  id?: number, 
  category_name: string, 
  icon: string, 
  color: string, 
  user_id: string 
}) => {
  const { data, error } = await supabase
    .from('Categories')
    .upsert([payload], { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveCategory = async (
  userId: string,
  payload: { category_name: string; icon: string; color: string },
  id?: number
) => {
  if (id) {
    const { data, error } = await supabase
      .from('Categories')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('Categories')
      .insert([{ ...payload, user_id: userId }])
      .select();
    if (error) throw error;
    return data;
  }
};

export  const getUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
};
export async function deleteCategory(id: number, user_id: string) {
  const { data, error } = await supabase
      .from('Categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)
      .select();
      
    if (error) throw error;
    return data;
}


export async function fetchCategoryIcons(): Promise<Record<string, CategoryIconInfo>> {
  const { data, error } = await supabase
  .from("Categories")
  .select("category_name, icon, color");

  if (error) throw error;

  const icons: Record<string, CategoryIconInfo> = {};
  if (data) {
    data.forEach((c: any) => {
        icons[c.category_name] = { icon: c.icon, color: c.color };
      });
    }

    return icons;
  }

export const updateAccountsOrder = async (accounts: { id: number; sort_order: number }[]) => {
  const updates = accounts.map(({ id, sort_order }) =>
    supabase.from('Accounts').update({ sort_order }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const error = results.find(r => r.error)?.error;
  if (error) throw error;
};

export const updateCategoriesOrder = async (categories: { id: number; sort_order: number }[]) => {
  const updates = categories.map(({ id, sort_order }) =>
    supabase.from('Categories').update({ sort_order }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const error = results.find(r => r.error)?.error;
  if (error) throw error;
};

// Budget Functions

export const fetchIncomeForPeriod = async (startDate: Date, endDate: Date): Promise<number> => {
  const { data, error } = await supabase.rpc('fetch_income_for_period', {
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0]
  });

  if (error) throw error;
  return data ?? 0;
};

export const updateCategoryBudgetAmount = async (
  categoryId: number,
  budgetAmount: number | null,
  budgetPercentage?: number | null
): Promise<void> => {
  const { error } = await supabase
    .from('Categories')
    .update({
      budget_amount: budgetAmount,
      budget_percentage: budgetPercentage ?? null,
    })
    .eq('id', categoryId);

  if (error) throw error;
};

export const updateCategoryBudgetPercentages = async (
  allocations: { categoryId: number; percentage: number; amount: number }[]
): Promise<void> => {
  const updates = allocations.map(({ categoryId, percentage, amount }) =>
    supabase
      .from('Categories')
      .update({ budget_percentage: percentage, budget_amount: amount })
      .eq('id', categoryId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
};

export const fetchSpendingByCategory = async (
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('Transactions')
    .select('category_name, amount')
    .neq('category_name', 'Income')
    .neq('category_name', 'Transfer')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString());

  if (error) throw error;

  const result: Record<string, number> = {};
  data?.forEach(t => {
    result[t.category_name] = (result[t.category_name] ?? 0) + t.amount;
  });
  return result;
};

// ============ Savings Goals ============

export const fetchGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('Goals')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const fetchGoalsByAccount = async (accountId: number): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('Goals')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const createGoal = async (payload: {
  user_id: string;
  account_id: number;
  name: string;
  target_amount: number;
  color?: string;
  icon?: string;
}): Promise<Goal> => {
  const { data, error } = await supabase
    .from('Goals')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateGoal = async (
  goalId: number,
  updates: Partial<Pick<Goal, 'name' | 'target_amount' | 'color' | 'icon'>>
): Promise<void> => {
  const { error } = await supabase
    .from('Goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', goalId);
  if (error) throw error;
};

export const deleteGoal = async (goalId: number): Promise<void> => {
  const { error } = await supabase
    .from('Goals')
    .delete()
    .eq('id', goalId);
  if (error) throw error;
};

export const contributeToGoal = async (payload: {
  goal_id: number;
  user_id: string;
  amount: number;
  source_account_id: number;
  source_account_name: string;
  destination_account_name: string;
}): Promise<void> => {
  // 1. Create the transfer (updates account balances)
  await createTransfer({
    from_account: payload.source_account_name,
    to_account: payload.destination_account_name,
    amount: payload.amount,
    user_id: payload.user_id,
  });

  // 2. Record the contribution
  const { error: contribError } = await supabase
    .from('GoalContributions')
    .insert([{
      goal_id: payload.goal_id,
      user_id: payload.user_id,
      amount: payload.amount,
      source_account_id: payload.source_account_id,
    }]);
  if (contribError) throw contribError;

  // 3. Update goal's current_amount
  const { error: updateError } = await supabase.rpc('increment_goal_amount', {
    p_goal_id: payload.goal_id,
    p_amount: payload.amount,
  });
  if (updateError) throw updateError;
};

export const fetchGoalContributions = async (goalId: number): Promise<GoalContribution[]> => {
  const { data, error } = await supabase
    .from('GoalContributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const fetchMonthlySavingsProgress = async (
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const { data, error } = await supabase
    .from('GoalContributions')
    .select('amount')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString());

  if (error) throw error;

  const total = data?.reduce((sum, c) => sum + (c.amount ?? 0), 0) ?? 0;
  return total;
};

// Record a savings transfer (without requiring a specific goal)
// This allows any transfer to a savings account to count toward monthly savings progress
export const recordSavingsTransfer = async (payload: {
  user_id: string;
  amount: number;
  source_account_id: number;
}): Promise<void> => {
  const { error } = await supabase
    .from('GoalContributions')
    .insert([{
      goal_id: null,
      user_id: payload.user_id,
      amount: payload.amount,
      source_account_id: payload.source_account_id,
    }]);
  if (error) throw error;
};

// Quick save: deduct from account and record as savings progress
// This is a "set aside" model - money is marked as saved without transferring to another account
export const quickSaveFromAccount = async (payload: {
  user_id: string;
  account_name: string;
  amount: number;
  source_account_id: number;
  new_balance: number;
}): Promise<void> => {
  // Update account balance
  const { error: balanceError } = await supabase
    .from('Accounts')
    .update({ balance: payload.new_balance })
    .eq('account_name', payload.account_name);

  if (balanceError) throw balanceError;

  // Record as savings contribution
  const { error: contributionError } = await supabase
    .from('GoalContributions')
    .insert([{
      goal_id: null,
      user_id: payload.user_id,
      amount: payload.amount,
      source_account_id: payload.source_account_id,
    }]);

  if (contributionError) throw contributionError;
};