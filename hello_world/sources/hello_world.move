module hello_world::greeting {
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    public struct Greeting has key {
        id: UID,
        text: string::String,
    }

    /// Create & share a greeting saying "Hello world!"
    public entry fun new(ctx: &mut TxContext) {
        let g = Greeting { id: object::new(ctx), text: b"Hello world!".to_string() };
        transfer::share_object(g);
    }

    /// Update text on a shared Greeting (pass the object ID when calling)
    public entry fun update_text(g: &mut Greeting, new_text: string::String) {
        g.text = new_text;
    }
}
