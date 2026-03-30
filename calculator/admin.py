from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "price", "pv", "is_active", "display_order")
    list_filter = ("is_active",)
    search_fields = ("name", "sku")
    ordering = ("display_order", "name")

# Register your models here.
