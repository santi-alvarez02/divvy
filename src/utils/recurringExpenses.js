import { supabase } from '../lib/supabase';

/**
 * Process recurring expenses for the current month
 * Creates new expense instances for any recurring expenses that haven't been processed this month
 * @param {string} groupId - The group ID to process recurring expenses for
 * @returns {Promise<{processed: number, skipped: number}>} Count of processed and skipped expenses
 */
export const processRecurringExpenses = async (groupId) => {
  if (!groupId) {
    console.warn('processRecurringExpenses: No groupId provided');
    return { processed: 0, skipped: 0 };
  }

  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let processedCount = 0;
    let skippedCount = 0;

    // Fetch all recurring expenses for this group
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_splits (
          user_id,
          share_amount
        )
      `)
      .eq('group_id', groupId)
      .eq('is_recurring', true);

    if (fetchError) {
      console.error('Error fetching recurring expenses:', fetchError);
      return { processed: 0, skipped: 0 };
    }

    if (!recurringExpenses || recurringExpenses.length === 0) {
      return { processed: 0, skipped: 0 };
    }

    // Process each recurring expense
    for (const expense of recurringExpenses) {
      // Check if this expense needs to be recreated
      const lastDate = expense.last_recurring_date ? new Date(expense.last_recurring_date) : new Date(expense.date);
      const lastMonth = lastDate.getMonth();
      const lastYear = lastDate.getFullYear();

      // Skip if already created this month
      if (lastMonth === currentMonth && lastYear === currentYear) {
        skippedCount++;
        continue;
      }

      // Create new expense for this month
      const { data: newExpense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: expense.group_id,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          date: today.toISOString().split('T')[0],
          paid_by: expense.paid_by,
          is_recurring: false, // New occurrence is not itself recurring
          icon: expense.icon
        })
        .select()
        .single();

      if (expenseError) {
        console.error('Error creating recurring expense:', expenseError);
        continue;
      }

      // Create expense splits for the new expense
      const splits = expense.expense_splits.map(split => ({
        expense_id: newExpense.id,
        user_id: split.user_id,
        share_amount: split.share_amount
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits);

      if (splitsError) {
        console.error('Error creating splits for recurring expense:', splitsError);
        // Delete the expense if splits failed
        await supabase.from('expenses').delete().eq('id', newExpense.id);
        continue;
      }

      // Update the original recurring expense's last_recurring_date
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ last_recurring_date: today.toISOString().split('T')[0] })
        .eq('id', expense.id);

      if (updateError) {
        console.error('Error updating last_recurring_date:', updateError);
      }

      processedCount++;
    }

    return { processed: processedCount, skipped: skippedCount };
  } catch (error) {
    console.error('Error in processRecurringExpenses:', error);
    return { processed: 0, skipped: 0 };
  }
};

/**
 * Check if an expense was created from a recurring template
 * @param {Object} expense - The expense object
 * @returns {boolean} True if this expense was created from a recurring template
 */
export const isFromRecurringTemplate = (expense) => {
  // An expense created from a recurring template will have:
  // - is_recurring = false (the instance itself is not recurring)
  // - A matching recurring template exists with the same details
  // For simplicity, we'll mark expenses with a special description pattern
  // Or we can add a parent_expense_id field in a future update
  return false; // For now, we don't have a way to identify these
};
