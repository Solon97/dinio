# Monthly Configuration Flow - Unified Test Plan

## Application Overview

This comprehensive test plan covers the complete behavior of the Dinio monthly budget configuration feature, including:

- **Initial Configuration Flow**: Fixed Income, Credit Cards, Fixed Expenses (with installments support), and Distribution
- **Data Persistence**: Verification across page reloads and database operations
- **Data Visualization**: Daily, Monthly, and Annual views with charts and insights
- **Budget Editing**: Full CRUD operations (Create, Read, Update, Delete) with confirmed bug fixes
- **Navigation Patterns**: Forward/backward navigation, optional step skipping
- **Validation**: Input validation, edge cases, and boundary conditions
- **Known Issues**: Documented bugs and workarounds for test environments

The plan is based on actual UI exploration and testing, confirming bug fixes and documenting current system behavior as of February 2026.

## Test Scenarios

### 1. Complete Monthly Configuration Flow

**Seed:** `tests/auth.test.ts`

#### 1.1. User completes monthly configuration and verifies data persistence

**File:** `tests/monthly-configuration/complete-configuration.spec.ts`

**Steps:**
  1. Navigate to the Dashboard page after successful authentication
    - expect: The Dashboard page should be visible
    - expect: The page should display 'Rastreio Diário' as the main heading
    - expect: The page should show view toggle buttons: 'Diário', 'Mensal', 'Anual'
    - expect: The current month should be displayed (e.g., 'Fev 2026')
    - expect: An 'Orçamento não configurado' message should be visible
    - expect: A 'Configurar [Month]' button should be present and enabled
  2. Click the 'Configurar [Month]' button to start the configuration flow
    - expect: A modal should open with the title 'Configurar [Month]'
    - expect: The modal should display 'Etapa 1 de 3' indicating step 1 of 3
    - expect: The modal should show the heading '1. Receitas Fixas'
    - expect: The modal should display a description asking 'Quanto dinheiro vai entrar neste mês?'
    - expect: A pre-filled income entry form should be visible with 'Salário' as the default name
    - expect: An amount input field should be present showing R$ 0,00
    - expect: An 'Adicionar Receita' button should be visible
    - expect: A 'Total Receitas' summary should show R$ 0
    - expect: A 'Próximo' button should be present but disabled
  3. Enter a valid fixed income amount (e.g., R$ 5.000,00) in the amount field
    - expect: The amount field should display the entered value formatted as currency (5.000,00)
    - expect: The 'Total Receitas' should update to reflect the entered amount (R$ 5.000)
    - expect: The 'Próximo' button should become enabled
  4. Click the 'Próximo' button to advance to step 2
    - expect: The modal should transition to step 2
    - expect: The step indicator should update to 'Etapa 2 de 3'
    - expect: The modal should display the heading '2. Gastos Fixos e Cartões'
    - expect: A description should indicate this step is for configuring cards and fixed expenses
    - expect: An 'Adicionar Cartão' button should be visible at the bottom
    - expect: A 'Débito / Boleto / PIX' section for direct debits should be visible
    - expect: Both 'Voltar' and 'Próximo' buttons should be visible
    - expect: The 'Próximo' button should be enabled (step can be skipped)
    - expect: A summary panel should display 'Renda' with the total from step 1
    - expect: The summary should show 'Total Fixos' as R$ 0,00 initially
  5. Click the 'Adicionar Cartão' button to add a credit card
    - expect: A credit card block should appear with card config at the top
    - expect: The block should have a 'Nome do cartão' text field
    - expect: A due date and closing day spinner should be visible with default values
    - expect: Color selection buttons should be available (multiple color options)
    - expect: A delete button should be visible for the card
    - expect: Below the card config, a 'Gastos neste cartão' expense section should appear
    - expect: 'Adicionar no [cartão]' and 'Adicionar Vários' buttons should be visible in the expense section
  6. Enter a card name (e.g., 'Visa') and select a color
    - expect: The card block should display the entered name
    - expect: The border color of the block should match the selected color
  7. Click 'Adicionar no Visa' to add an expense to the card within step 2
    - expect: An expense form should appear within the card's expense section
    - expect: No step transition occurs — adding expenses happens within step 2
    - expect: Sections for each registered card are visible alongside their config
    - expect: The 'Débito / Boleto / PIX' section for direct debits remains visible below
  8. Click 'Adicionar gasto no [Card Name]' to add an expense to a credit card
    - expect: An expense form should appear within the card section
    - expect: The form should have a description field with placeholder text (Ex: Streaming, Internet...)
    - expect: An amount field showing R$ 0,00 should be visible
    - expect: A priority dropdown should be present (Obrigatório/Dispensável)
    - expect: The form should indicate 'Vencimento automático (Fatura)' for card expenses
    - expect: An 'É parcelamento?' checkbox should be available
    - expect: A delete button should be present for the expense form
  9. Enter expense details (description: 'Streaming', amount: R$ 50,00) without checking installment, and add another form
    - expect: The expense should be added to the card's expense list
    - expect: The expense form should show the entered values
    - expect: A new empty expense form should appear below
    - expect: The 'Total Fixos' in the summary should update to R$ 50,00
  10. Click 'Adicionar gasto avulso' to add a direct debit expense
    - expect: An expense form should appear in the direct debit section
    - expect: The form should have description and amount fields
    - expect: A due day spinner should be visible with a default value (e.g., 1)
    - expect: A priority dropdown should be present (Obrigatório/Dispensável)
    - expect: An installment checkbox ('É parcelamento?') should be available
    - expect: A delete button should be present
  11. Enter direct debit expense details (description: 'Internet', amount: R$ 250,00) and add the expense
    - expect: The expense should be added to the direct debit list
    - expect: The expense form should display the entered values
    - expect: A new empty expense form should appear
    - expect: The 'Total Fixos' should update to reflect all added expenses (R$ 300,00)
  12. Verify the expense summary and click 'Próximo' to advance to step 3
    - expect: All added expenses should be visible in their respective sections
    - expect: The 'Total Fixos' should correctly sum all fixed expenses (R$ 300,00)
    - expect: The modal should transition to step 3
    - expect: The step indicator should update to 'Etapa 3 de 3'
  13. Review the Distribution step
    - expect: The modal should display the heading '3. Distribuição'
    - expect: A description should explain defining daily spending ceiling
    - expect: A 'Gastos Fixos' section should show the total fixed expenses with percentage
    - expect: The label 'Automático' should indicate automatic inclusion of fixed expenses
    - expect: A slider control should be visible for adjusting distribution
    - expect: The slider should have a default position (e.g., 50%)
    - expect: Two panels should display the distribution breakdown: 'Dia a dia' and 'Reserva'
    - expect: Each panel should show percentage, amount in R$, and percentage of total income
    - expect: A 'Concluir' button should be enabled
    - expect: A 'Voltar' button should also be present
  14. Adjust the distribution slider to a different position (e.g., 96%)
    - expect: The slider position should update visually
    - expect: The 'Dia a dia' panel should update to show new percentage and recalculated amount
    - expect: The 'Reserva' panel should update to show complementary percentage and amount
    - expect: Both panels should show updated percentages relative to total income
    - expect: The calculations should be mathematically correct: Available = Income - Fixed, then split according to slider
  15. Click the 'Concluir' button to finalize the configuration
    - expect: The modal should close
    - expect: The user should be returned to the Dashboard view
    - expect: The Dashboard should no longer display 'Orçamento não configurado'
    - expect: Budget data should be visible in the Daily view
  16. Verify the Daily View displays configured budget data
    - expect: The 'Diário' tab should be active
    - expect: The view should display 'Teto para Hoje (Dia X)' with calculated daily ceiling
    - expect: A status indicator should show trend (↑ Subindo, ↓ Descendo, or stable)
    - expect: 'Gasto no Dia' should show R$ 0,00 (no expenses yet)
    - expect: 'Saldo para Gastos Diários' should show the available day-to-day amount
    - expect: Charts should display: 'Evolução do Teto Diário' and 'Gastos por Categoria'
    - expect: Visual indicators should reflect the configured budget
  17. Switch to the Monthly View
    - expect: Click the 'Mensal' button
    - expect: The view should transition to show monthly overview
    - expect: 'Planejamento' heading should appear
    - expect: 'Editar orçamento' button should be visible
    - expect: 'Distribuição Planejada' chart should display Total, Fixos, Dia a Dia, and Reserva
    - expect: Percentages and amounts should match the configuration (96% day-to-day, 4% reserve)
    - expect: 'Dinio Insights' section should show automated financial analysis
    - expect: 'Gastos Fixos' table should list all configured fixed expenses with days, names, and values
  18. Switch to the Annual View
    - expect: Click the 'Anual' button
    - expect: The view should transition to show yearly overview
    - expect: A chart should display all 12 months of the year
    - expect: The configured month (February) should show complete budget information
    - expect: Summaries should show totals and projections
    - expect: Other unconfigured months may appear empty or with different data
  19. Reload the page to test data persistence
    - expect: The page should reload successfully
    - expect: The user should remain authenticated
    - expect: The Dashboard should load without showing 'Orçamento não configurado'
    - expect: The configured budget should still be present
    - expect: All data should persist (income, cards, expenses, distribution)
  20. After page reload, verify all configured data persists in Monthly View
    - expect: Switch to Monthly View
    - expect: All income entries should be preserved (R$ 5.000)
    - expect: All credit card expenses should be visible (Streaming R$ 50,00 on Visa)
    - expect: All direct debit expenses should be visible (Internet R$ 250,00)
    - expect: Total fixed expenses should still show R$ 300,00
    - expect: Distribution settings should be maintained (96/4 split)
    - expect: Card configurations should be preserved (Visa with selected color and due date)
    - expect: 'Gastos Fixos' table should display all expenses correctly
  21. Verify budget health calculations are consistent
    - expect: All calculations should be mathematically accurate across all views
    - expect: Daily ceiling should equal Day-to-day amount divided by days remaining in month
    - expect: All percentages and amounts should be consistent
    - expect: Charts and visual representations should accurately reflect the numbers
    - expect: No data discrepancies between Daily, Monthly, and Annual views

