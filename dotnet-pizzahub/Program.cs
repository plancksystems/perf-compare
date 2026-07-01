using System.Text;
using System.Text.Json;
using System.Net;
using System.Globalization;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

// Use default host and port bindings

var app = builder.Build();

// SQLite Connection String
var connectionString = "Data Source=pizzahub.db;Cache=Shared;Mode=ReadWriteCreate;";

// Initialize and Seed Database on Startup
await InitializeDatabaseAsync(connectionString);

app.MapGet("/categories", async (HttpContext context) =>
{
    var categories = new List<Category>();
    using (var conn = new SqliteConnection(connectionString))
    {
        await conn.OpenAsync();
        using (var cmd = new SqliteCommand("SELECT CategoryID, Name, Description, CreatedAt FROM categories ORDER BY CategoryID ASC", conn))
        using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                categories.Add(new Category(
                    reader.GetInt32(0),
                    reader.GetString(1),
                    reader.IsDBNull(2) ? null : reader.GetString(2),
                    reader.GetString(3)
                ));
            }
        }
    }
    var html = CategoryList.Render(categories);
    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.WriteAsync(html);
});

app.MapGet("/products", async (HttpContext context) =>
{
    var categoryRaw = context.Request.Query["category"].ToString();
    var q = context.Request.Query["q"].ToString().Trim();

    int? categoryId = null;
    if (!string.IsNullOrEmpty(categoryRaw) && int.TryParse(categoryRaw, out var catId) && catId > 0)
    {
        categoryId = catId;
    }

    var products = new List<Product>();
    using (var conn = new SqliteConnection(connectionString))
    {
        await conn.OpenAsync();
        
        var sql = "SELECT ProductID, SKU, Name, Description, CategoryID, BasePrice, ImageURL, Attributes, CreatedAt, UpdatedAt FROM products WHERE 1=1";
        if (categoryId.HasValue)
        {
            sql += " AND CategoryID = @categoryId";
        }
        if (!string.IsNullOrEmpty(q))
        {
            sql += " AND Name LIKE @q";
        }
        sql += " LIMIT 200";

        using (var cmd = new SqliteCommand(sql, conn))
        {
            if (categoryId.HasValue)
            {
                cmd.Parameters.AddWithValue("@categoryId", categoryId.Value);
            }
            if (!string.IsNullOrEmpty(q))
            {
                cmd.Parameters.AddWithValue("@q", "%" + q + "%");
            }

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    products.Add(new Product(
                        reader.GetInt32(0),
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.IsDBNull(3) ? null : reader.GetString(3),
                        reader.GetInt32(4),
                        reader.GetDouble(5),
                        reader.IsDBNull(6) ? null : reader.GetString(6),
                        reader.IsDBNull(7) ? null : reader.GetString(7),
                        reader.GetString(8),
                        reader.GetString(9)
                    ));
                }
            }
        }
    }

    var html = ProductList.Render(products);
    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.WriteAsync(html);
});

app.Run();

