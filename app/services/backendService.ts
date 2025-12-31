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
  
  export const fetchTotalBalance = async (): Promise<number> => {
    const { data, error } = await supabase.rpc('fetch_total_balance');
    if (error) throw error;
    return data ?? 0;
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

// Modified: Fetch transactions excluding Income
export const fetchTransactionsByDateRange = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("Transactions")
    .select("*")
    .neq("category_name", "Income")  // Exclude Income
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

// Modified: Fetch category aggregates excluding Income
export const fetchCategoryAggregates = async (startDate: Date, endDate: Date): Promise<CategoryAggregation[]> => {
  const { data, error } = await supabase.rpc('fetch_category_aggregates', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });
  if (error) throw error;
  
  // Filter out Income category
  return (data ?? []).filter((cat: CategoryAggregation) => cat.category_name !== 'Income');
};



export const createAccount = async (accountName: string, balance: number, type:string, user_id) => {
  const { data, error } = await supabase
  .from('Accounts')
  .insert({ account_name: accountName, balance: balance, user_id: user_id, type: type })
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

