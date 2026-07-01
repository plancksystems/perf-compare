const std = @import("std");
const builtin = @import("builtin");
const schnell = @import("schnell");
const planck = @import("planck");

const Ctx = @import("core/ctx.zig").Ctx;
const products_routes = @import("features/products/routes.zig");

pub fn main() !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = if (builtin.mode == .Debug) gpa.allocator() else std.heap.c_allocator;
    defer if (builtin.mode == .Debug) {
        if (gpa.detectLeaks() > 0) std.process.exit(1);
    };

    var threaded: std.Io.Threaded = .init(allocator, .{});
    defer threaded.deinit();
    const io = threaded.io();

    const client = try planck.Client.init(allocator, io);
    defer client.deinit();
    var auth = try client.connect("127.0.0.1:24020;uid=admin;key=UGxhbmNrX0RlZmF1bHRfQWRtaW5fS2V5XzAwMTA=;tls=false");
    auth.deinit();
    std.debug.print("Connected to Planck on port 24020\n", .{});

    var ctx = Ctx{ .client = client };

    const providers_yaml = std.Io.Dir.readFileAlloc(.cwd(), io, "providers.yaml", allocator, .unlimited) catch |err| switch (err) {
        error.FileNotFound => try allocator.dupe(u8, ""),
        else => return err,
    };
    defer allocator.free(providers_yaml);

    var app = try schnell.App.init(allocator, .{
        .host = "127.0.0.1",
        .port = 4320,
        .static_dir = "/Users/kamlesh/planckapps/samples/perf/planck-pizzahub/public",
    }, providers_yaml);
    defer app.deinit();

    var cors = schnell.CorsMiddleware.init(.{});
    try app.use(cors.middleware());

    try products_routes.register(&app, &ctx);

    std.debug.print("planck-pizzahub dev server running on http://127.0.0.1:4320\n", .{});
    try app.run(io);
}
