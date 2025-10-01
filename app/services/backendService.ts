import { CategoryIconInfo, Transaction } from "../types/types";
import { supabase } from "../utils/supabase";

export const fetchCategories = async () => {
    const { data, error } = await supabase.from("Categories").select("*");
    if (error) throw error;
    return data ?? [];
};

export const fetchAccounts = async () => {
    const { data, error } = await supabase.from("Accounts").select("id, account_name, selected");
    if (error) throw error;
    return data ?? [];
}

export const fetchAccountNames = async () => {
  const { data, error } = await supabase.from("Accounts").select("account_name");
  if (error) throw error;
  return data ?? [];
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
  
    if (error) throw error; // ✅ Should also handle error instead of silently ignoring
  
    const icons: Record<string, CategoryIconInfo> = {};
    if (data) {
      data.forEach((c: any) => {
        icons[c.category_name] = { icon: c.icon, color: c.color };
      });
    }
  
    return icons;
  }