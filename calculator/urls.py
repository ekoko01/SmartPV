from django.urls import path

from .views import calculator_view, save_order_view

app_name = "calculator"

urlpatterns = [
    path("", calculator_view, name="home"),
    path("api/orders/save/", save_order_view, name="save_order"),
]
