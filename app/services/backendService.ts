import { CategoryAggregation, CategoryIconInfo, Transaction } from "../types/types";
import { supabase } from "../utils/supabase";

export const fetchCategories = async () => {
    const { data, error } = await supabase.from("Categories").select("*");
    if (error) throw error;
    return data ?? [];
};

export const fetchAccountOptions = async () => {
    const { data, error } = await supabase.from("Accounts").select("id, account_name, selected");
    if (error) throw error;
    return data ?? [];
}

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

export const updateAccountName = async (accountName: string, newName: string) => {
    const { data, error } = await supabase
      .from('Accounts')
      .update({ account_name: newName })
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

export async function deleteCategory(id: number) {
    const { data, error } = await supabase
      .from('Categories')
      .delete()
      .eq('id', id)
      .select();
  
    if (error) throw error;
    return data;
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

export const fetchTotalExpenses = async (startDate: Date, endDate: Date): Promise<number> => {
  const { data, error } = await supabase.rpc('fetch_total_expenses', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });
  if (error) throw error;
  return data ?? 0;
};

export const fetchCategoryAggregates = async (startDate: Date, endDate: Date): Promise<CategoryAggregation[]> => {
  const { data, error } = await supabase.rpc('fetch_category_aggregates', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });
  if (error) throw error;
  return data ?? [];
};



export const updateTransaction = async (id: number, newAmount: number, newDescription: string, newAccount: string) => {
  const { data, error } = await supabase
  .from('Transactions')
  .update({ amount: newAmount, description: newDescription, account_name: newAccount })
    .eq('id', id)
    .select();
  
    if (error) throw error;
    return data;
}


export const deleteTransaction = async (id: number) => {
  const { data, error } = await supabase
    .from('Transactions')
    .delete()
    .eq('id', id)
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