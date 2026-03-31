from django.contrib import admin
from django.db.models import Max

from .models import Product


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

# Register your models here.
