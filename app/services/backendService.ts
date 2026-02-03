import { CategoryAggregation, CategoryIconInfo, Transaction } from "../types/types";
import { supabase } from "../utils/supabase";

export const createTransaction = async (payload: any) => {
  const { data, error } = await supabase
    .from('Transactions')
    .insert([payload])
    .select();
  if (error) throw error;
  return data;
};

// Create a money transfer between two accounts
export const createTransfer = async (payload: {
  from_account: string;
  to_account: string;
  amount: number;
  user_id: string;
  created_at: string;
  description?: string;
}): Promise<{ outgoing: Transaction; incoming: Transaction }> => {
  const transfer_id = crypto.randomUUID();

  // Create outgoing transaction (expense from source)
  const outgoing = await createTransaction({
    amount: -Math.abs(payload.amount),
    description: payload.description || `Transfer to ${payload.to_account}`,
    account_name: payload.from_account,
    category_name: 'Transfer',
    user_id: payload.user_id,
    created_at: payload.created_at,
    transfer_id,
  });

  // Create incoming transaction (income to destination)
  const incoming = await createTransaction({
    amount: Math.abs(payload.amount),
    description: payload.description || `Transfer from ${payload.from_account}`,
    account_name: payload.to_account,
    category_name: 'Transfer',
    user_id: payload.user_id,
    created_at: payload.created_at,
    transfer_id,
  });

  return { outgoing: outgoing[0], incoming: incoming[0] };
};

// Delete a transfer (deletes both linked transactions)
export const deleteTransfer = async (transfer_id: string, user_id: string) => {
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

export const fetchCategories = async () => {
    const { data, error } = await supabase.from("Categories").select("*");
    if (error) throw error;
    return data ?? [];
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
  budgetAmount: number | null
): Promise<void> => {
  const { error } = await supabase
    .from('Categories')
    .update({ budget_amount: budgetAmount, budget_percentage: null })
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