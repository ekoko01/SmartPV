import json
from decimal import Decimal, InvalidOperation

from django.http import JsonResponse
from django.shortcuts import render
from django.db import transaction
from django.db.utils import OperationalError, ProgrammingError
from django.views.decorators.http import require_POST

from .data import PRODUCTS
from .models import Order, OrderItem, Product


def calculator_view(request):
    try:
        db_products = list(Product.objects.filter(is_active=True).values())
    except (OperationalError, ProgrammingError):
        db_products = []

    products = db_products or PRODUCTS
    context = {
        "page_title": "PV Smart",
        "products": products,
    }
    return render(request, "calculator/home.html", context)


@require_POST
def save_order_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid_json"}, status=400)

    customer_name = (payload.get("customer_name") or "").strip()
    items = payload.get("items") or []

    if not customer_name:
        return JsonResponse({"error": "missing_customer_name"}, status=400)

    if not items:
        return JsonResponse({"error": "missing_items"}, status=400)

    normalized_items = []
    total_price = Decimal("0.00")
    total_pv = Decimal("0.00")

    try:
        product_map = {product.sku: product for product in Product.objects.filter(is_active=True)}
    except (OperationalError, ProgrammingError):
        product_map = {}

    try:
        for item in items:
            product_sku = str(item["product_sku"])
            quantity = int(item["quantity"])
            if quantity <= 0:
                continue

            product = product_map.get(product_sku)
            if not product:
                return JsonResponse({"error": f"invalid_product_{product_sku}"}, status=400)

            unit_price = Decimal(product.price)
            unit_pv = Decimal(product.pv)
            line_total = unit_price * quantity
            line_pv = unit_pv * quantity

            normalized_items.append(
                {
                    "product": product,
                    "product_name": product.name,
                    "unit_price": unit_price,
                    "unit_pv": unit_pv,
                    "quantity": quantity,
                    "line_total": line_total,
                    "line_pv": line_pv,
                }
            )
            total_price += line_total
            total_pv += line_pv
    except (KeyError, TypeError, ValueError, InvalidOperation):
        return JsonResponse({"error": "invalid_items"}, status=400)

    if not normalized_items:
        return JsonResponse({"error": "missing_items"}, status=400)

    with transaction.atomic():
        order = Order.objects.create(
            customer_name=customer_name,
            total_price=total_price,
            total_pv=total_pv,
            line_count=len(normalized_items),
            saved_by_name="",
        )
        OrderItem.objects.bulk_create(
            [
                OrderItem(order=order, **item)
                for item in normalized_items
            ]
        )

    return JsonResponse(
        {
            "status": "ok",
            "order_id": order.id,
            "snapshot_generated_at": order.snapshot_generated_at.isoformat(),
        }
    )