### 2. Installment Expenses Feature

**Seed:** `tests/auth.test.ts`

#### 2.1. User creates installment expenses and verifies calculation

**File:** `tests/monthly-configuration/installment-expenses.spec.ts`

**Steps:**
  1. Complete step 1 of configuration (income) and proceed to step 2
    - expect: Income is configured (e.g., R$ 5.000)
    - expect: At least one credit card is added in step 2
    - expect: User is on Step 2 (Gastos Fixos e Cartões)
  2. Add a card expense and check 'É parcelamento?' checkbox
    - expect: Checkbox 'É parcelamento?' is checked
    - expect: Additional fields appear: 'Parcela inicial' spinner (default: 1)
    - expect: 'Total de parcelas' spinner appears (default: 12)
    - expect: 'Valor por parcela' label appears showing calculated value
    - expect: 'Parcelas a criar' label shows number of installments to be created
    - expect: Explanation text: 'Serão criadas X parcelas automaticamente, a partir do mês atual'
  3. Enter installment expense: 'Geladeira', R$ 1.200,00, keep 12 parcelas
    - expect: Description field shows 'Geladeira'
    - expect: Amount field shows 1.200,00
    - expect: System calculates: R$ 1.200 / 12 = R$ 100 per installment
    - expect: 'Valor por parcela: R$ 100.00' is displayed
    - expect: 'Parcelas a criar: 12x' is shown
    - expect: 'Total Fixos' increases by R$ 100 (only current month's installment)
  4. Add the installment expense
    - expect: Installment expense is added to the card's expense list
    - expect: New empty expense form appears
    - expect: 'Total Fixos' shows R$ 100 (not R$ 1.200)
    - expect: Expense is marked or labeled as installment
  5. Test installment with non-divisible amount: R$ 1.000, 3 parcelas
    - expect: System calculates: R$ 1.000 / 3 ≈ R$ 333,33 per installment
    - expect: 'Valor por parcela' shows properly rounded value
    - expect: 'Parcelas a criar: 3x' is displayed
    - expect: 'Total Fixos' increases by one installment amount only
  6. Change 'Parcela inicial' to 2 (start from 2nd installment)
    - expect: Parcela inicial spinner shows value 2
    - expect: Explanation updates to indicate starting from installment 2
    - expect: If 'Total de parcelas' is 12, system will create installments 2-12 (11 total)
    - expect: 'Parcelas a criar' reflects correct count (e.g., 11x)
  7. Add installment as direct debit expense
    - expect: Direct debit section also has 'É parcelamento?' checkbox
    - expect: Installment fields appear when checked
    - expect: Direct debit installments use specified due day instead of card due date
    - expect: Calculations work identically to card installments
  8. Complete configuration and verify installment impact on totals
    - expect: Step 3 Distribution shows 'Gastos Fixos' with only current month's installment total
    - expect: Full installment amounts (e.g., R$ 1.200) are NOT included in 'Total Fixos'
    - expect: Only per-month installments (e.g., R$ 100) are counted
    - expect: Distribution calculations are based on reduced fixed expenses
  9. Verify installment display in Monthly View after completion
    - expect: 'Gastos Fixos' table shows installment expense
    - expect: Only current month's installment value is displayed
    - expect: Expense may be labeled or indicated as installment (e.g., 'Geladeira 1/12')
    - expect: Total calculations include only the monthly installment, not full amount

### 3. Budget Editing and CRUD Operations

**Seed:** `tests/auth.test.ts`

#### 3.1. User edits existing budget with full CRUD operations - BUG FIX CONFIRMED

**File:** `tests/monthly-configuration/edit-budget-full-crud.spec.ts`

**Steps:**
  1. Navigate to Monthly view with existing configured budget
    - expect: Budget is already configured and visible
    - expect: 'Editar orçamento' button is present in Monthly view header
    - expect: Budget displays existing income, expenses, and distribution
  2. Click 'Editar orçamento' button
    - expect: Configuration modal opens
    - expect: Modal title shows 'Configurar [Month]'
    - expect: Modal opens at Step 1 (Receitas Fixas)
    - expect: 'Etapa 1 de 3' is displayed
  3. Verify Step 1 loads existing income data
    - expect: Previously entered income entries are displayed
    - expect: Income names and amounts match saved configuration
    - expect: 'Total Receitas' shows correct sum
    - expect: 'Próximo' button is enabled
    - expect: Delete buttons (trash icons) are present for each income entry
  4. Delete an existing income entry
    - expect: Click delete button (trash icon)
    - expect: Income entry is removed immediately from the list
    - expect: 'Total Receitas' updates to reflect removal
    - expect: If all income deleted, 'Próximo' button becomes disabled
    - expect: No confirmation dialog appears (deletion is immediate)
  5. Add a new income entry
    - expect: Form accepts new income data
    - expect: New entry appears in the list
    - expect: 'Total Receitas' updates to include new entry
    - expect: 'Próximo' button remains enabled
  6. Navigate to Step 2 (Gastos Fixos e Cartões)
    - expect: Step 2 displays all previously added credit cards, each with its expense section below
    - expect: Each card shows: name, due date, closing day, selected color
    - expect: Each card's fixed expenses are grouped within its block
    - expect: Delete buttons are available for each card
    - expect: 'Débito / Boleto / PIX' standalone section is visible
    - expect: ✅ BUG FIX CONFIRMED: Fixed expenses NOW LOAD CORRECTLY in edit mode
    - expect: All previously entered expenses are visible in their respective card sections
    - expect: Each expense shows: description, amount, due date/card, priority
    - expect: 'Total Fixos' displays correct sum of all expenses
    - expect: 'Renda' summary reflects any changes from Step 1
  7. Delete an existing credit card
    - expect: Click delete button for a card
    - expect: Card is removed from the list immediately
    - expect: No confirmation dialog appears
    - expect: WARNING: Expenses associated with deleted card will also be removed
  8. Add a new credit card in edit mode
    - expect: New card block appears with config + empty expense section
    - expect: New card is added to the list
    - expect: User can add expenses to the new card immediately without changing steps
  9. Delete and add fixed expenses within step 2
    - expect: Can delete existing expense (click trash icon)
    - expect: 'Total Fixos' updates in real-time
    - expect: Can add new expense to existing card (e.g., 'Streaming' R$ 50 to Visa)
    - expect: Can add new expense to direct debit (e.g., 'Aluguel' R$ 1.000)
    - expect: All expense forms work identically to initial configuration
  10. Delete a fixed expense
    - expect: Click delete button (trash icon) for an expense
    - expect: Expense is removed immediately from the list
    - expect: 'Total Fixos' updates in real-time
    - expect: If section becomes empty, 'Nenhum gasto' or 'Nenhum gasto avulso' message appears
    - expect: No confirmation dialog (immediate deletion)
  11. Add new fixed expenses in edit mode (card and direct debit)
    - expect: Can add new expense to existing card (e.g., 'Streaming' R$ 50 to Visa)
    - expect: Can add new expense to direct debit (e.g., 'Aluguel' R$ 1.000)
    - expect: New expenses appear in their respective sections
    - expect: 'Total Fixos' updates to include new expenses
    - expect: All expense forms work identically to initial configuration
  12. Verify installment checkbox is available in edit mode
    - expect: 'É parcelamento?' checkbox is available for new expenses
    - expect: Installment calculation fields appear when checked
    - expect: Can add installment expenses during editing
    - expect: Installment totals calculate correctly
  13. Navigate to Step 3 (Distribuição)
    - expect: Step 3 displays distribution interface
    - expect: Slider may be at previously configured position
    - expect: 'Gastos Fixos' section shows updated total based on Step 2 changes
    - expect: Calculations update automatically based on modified income and expenses
    - expect: 'Dia a dia' and 'Reserva' panels show recalculated values
  14. Adjust distribution slider to different percentage
    - expect: Slider moves to new position
    - expect: Panels update with new percentages and amounts
    - expect: Calculations remain mathematically correct
    - expect: User can modify distribution even if only editing expenses
  15. Click 'Concluir' to save edited budget
    - expect: Modal closes
    - expect: Dashboard updates immediately with modified configuration
    - expect: Monthly view reflects all changes: deleted expenses gone, new expenses visible
    - expect: Distribution chart updates with new percentages and amounts
    - expect: 'Gastos Fixos' table shows updated expense list
    - expect: Totals and summaries are recalculated correctly
  16. Reload the page to verify edit persistence
    - expect: Page reloads successfully
    - expect: All edited data persists in database
    - expect: Deleted items remain deleted
    - expect: New items remain in the budget
    - expect: Modified distribution settings are preserved
    - expect: No data loss or rollback
  17. Verify edited data in Monthly View after reload
    - expect: Monthly view shows updated budget configuration
    - expect: All changes are reflected: new income, modified cards, updated expenses
    - expect: 'Gastos Fixos' table displays correct expense list (deleted items gone, new items present)
    - expect: Distribution chart matches saved configuration
    - expect: Insights and calculations reflect edited budget

#### 3.2. User cancels edit without saving changes

**File:** `tests/monthly-configuration/cancel-edit.spec.ts`

**Steps:**
  1. Open edit modal and make changes to budget
    - expect: Modal opens with existing configuration
    - expect: User modifies income, cards, or expenses
    - expect: Changes are visible in the modal
  2. Click close button (X) or cancel action before clicking 'Concluir'
    - expect: Modal closes
    - expect: User returns to Dashboard
    - expect: Original budget data remains unchanged
    - expect: No modifications are saved to database
    - expect: User can reopen edit modal to see original data
  3. Verify no changes were persisted
    - expect: Reload the page
    - expect: Budget shows original configuration
    - expect: All attempted changes are discarded
    - expect: User can restart edit process from original state

### 4. Optional Steps and Navigation

**Seed:** `tests/auth.test.ts`

#### 4.1. User can skip optional configuration steps

**File:** `tests/monthly-configuration/skip-optional-steps.spec.ts`

**Steps:**
  1. Complete Step 1 with minimum required data (at least one income)
    - expect: At least one income entry is present
    - expect: 'Total Receitas' > R$ 0
    - expect: 'Próximo' button is enabled
  2. Skip Step 2 (Gastos Fixos e Cartões) without adding cards or expenses
    - expect: Click 'Próximo' without adding any cards or expenses
    - expect: Step 3 (Distribuição) opens successfully
    - expect: No error occurs
    - expect: 'Total Fixos' remains R$ 0,00
  3. Verify Step 2 with no credit cards added
    - expect: Only 'Débito / Boleto / PIX' section is functional
    - expect: No credit card blocks visible
    - expect: User can still add direct debit expenses
    - expect: Can proceed without adding any expenses
  4. After skipping all expenses, proceed to Step 3
    - expect: Click 'Próximo' without adding expenses
    - expect: 'Total Fixos' remains R$ 0,00
    - expect: Step 3 opens successfully
    - expect: No validation errors
  5. Complete Step 3 (Distribution) with zero fixed expenses
    - expect: Distribution slider works normally
    - expect: Available amount equals total income (Income - 0 = Income)
    - expect: Calculations: Day-to-day + Reserve = 100% of income
    - expect: User can adjust slider
    - expect: 'Concluir' button is enabled
  6. Click 'Concluir' to save minimal configuration
    - expect: Configuration is saved successfully
    - expect: Dashboard shows configured budget
    - expect: Only income is visible in summaries
    - expect: No fixed expenses are listed
    - expect: Daily ceiling is calculated from full income amount (no fixed deductions)
  7. Verify minimal configuration persists after reload
    - expect: Reload the page
    - expect: Budget remains configured
    - expect: Income data persists
    - expect: No fixed expenses (as expected)
    - expect: Distribution settings are maintained
    - expect: Daily/Monthly/Annual views work correctly with minimal data

#### 4.2. User can navigate backward through configuration steps

**File:** `tests/monthly-configuration/navigate-backward.spec.ts`

**Steps:**
  1. Complete Step 1 (Fixed Income) and proceed to Step 2
    - expect: Income data is entered
    - expect: User is on Step 2 (Gastos Fixos e Cartões)
  2. Add at least one credit card and some expenses in Step 2 and proceed to Step 3
    - expect: Card is added with name, due date, color
    - expect: Expenses are added within the card's section in Step 2
    - expect: User is on Step 3 (Distribuição)
  3. Click 'Voltar' button in Step 3
    - expect: Modal navigates back to Step 2
    - expect: Step indicator shows 'Etapa 2 de 3'
    - expect: Previously added credit card and expenses are still visible
    - expect: All card data is intact (name, due date, color)
  4. Click 'Voltar' button again in Step 2 to return to Step 1
    - expect: Modal navigates back to Step 1
    - expect: Step indicator shows 'Etapa 1 de 3'
    - expect: Previously entered income data is preserved
    - expect: User can view and modify income entries
  5. Modify income data in Step 1 after navigating backward
    - expect: Changes to income are reflected in the form
    - expect: 'Total Receitas' updates accordingly
    - expect: User can add, delete, or edit income entries
    - expect: 'Próximo' button state updates based on data validity
  6. Navigate forward again through all steps
    - expect: Click 'Próximo' repeatedly to advance
    - expect: All data from Steps 2-4 remains intact
    - expect: Modified income from Step 1 is reflected in Step 2 'Renda' summary
    - expect: Modified income affects Step 3 distribution calculations
    - expect: No data loss during backward/forward navigation
  7. Complete configuration after navigating backward and forward
    - expect: Click 'Concluir' in Step 3
    - expect: All modifications are saved
    - expect: Final configuration reflects all changes made during navigation
    - expect: Budget data is correct in all views

### 5. Validation and Edge Cases

**Seed:** `tests/auth.test.ts`

#### 5.1. Configuration handles validation and edge cases

**File:** `tests/monthly-configuration/validation-edge-cases.spec.ts`

**Steps:**
  1. Attempt to proceed from Step 1 without entering any income
    - expect: 'Próximo' button remains disabled
    - expect: User cannot advance to Step 2
    - expect: Button state prevents invalid action (no error message needed)
  2. Enter very large income amount (e.g., R$ 999.999,99)
    - expect: System accepts and formats the large value correctly
    - expect: No input overflow or rejection
    - expect: Calculations in Steps 3-4 handle large numbers correctly
    - expect: No visual glitches or calculation errors
    - expect: Distribution amounts are calculated properly
  3. Enter very small income amount (e.g., R$ 0,01)
    - expect: System accepts minimal positive values
    - expect: Distribution calculations work with small amounts
    - expect: Daily ceiling is calculated correctly even with minimal income
    - expect: No division by zero or rounding errors
  4. Add multiple income sources (e.g., 5-10 entries)
    - expect: Each income entry is listed separately
    - expect: 'Total Receitas' sums all entries correctly
    - expect: All entries are preserved when navigating between steps
    - expect: UI handles multiple entries (scrollable if needed)
    - expect: Performance remains acceptable
  5. Add maximum reasonable number of credit cards (e.g., 10 cards)
    - expect: System allows adding many cards
    - expect: Each card is displayed in Step 2 with its own expense section
    - expect: Performance remains acceptable
    - expect: All cards can be managed (view, edit, delete)
    - expect: No limit errors or crashes
  6. Add many fixed expenses across different categories
    - expect: System handles numerous expense entries
    - expect: 'Total Fixos' calculates correctly regardless of quantity
    - expect: UI remains usable (scrollable sections)
    - expect: Performance is acceptable
    - expect: No calculation errors with many items
  7. Configure budget where fixed expenses exceed income
    - expect: System allows configuration (no blocking validation)
    - expect: User can enter expenses > income
    - expect: Step 3 distribution may show warning or negative available amount
    - expect: Budget deficit is visible in calculations
    - expect: System does not crash or corrupt data
    - expect: User can see they are in deficit and adjust accordingly
  8. Test distribution slider at extreme positions (0% and 100%)
    - expect: Slider can move to 0% (all available to Reserve)
    - expect: Slider can move to 100% (all available to Day-to-day)
    - expect: At 0%: 'Dia a dia' shows R$ 0, 'Reserva' shows full available
    - expect: At 100%: 'Dia a dia' shows full available, 'Reserva' shows R$ 0
    - expect: No calculation errors or visual glitches
    - expect: Extreme distributions are saved correctly
  9. Close configuration modal mid-configuration without completing
    - expect: Click close button (X) during any step
    - expect: Modal closes and returns to Dashboard
    - expect: Incomplete configuration is NOT saved
    - expect: 'Orçamento não configurado' message still appears
    - expect: User can restart configuration from beginning
    - expect: No partial data is persisted
  10. Test special characters in text input fields
    - expect: Income names accept letters, numbers, spaces
    - expect: Card names accept letters, numbers, spaces
    - expect: Expense descriptions accept letters, numbers, spaces
    - expect: Brazilian Portuguese characters (ç, ã, õ, á, é, etc.) are accepted
    - expect: Common special characters are handled correctly
    - expect: Data displays without encoding issues
    - expect: No validation errors for valid special characters

### 6. Known Issues and Browser Considerations

**Seed:** `tests/auth.test.ts`

#### 6.1. Service Worker POST caching issue in test environments

**File:** `tests/monthly-configuration/service-worker-workaround.spec.ts`

**Steps:**
  1. Attempt to save budget configuration in browser with Service Worker active
    - expect: ⚠️ KNOWN ISSUE: Service Worker may cache POST requests incorrectly
    - expect: Symptom: Internal Server Error 500 when clicking 'Concluir'
    - expect: Console error: 'Failed to execute put on Cache: Request method POST is unsupported'
    - expect: Error appears to be backend but is actually client-side Service Worker
  2. Workaround: Unregister Service Worker before testing
    - expect: Run in browser console: navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))
    - expect: Reload the page after unregistering
    - expect: Configuration save should work correctly
    - expect: Note: This issue may not occur in browsers without Service Worker or with different caching policies
  3. Verify configuration works after Service Worker removal
    - expect: Complete configuration flow normally
    - expect: Click 'Concluir' - should save successfully
    - expect: No 500 error
    - expect: Budget data is persisted correctly
    - expect: Dashboard displays configured budget