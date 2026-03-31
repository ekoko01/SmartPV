from django.contrib import admin
from django.db.models import Max, Sum

from .models import Order, OrderItem, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    change_list_template = "admin/calculator/product/change_list.html"
    list_display = (
        "name",
        "display_order",
        "sku",
        "price",
        "pv",
        "highlight",
        "is_active",
        "updated_at",
    )
    list_display_links = ("name",)
    list_editable = ("display_order", "price", "pv", "highlight", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "sku")
    ordering = ("display_order", "name")
    list_per_page = 25
    save_on_top = True
    actions = ("activate_products", "deactivate_products", "resequence_display_order")
    fieldsets = (
        ("ข้อมูลสินค้า", {"fields": ("name", "sku", "description", "highlight")}),
        ("ราคาและคะแนน", {"fields": ("price", "pv")}),
        ("การแสดงผล", {"fields": ("display_order", "is_active")}),
        ("ข้อมูลระบบ", {"fields": ("created_at", "updated_at")}),
    )
    readonly_fields = ("created_at", "updated_at")

    def changelist_view(self, request, extra_context=None):
        queryset = self.get_queryset(request)
        extra_context = extra_context or {}
        extra_context["catalog_summary"] = {
            "total_products": queryset.count(),
            "active_products": queryset.filter(is_active=True).count(),
            "inactive_products": queryset.filter(is_active=False).count(),
            "highest_pv": queryset.aggregate(max_pv=Max("pv"))["max_pv"] or 0,
        }
        return super().changelist_view(request, extra_context=extra_context)

    @admin.action(description="เปิดใช้งานสินค้าที่เลือก")
    def activate_products(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"เปิดใช้งานแล้ว {updated} รายการ")

    @admin.action(description="ปิดใช้งานสินค้าที่เลือก")
    def deactivate_products(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"ปิดใช้งานแล้ว {updated} รายการ")

    @admin.action(description="จัดลำดับแสดงผลใหม่ตามลำดับปัจจุบัน")
    def resequence_display_order(self, request, queryset):
        for index, product in enumerate(queryset.order_by("display_order", "name"), start=1):
            product.display_order = index
            product.save(update_fields=["display_order", "updated_at"])
        self.message_user(request, f"จัดลำดับใหม่แล้ว {queryset.count()} รายการ")

    class Media:
        css = {"all": ("admin/pvsmart-admin.css",)}


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = (
        "product_name",
        "unit_price",
        "unit_pv",
        "quantity",
        "line_total",
        "line_pv",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "customer_name",
        "line_count",
        "total_price",
        "total_pv",
        "snapshot_generated_at",
        "saved_by_name",
    )
    list_filter = ("snapshot_generated_at",)
    date_hierarchy = "snapshot_generated_at"
    search_fields = ("customer_name", "items__product_name")
    readonly_fields = (
        "customer_name",
        "line_count",
        "total_price",
        "total_pv",
        "snapshot_generated_at",
        "saved_by_name",
        "created_at",
    )
    inlines = [OrderItemInline]

    def changelist_view(self, request, extra_context=None):
        queryset = self.get_queryset(request)
        extra_context = extra_context or {}
        totals = queryset.aggregate(
            gross_sales=Sum("total_price"),
            gross_pv=Sum("total_pv"),
            total_orders=Sum("line_count"),
        )
        extra_context["order_summary"] = {
            "gross_sales": totals["gross_sales"] or 0,
            "gross_pv": totals["gross_pv"] or 0,
            "total_orders": queryset.count(),
        }
        return super().changelist_view(request, extra_context=extra_context)

# Register your models here.