async Task InitializeDatabaseAsync(string connStr)
{
    using (var conn = new SqliteConnection(connStr))
    {
        await conn.OpenAsync();

        var sql = @"
            CREATE TABLE IF NOT EXISTS categories (
                CategoryID INTEGER PRIMARY KEY,
                Name TEXT NOT NULL,
                Description TEXT,
                CreatedAt TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS products (
                ProductID INTEGER PRIMARY KEY,
                SKU TEXT NOT NULL,
                Name TEXT NOT NULL,
                Description TEXT,
                CategoryID INTEGER NOT NULL,
                BasePrice REAL NOT NULL,
                ImageURL TEXT,
                Attributes TEXT,
                CreatedAt TEXT NOT NULL,
                UpdatedAt TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_products_category ON products(CategoryID);
            CREATE INDEX IF NOT EXISTS idx_products_name ON products(Name);
        ";
        using (var cmd = new SqliteCommand(sql, conn))
        {
            await cmd.ExecuteNonQueryAsync();
        }

        // Check if categories table is empty
        using (var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM categories", conn))
        {
            var count = (long)(await checkCmd.ExecuteScalarAsync() ?? 0L);
            if (count == 0)
            {
                await SeedDatabaseAsync(conn);
            }
        }
    }
}

async Task SeedDatabaseAsync(SqliteConnection conn)
{
    string? seedDir = null;
    var pathsToTry = new[] {
        "../planck-pizzahub/app/seed",
        "seed",
        "/Users/kamlesh/plancksystems/perf/planck-pizzahub/app/seed"
    };

    foreach (var path in pathsToTry)
    {
        if (Directory.Exists(path))
        {
            seedDir = path;
            break;
        }
    }

    if (seedDir == null)
    {
        Console.WriteLine("Warning: Could not locate seed directory.");
        return;
    }

    var categoriesPath = Path.Combine(seedDir, "categories.json");
    var productsPath = Path.Combine(seedDir, "products.json");

    if (File.Exists(categoriesPath))
    {
        var json = await File.ReadAllTextAsync(categoriesPath);
        var categories = JsonSerializer.Deserialize<List<SeedCategory>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (categories != null)
        {
            using (var tx = conn.BeginTransaction())
            {
                foreach (var cat in categories)
                {
                    using (var cmd = new SqliteCommand("INSERT INTO categories (CategoryID, Name, Description, CreatedAt) VALUES (@id, @name, @desc, @created)", conn, tx))
                    {
                        cmd.Parameters.AddWithValue("@id", cat.CategoryID);
                        cmd.Parameters.AddWithValue("@name", cat.Name);
                        cmd.Parameters.AddWithValue("@desc", (object?)cat.Description ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@created", DateTime.UtcNow.ToString("o"));
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
                tx.Commit();
            }
        }
    }

    if (File.Exists(productsPath))
    {
        var json = await File.ReadAllTextAsync(productsPath);
        var products = JsonSerializer.Deserialize<List<SeedProduct>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (products != null)
        {
            using (var tx = conn.BeginTransaction())
            {
                foreach (var prod in products)
                {
                    using (var cmd = new SqliteCommand(@"
                        INSERT INTO products (ProductID, SKU, Name, Description, CategoryID, BasePrice, ImageURL, Attributes, CreatedAt, UpdatedAt) 
                        VALUES (@id, @sku, @name, @desc, @catId, @price, @img, @attr, @created, @updated)", conn, tx))
                    {
                        cmd.Parameters.AddWithValue("@id", prod.ProductID);
                        cmd.Parameters.AddWithValue("@sku", prod.SKU);
                        cmd.Parameters.AddWithValue("@name", prod.Name);
                        cmd.Parameters.AddWithValue("@desc", (object?)prod.Description ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@catId", prod.CategoryID);
                        cmd.Parameters.AddWithValue("@price", prod.BasePrice);
                        cmd.Parameters.AddWithValue("@img", (object?)prod.ImageURL ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@attr", (object?)prod.Attributes ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@created", DateTime.UtcNow.ToString("o"));
                        cmd.Parameters.AddWithValue("@updated", DateTime.UtcNow.ToString("o"));
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
                tx.Commit();
            }
        }
    }
}


public record Category(int CategoryID, string Name, string? Description, string CreatedAt);
public record Product(int ProductID, string SKU, string Name, string? Description, int CategoryID, double BasePrice, string? ImageURL, string? Attributes, string CreatedAt, string UpdatedAt);

public class SeedCategory
{
    public int CategoryID { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
}

public class SeedProduct
{
    public int ProductID { get; set; }
    public string SKU { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int CategoryID { get; set; }
    public double BasePrice { get; set; }
    public string? ImageURL { get; set; }
    public string? Attributes { get; set; }
}

public static class CategoryList
{
    public static string Render(List<Category> categories)
    {
        var sb = new StringBuilder();
        sb.Append("<aside id=\"category-list\" class=\"w-56 min-w-[14rem] bg-white border-r border-slate-200 overflow-y-auto shrink-0 p-4\">");
        sb.Append("<h2 class=\"text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3\">Categories</h2>");
        sb.Append("<button class=\"w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition hover:bg-blue-50 hover:text-blue-700 category-btn\" data-category=\"all\">All Items</button>");
        foreach (var cat in categories)
        {
            var categoryId = cat.CategoryID;
            var nameEscaped = WebUtility.HtmlEncode(cat.Name);
            sb.Append($"<button class=\"w-full text-left px-3 py-2 rounded-lg text-sm transition hover:bg-blue-50 hover:text-blue-700 category-btn\" data-category=\"{categoryId}\" data-on:click=\"@get('/products?category={categoryId}')\">{nameEscaped}</button>");
        }
        sb.Append("</aside>");
        return sb.ToString();
    }
}

public static class ProductList
{
    public static string Render(List<Product> products)
    {
        var sb = new StringBuilder();
        sb.Append("<div id=\"content\" class=\"p-4 lg:p-6\">");
        if (products.Count == 0)
        {
            sb.Append("<div class=\"flex flex-col items-center justify-center py-20 text-slate-400\">");
            sb.Append("<svg class=\"w-16 h-16 mb-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">");
            sb.Append("<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4\"></path>");
            sb.Append("</svg>");
            sb.Append("<p class=\"text-lg font-medium\">No products found</p>");
            sb.Append("<p class=\"text-sm mt-1\">Try selecting a different category</p>");
            sb.Append("</div>");
        }
        else
        {
            sb.Append("<div class=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4\">");
            foreach (var product in products)
            {
                var productID = product.ProductID;
                var basePrice = product.BasePrice.ToString(CultureInfo.InvariantCulture);
                var nameEscaped = WebUtility.HtmlEncode(product.Name);
                
                sb.Append("<div class=\"bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col\">");
                sb.Append("<div class=\"relative h-48 bg-slate-100 overflow-hidden\">");
                if (product.ImageURL != null)
                {
                    var imageUrlEscaped = WebUtility.HtmlEncode(product.ImageURL);
                    sb.Append($"<img src=\"{imageUrlEscaped}\" alt=\"{nameEscaped}\" class=\"w-full h-full object-cover\" loading=\"lazy\" />");
                }
                else
                {
                    sb.Append("<div class=\"w-full h-full flex items-center justify-center text-slate-300\">");
                    sb.Append("<svg class=\"w-12 h-12\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">");
                    sb.Append("<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\"></path>");
                    sb.Append("</svg>");
                    sb.Append("</div>");
                }
                sb.Append("</div>");
                sb.Append("<div class=\"p-4 flex-1 flex flex-col\">");
                sb.Append($"<h3 class=\"font-semibold text-slate-800 text-sm leading-tight mb-1 line-clamp-2\">{nameEscaped}</h3>");
                if (product.Description != null)
                {
                    var descEscaped = WebUtility.HtmlEncode(product.Description);
                    sb.Append($"<p class=\"text-xs text-slate-400 mb-3 line-clamp-2\">{descEscaped}</p>");
                }
                sb.Append("<div class=\"mt-auto flex items-center justify-between pt-2 border-t border-slate-100\">");
                sb.Append($"<span class=\"text-lg font-bold text-slate-800\">₹{basePrice}</span>");
                sb.Append("<div class=\"flex items-center gap-2\">");
                sb.Append($"<button class=\"p-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition\" data-product-id=\"{productID}\" data-on:click=\"@post('/items', {{contentType: 'json', payload: {{ productId: {productID}, name: '{nameEscaped}', unitPrice: {basePrice}, qty: 1}}}})\" title=\"Add to cart\">");
                sb.Append("<svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">");
                sb.Append("<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 4v16m8-8H4\"></path>");
                sb.Append("</svg>");
                sb.Append("</button>");
                sb.Append("</div>");
                sb.Append("</div>");
                sb.Append("</div>");
                sb.Append("</div>");
            }
            sb.Append("</div>");
        }
        sb.Append("</div>");
        return sb.ToString();
    }
}
