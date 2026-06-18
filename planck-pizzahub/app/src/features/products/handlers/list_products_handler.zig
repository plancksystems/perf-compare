
const std = @import("std");
const web = @import("web");
const Request = web.Request;
const Response = web.Response;
const planck = @import("planck");

const Product = @import("../models/product.zig").Product;
const ProductList = @import("../fragments/product_list.zig").ProductList;
const Ctx = @import("../../../core/ctx.zig").Ctx;

pub fn handle(ctx_ptr: ?*anyopaque, allocator: std.mem.Allocator, req: *const Request, res: *Response) !void {
    const ctx: *Ctx = @ptrCast(@alignCast(ctx_ptr orelse return error.NoContext));

    var q = planck.Query.initWithAllocator(ctx.client, allocator);
    defer q.deinit();
    _ = q.store("products");

    if (req.getQuery("category")) |cat| {
        if (std.fmt.parseInt(i32, cat, 10)) |cat_id| {
            if (cat_id > 0) {
                _ = q.where("CategoryID", .eq, .{ .int = cat_id });
            }
        } else |_| {}
    }

    var resp = try q.limit(200).run();
    defer resp.deinit();

    const products_all = try resp.decode(allocator, Product);
    defer allocator.free(products_all);

    const filtered = if (req.getQuery("q")) |q_raw|
        filterByName(allocator, products_all, q_raw) catch products_all
    else
        products_all;
    defer if (filtered.ptr != products_all.ptr) allocator.free(filtered);

    var out: std.ArrayList(u8) = .empty;
    try ProductList.render(.{ .products = filtered }, &out, allocator);
    try res.html(out.items);
}

fn filterByName(allocator: std.mem.Allocator, products: []const Product, needle_raw: []const u8) ![]const Product {
    const needle = std.mem.trim(u8, needle_raw, " \t\r\n");
    if (needle.len == 0) return products;

    const needle_lower = try allocator.alloc(u8, needle.len);
    defer allocator.free(needle_lower);
    for (needle, 0..) |c, i| needle_lower[i] = std.ascii.toLower(c);

    var out: std.ArrayList(Product) = .empty;
    errdefer out.deinit(allocator);

    var name_buf: [256]u8 = undefined;
    for (products) |p| {
        const len = @min(p.Name.len, name_buf.len);
        for (p.Name[0..len], 0..) |c, i| name_buf[i] = std.ascii.toLower(c);
        if (std.mem.indexOf(u8, name_buf[0..len], needle_lower) != null) {
            try out.append(allocator, p);
        }
    }

    return try out.toOwnedSlice(allocator);
}
