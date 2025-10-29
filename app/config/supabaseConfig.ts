// Supabase Configuration
// This file contains your Supabase configuration for different environments

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Development/Default configuration
const developmentConfig: SupabaseConfig = {
  url: "https://your-project.supabase.co",
  anonKey: "your-anon-key-here"
};

// Production configuration (you can override these in EAS build secrets)
const productionConfig: SupabaseConfig = {
  url: "https://your-project.supabase.co", // Same URL for production
  anonKey: "your-anon-key-here" // Same anon key for production
};

// Get the appropriate configuration based on environment
export const getSupabaseConfig = (): SupabaseConfig => {
  // In production builds, you can use EAS secrets to override these values
  // For now, we'll use the same config for all environments
  // You can modify this logic based on your needs
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  return isProduction ? productionConfig : developmentConfig;
};

// Export the current configuration
export const supabaseConfig = getSupabaseConfig();
