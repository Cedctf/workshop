module workshop::defi {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::table::{Self, Table};

    // Error codes
    const EInsufficientBalance: u64 = 1;
    const ENoDebt: u64 = 2;
    const EOverRepay: u64 = 3;

    // Pool object that holds all deposits
    public struct Pool has key {
        id: UID,
        deposits: Balance<SUI>,
        debts: Table<address, u64>,  // Track how much each user borrowed
    }

    // Initialize the pool
    fun init(ctx: &mut TxContext) {
        let pool = Pool {
            id: object::new(ctx),
            deposits: balance::zero(),
            debts: table::new(ctx),
        };
        transfer::share_object(pool);
    }

    // Deposit SUI into the pool
    entry fun deposit(
        pool: &mut Pool,
        payment: Coin<SUI>,
    ) {
        let balance = coin::into_balance(payment);
        balance::join(&mut pool.deposits, balance);
    }

    // Borrow SUI from the pool (as long as pool has enough)
    entry fun borrow(
        pool: &mut Pool,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if pool has enough liquidity
        assert!(balance::value(&pool.deposits) >= amount, EInsufficientBalance);
        
        // Track the debt
        if (table::contains(&pool.debts, sender)) {
            let debt = table::borrow_mut(&mut pool.debts, sender);
            *debt = *debt + amount;
        } else {
            table::add(&mut pool.debts, sender, amount);
        };
        
        // Transfer borrowed amount to user
        let borrowed_balance = balance::split(&mut pool.deposits, amount);
        let borrowed_coin = coin::from_balance(borrowed_balance, ctx);
        transfer::public_transfer(borrowed_coin, tx_context::sender(ctx));
    }

    // Repay borrowed SUI
    entry fun repay(
        pool: &mut Pool,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        let amount = coin::value(&payment);
        
        // Check if user has debt
        assert!(table::contains(&pool.debts, sender), ENoDebt);
        
        let current_debt = *table::borrow(&pool.debts, sender);
        assert!(amount <= current_debt, EOverRepay);
        
        // Update debt
        let new_debt = current_debt - amount;
        if (new_debt == 0) {
            table::remove(&mut pool.debts, sender);
        } else {
            let debt = table::borrow_mut(&mut pool.debts, sender);
            *debt = new_debt;
        };
        
        // Add repayment back to pool
        let balance = coin::into_balance(payment);
        balance::join(&mut pool.deposits, balance);
    }

    // View functions
    public fun get_pool_balance(pool: &Pool): u64 {
        balance::value(&pool.deposits)
    }

    public fun get_debt(pool: &Pool, user: address): u64 {
        if (table::contains(&pool.debts, user)) {
            *table::borrow(&pool.debts, user)
        } else {
            0
        }
    }
}
