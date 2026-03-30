from django.shortcuts import render
from django.db.utils import OperationalError, ProgrammingError

from .data import PRODUCTS
from .models import Product


def calculator_view(request):
    try:
        db_products = list(Product.objects.filter(is_active=True).values())
    except (OperationalError, ProgrammingError):
        db_products = []

    products = db_products or PRODUCTS
    context = {
        "page_title": "PV Smart",
        "products": products,
        "customer_name": "บมนัสิก ชุมชน",
        "order_date": "30 มีนาคม 2569",
    }
    return render(request, "calculator/home.html", context)
