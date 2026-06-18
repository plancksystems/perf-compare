
const std = @import("std");
const web = @import("web");
const Request = web.Request;
const Response = web.Response;
const planck = @import("planck");

const Category = @import("../models/product.zig").Category;
const CategoryList = @import("../fragments/category_list.zig").CategoryList;
const Ctx = @import("../../../core/ctx.zig").Ctx;

pub fn handle(ctx_ptr: ?*anyopaque, allocator: std.mem.Allocator, _: *const Request, res: *Response) !void {
    const ctx: *Ctx = @ptrCast(@alignCast(ctx_ptr orelse return error.NoContext));

    var q = planck.Query.initWithAllocator(ctx.client, allocator);
    defer q.deinit();
    var resp = try q.store("categories").limit(100).run();
    defer resp.deinit();

    const categories = try resp.decode(allocator, Category);
    defer allocator.free(categories);

    var out: std.ArrayList(u8) = .empty;
    try CategoryList.render(.{ .categories = categories }, &out, allocator);
    try res.html(out.items);
}
