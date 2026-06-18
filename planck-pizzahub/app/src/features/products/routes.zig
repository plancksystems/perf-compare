
const web = @import("web");
const Ctx = @import("../../core/ctx.zig").Ctx;

const list_products = @import("handlers/list_products_handler.zig");
const list_categories = @import("handlers/list_categories_handler.zig");

pub fn register(app: anytype, ctx: *Ctx) !void {
    try app.get("/categories", list_categories.handle, ctx);
    try app.get("/products", list_products.handle, ctx);
}
