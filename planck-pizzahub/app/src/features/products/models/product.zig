const web = @import("web");
const Schema = web.Schema;

pub const Category = struct {
    CategoryID: i32 = 0,
    Name: []const u8 = "",
    Description: ?[]const u8 = null,
    CreatedAt: []const u8 = "",
};

pub const Product = struct {
    ProductID: i32 = 0,
    SKU: []const u8 = "",
    Name: []const u8 = "",
    Description: ?[]const u8 = null,
    CategoryID: i32 = 0,
    BasePrice: f64 = 0,
    ImageURL: ?[]const u8 = null,
    Attributes: ?[]const u8 = null,
    CreatedAt: []const u8 = "",
    UpdatedAt: []const u8 = "",
};

pub const ProductSchema = Schema(&.{
    .{ "SKU", .{ .field_type = .string, .required = true, .min_length = 1, .max_length = 50 } },
    .{ "Name", .{ .field_type = .string, .required = true, .min_length = 1, .max_length = 200 } },
    .{ "CategoryID", .{ .field_type = .int, .required = true, .min = 1 } },
    .{ "BasePrice", .{ .field_type = .double, .required = true, .min = 0 } },
});

pub const CategorySchema = Schema(&.{
    .{ "Name", .{ .field_type = .string, .required = true, .min_length = 1, .max_length = 100 } },
});

pub const ProductParams = struct {
    id: ?[]const u8 = null,
    category: ?[]const u8 = null,
    q: ?[]const u8 = null,
};

pub const CreateProductBody = struct {
    SKU: []const u8,
    Name: []const u8,
    Description: ?[]const u8 = null,
    CategoryID: i32,
    BasePrice: f64,
    ImageURL: ?[]const u8 = null,
    Attributes: ?[]const u8 = null,
};

pub const CreateCategoryBody = struct {
    Name: []const u8,
    Description: ?[]const u8 = null,
};
