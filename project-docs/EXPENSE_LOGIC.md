# Expense Page Calculation Logic

This document explains the financial logic behind the three summary cards on the Expenses page. These cards are designed to answer three distinct questions about the user's finances.

## 1. Cash Out (Monthly Cash Flow)
**Question**: "How much money actually left my pocket this month?"

*   **Scope**: Selected Date Range (e.g., "This Month").
*   **Logic**: Sum of the full `amount` of every expense where `paidBy` is the current user.
*   **Includes**:
    *   Shared expenses you paid for (full amount).
    *   Your personal expenses.
    *   Loans you gave to others (money out).
*   **Excludes**:
    *   Expenses paid by others (even if you are in the split).

## 2. Net Balance (Lifetime Standing)
**Question**: "What is my overall financial standing with the group right now?"

*   **Scope**: **Lifetime** (All Time).
*   **Logic**: `(Total Amount Others Owe You) - (Total Amount You Owe Others)`.
*   **Behavior**:
    *   **Green (+)**: You are a net lender (The group owes you money).
    *   **Orange (-)**: You are a net borrower (You owe the group money).
*   **Important**: This value persists across months. Debts are not cleared until a settlement is recorded.

## 3. My Share (Monthly Consumption)
**Question**: "What was the value of the goods and services I consumed this month?"

*   **Scope**: Selected Date Range (e.g., "This Month").
*   **Logic**: Sum of the user's specific share of expenses in the date range.
*   **Calculation Breakdown**:
    *   **Shared Expense**: Adds your split portion (e.g., $50 of a $100 dinner).
    *   **Personal Expense (Yours)**: Adds the full amount.
    *   **Personal Expense (Others)**: Adds $0.
    *   **Loan (You Borrowed)**: Adds the full amount (treated as money entering your pocket/consumption).
    *   **Loan (You Lent)**: Adds $0 (treated as an asset transfer, not consumption).

---

## Example Scenario
**Scenario**: You pay **$100** for a dinner, split 50/50 with a friend.

| Card | Value | Explanation |
| :--- | :--- | :--- |
| **Cash Out** | **$100** | You swiped your card for $100. |
| **My Share** | **$50** | You only ate $50 worth of food. |
| **Net Balance** | **+$50** | Your friend now owes you $50. |
