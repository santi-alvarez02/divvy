import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfxkozuebuaciocsssjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeGtvenVlYnVhY2lvY3Nzc2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTIyMjIsImV4cCI6MjA3NzMyODIyMn0.cyKHhsspwvaYZ1mSX3hPQOsBryGCt5Su9ZuWHefECEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearExchangeRates() {
  try {
    console.log('🗑️  Clearing old exchange rates from database...');

    const { error } = await supabase
      .from('exchange_rates')
      .delete()
      .neq('from_currency', 'DUMMY'); // Delete all rows

    if (error) {
      console.error('❌ Error clearing rates:', error);
      throw error;
    }

    console.log('✅ Successfully cleared all exchange rates from database');
    console.log('💡 Next time you load the app, it will fetch fresh rates from exchangeratesapi.io');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

clearExchangeRates();
